import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { UserRecord } from '../common/domain';
import { RequestContext, Role } from '../common/roles';
import { DataService } from '../data/data.service';
import { EMPLOYEE_EMAIL_PATTERN, buildOrgEmail, validateOrgEmail } from '../common/email-format';
import { PASSWORD_PATTERN, PASSWORD_RULE_MESSAGE } from '../common/password';
import { BulkImportRow, CreateEmployeeDto, CreateUserDto, UpdateEmployeeDto, UpdateUserDto } from './dto/user.dto';

// Roles a System Admin may create, plus the spellings people tend to type in a spreadsheet
const IMPORTABLE_ROLES: Record<string, Role> = {
  requestor: 'Requestor',
  'dept head': 'Dept Head',
  'department head': 'Dept Head',
  hod: 'Dept Head',
  registrar: 'Registrar',
  'inventory officer': 'Inventory Officer',
  'maintenance officer': 'Maintenance Officer',
  'procurement officer': 'Procurement Officer',
};
const ROLES_WITHOUT_DEPARTMENT: Role[] = ['Requestor', 'Registrar'];

export interface BulkImportResult {
  created: Array<{ row: number; id: string; name: string; email: string; role: string; generatedPassword?: string }>;
  failed: Array<{ row: number; name: string; email: string; error: string }>;
}

const DOCUMENT_TYPES = ['application/pdf', 'image/png', 'image/jpeg'];
const MAX_DOCUMENT_BYTES = 5 * 1024 * 1024;

// Every account needs a document, imported or not; returns the validated document fields
function rowDocument(raw: BulkImportRow) {
  const name = cell(raw.documentFileName);
  const type = cell(raw.documentFileType);
  const dataUrl = typeof raw.documentFileDataUrl === 'string' ? raw.documentFileDataUrl : '';
  if (!name || !dataUrl) throw new BadRequestException('A document file is required for this account.');
  const prefix = `data:${type};base64,`;
  if (!DOCUMENT_TYPES.includes(type) || !dataUrl.startsWith(prefix)) {
    throw new BadRequestException(`Document "${name}" must be a PDF, PNG or JPG file.`);
  }
  if (Math.floor(((dataUrl.length - prefix.length) * 3) / 4) > MAX_DOCUMENT_BYTES) {
    throw new BadRequestException(`Document "${name}" is too large (max 5 MB).`);
  }
  return { documentFileName: name.slice(0, 100), documentFileType: type, documentFileDataUrl: dataUrl };
}

const cell = (value: unknown): string => (value === undefined || value === null ? '' : String(value).trim());

// Temporary password that satisfies PASSWORD_PATTERN (uppercase, digit, symbol, 8+ chars)
const generatePassword = (): string => `Rx@${Math.floor(100000 + Math.random() * 900000)}Pw`;

@Injectable()
export class UsersService {
  constructor(private readonly dataService: DataService) {}

  getMockUser(role: string, orgId?: string): Partial<UserRecord> {
    const users = this.dataService.getUsers();
    const user = users.find(u => {
      if (orgId) {
        return u.role === role && u.organizationId === orgId;
      }
      return u.role === role;
    });

    if (!user) {
      throw new NotFoundException(`No mock user found for role: ${role} in org: ${orgId}`);
    }

    return { email: user.email, password: user.password };
  }

  getAll(context: RequestContext): UserRecord[] {
    const users = this.dataService.getUsers();
    // Owner sees all platform employees; System Admin sees all users in their org
    if (context.role === 'Owner') {
      return users;
    }
    if (context.role === 'System Admin' || context.role === 'Guest') {
      return users.filter((u) => u.organizationId === context.organizationId);
    }

    const actingUser = context.userId ? this.dataService.getUserById(context.userId) : undefined;
    if (!actingUser) {
      return [];
    }
    return [actingUser];
  }

  /** Owner creates a new platform Employee */
  createEmployee({ name, email, password, documentFileName, documentFileType, documentFileDataUrl }: CreateEmployeeDto): UserRecord {
    if (!EMPLOYEE_EMAIL_PATTERN.test(email.trim())) {
      throw new BadRequestException('Employee email must be in the format employee{number}@resourcex.com (e.g. employee6@resourcex.com).');
    }
    if (this.dataService.getUserByEmail(email)) {
      throw new BadRequestException('An account with this email already exists.');
    }
    const users = this.dataService.getUsers();
    const empCount = users.filter(u => u.role === 'Employee').length;
    const newId = `EMP-${String(empCount + 1).padStart(3, '0')}-${Date.now()}`;
    const user: UserRecord = {
      id: newId,
      organizationId: 'PLATFORM',
      name,
      email,
      password,
      role: 'Employee',
      status: 'Active',
      preferences: { notifications: true },
      documentFileName,
      documentFileType,
      documentFileDataUrl,
    };
    return this.dataService.insertUser(user);
  }

  /** Owner creates many platform Employees from a spreadsheet; each row succeeds or fails on its own */
  bulkCreateEmployees(rows: BulkImportRow[]): BulkImportResult {
    const result: BulkImportResult = { created: [], failed: [] };
    rows.forEach((raw, index) => {
      const row = Number(raw.row) || index + 2;
      const name = cell(raw.name);
      let email = cell(raw.email).toLowerCase();
      try {
        if (!name) throw new BadRequestException('Name is required.');
        if (!email) email = this.nextEmployeeEmail();
        let password = cell(raw.password);
        const generatedPassword = password ? undefined : generatePassword();
        password = password || generatedPassword!;
        if (!PASSWORD_PATTERN.test(password)) throw new BadRequestException(PASSWORD_RULE_MESSAGE);
        const document = rowDocument(raw);

        const user = this.createEmployee({ name, email, password, ...document });
        result.created.push({ row, id: user.id, name: user.name, email: user.email, role: user.role, generatedPassword });
      } catch (err: any) {
        result.failed.push({ row, name, email, error: err?.message || 'Could not create this employee.' });
      }
    });
    return result;
  }

  private nextEmployeeEmail(): string {
    const numbers = this.dataService
      .getUsers()
      .map((u) => /^employee([0-9]+)@resourcex\.com$/i.exec(u.email)?.[1])
      .filter(Boolean)
      .map(Number);
    return `employee${(numbers.length ? Math.max(...numbers) : 0) + 1}@resourcex.com`;
  }

  /** Owner edits an employee: name, document, and the full set of organizations they manage */
  updateEmployee(id: string, dto: UpdateEmployeeDto): UserRecord {
    const employee = this.getEmployee(id);
    const updates: Partial<UserRecord> = {};
    if (dto.name !== undefined) updates.name = dto.name.trim();
    if (dto.documentFileDataUrl) {
      updates.documentFileName = dto.documentFileName;
      updates.documentFileType = dto.documentFileType;
      updates.documentFileDataUrl = dto.documentFileDataUrl;
    }

    if (dto.organizationIds) {
      if (dto.organizationIds.length > 0 && employee.status !== 'Active') {
        throw new BadRequestException(`${employee.name} is ${employee.status.toLowerCase()} and cannot be assigned organizations.`);
      }
      const organizations = this.dataService.getOrganizations();
      const unknown = dto.organizationIds.filter((orgId) => !organizations.some((o) => o.id === orgId));
      if (unknown.length) {
        throw new BadRequestException(`Organization not found: ${unknown.join(', ')}.`);
      }
      for (const org of organizations) {
        const selected = dto.organizationIds.includes(org.id);
        if (selected && org.assignedEmployeeId !== id) {
          this.dataService.updateOrganization(org.id, { assignedEmployeeId: id });
        } else if (!selected && org.assignedEmployeeId === id) {
          this.dataService.updateOrganization(org.id, { assignedEmployeeId: undefined });
        }
      }
    }

    return Object.keys(updates).length ? this.dataService.updateUser(id, updates) : employee;
  }

  /** Owner removes an employee; their organizations become unassigned */
  removeEmployee(id: string): { removed: UserRecord; unassignedOrganizations: string[] } {
    this.getEmployee(id);
    const unassignedOrganizations: string[] = [];
    for (const org of this.dataService.getOrganizations()) {
      if (org.assignedEmployeeId === id) {
        this.dataService.updateOrganization(org.id, { assignedEmployeeId: undefined });
        unassignedOrganizations.push(org.id);
      }
    }
    return { removed: this.dataService.deleteUser(id), unassignedOrganizations };
  }

  private getEmployee(id: string): UserRecord {
    const user = this.dataService.getUserById(id);
    if (!user || user.role !== 'Employee') {
      throw new NotFoundException(`Employee with ID ${id} not found.`);
    }
    return user;
  }

  create(context: RequestContext, payload: CreateUserDto): UserRecord {
    const orgId = context.organizationId || 'ORG-001';
    const orgName = this.dataService.getOrganizationById(orgId)?.name || '';
    const formatError = validateOrgEmail(payload.email, payload.role, orgName);
    if (formatError) {
      throw new BadRequestException(formatError);
    }
    if (this.dataService.getUserByEmail(payload.email)) {
      throw new BadRequestException('An account with this email already exists.');
    }
    const department = this.resolveDepartment(orgId, payload.role, payload.department);
    const users = this.dataService.getUsers();
    const newId = `U${users.length + 1}_${Date.now()}`;
    const user: UserRecord = {
      id: newId,
      ...payload,
      department,
      organizationId: orgId,
      status: payload.status || 'Active',
      preferences: { notifications: true }
    };
    if (!department) delete user.department;
    const created = this.dataService.insertUser(user);
    this.syncDepartmentHead(orgId, created);
    return created;
  }

  /** System Admin creates many users from a spreadsheet; each row succeeds or fails on its own */
  bulkCreate(context: RequestContext, rows: BulkImportRow[]): BulkImportResult {
    const orgId = context.organizationId || 'ORG-001';
    const orgName = this.dataService.getOrganizationById(orgId)?.name || '';
    const orgDepartments = this.dataService.getDepartments().filter((d) => d.organizationId === orgId);
    const result: BulkImportResult = { created: [], failed: [] };

    rows.forEach((raw, index) => {
      const row = Number(raw.row) || index + 2;
      const name = cell(raw.name);
      let email = cell(raw.email).toLowerCase();
      try {
        if (!name) throw new BadRequestException('Name is required.');
        const role = IMPORTABLE_ROLES[cell(raw.role).toLowerCase().replace(/\s+/g, ' ')];
        if (!role) {
          throw new BadRequestException(`Role "${cell(raw.role)}" is not valid. Use one of: Requestor, Dept Head, Registrar, Inventory Officer, Maintenance Officer, Procurement Officer.`);
        }
        if (!email) email = buildOrgEmail(name, role, orgName) || '';

        let department: string | undefined;
        if (!ROLES_WITHOUT_DEPARTMENT.includes(role)) {
          const wanted = cell(raw.department).toLowerCase();
          if (!wanted) throw new BadRequestException(`A department is required for ${role}.`);
          department = orgDepartments.find((d) => d.name.toLowerCase() === wanted)?.name;
          if (!department) throw new BadRequestException(`Department "${cell(raw.department)}" not found.`);
        }

        let password = cell(raw.password);
        const generatedPassword = password ? undefined : generatePassword();
        password = password || generatedPassword!;
        if (password.length < 8) throw new BadRequestException('Password must be at least 8 characters.');
        const document = rowDocument(raw);

        const user = this.create(context, { name, email, role, department, password, status: 'Active', ...document } as CreateUserDto);
        result.created.push({ row, id: user.id, name: user.name, email: user.email, role: user.role, generatedPassword });
      } catch (err: any) {
        result.failed.push({ row, name, email, error: err?.message || 'Could not create this user.' });
      }
    });
    return result;
  }

  update(id: string, payload: UpdateUserDto, context: RequestContext): UserRecord {
    const existing = this.getScopedUser(id, context);
    const orgId = existing.organizationId || context.organizationId || 'ORG-001';
    const updates: UpdateUserDto = { ...payload };
    // Passwords are not changed through the edit-access form
    delete updates.password;
    if (updates.email && updates.email.toLowerCase() !== existing.email.toLowerCase()) {
      const orgName = this.dataService.getOrganizationById(orgId)?.name || '';
      const formatError = validateOrgEmail(updates.email, updates.role || existing.role, orgName);
      if (formatError) {
        throw new BadRequestException(formatError);
      }
      const clash = this.dataService.getUserByEmail(updates.email);
      if (clash && clash.id !== id) {
        throw new BadRequestException('An account with this email already exists.');
      }
    }
    const role = updates.role || existing.role;
    if (updates.role !== undefined || updates.department !== undefined) {
      updates.department = this.resolveDepartment(orgId, role, updates.department ?? existing.department, id);
    }
    const updated = this.dataService.updateUser(id, updates);
    // Release the old department if this user stopped heading it
    if (existing.role === 'Dept Head' && existing.department &&
        (updated.role !== 'Dept Head' || updated.department !== existing.department)) {
      this.clearDepartmentHead(orgId, existing.department, existing.name);
    }
    this.syncDepartmentHead(orgId, updated);
    return updated;
  }

  /**
   * Requestors and Registrars are general actors (no department). A Dept Head needs a department
   * that does not already have a head (one head per department).
   */
  private resolveDepartment(orgId: string, role: string, department?: string, selfId?: string): string | undefined {
    if (role === 'Requestor' || role === 'Registrar' || role === 'System Admin' || role === 'Owner' || role === 'Employee') {
      return undefined;
    }
    if (role === 'Dept Head') {
      if (!department) {
        throw new BadRequestException('A department is required for a Department Head.');
      }
      const dept = this.dataService.getDepartments().find((d) => d.organizationId === orgId && d.name === department);
      if (!dept) {
        throw new BadRequestException(`Department "${department}" not found.`);
      }
      const other = this.dataService
        .getUsers()
        .find((u) => u.id !== selfId && u.organizationId === orgId && u.role === 'Dept Head' && u.department === department && u.status !== 'Inactive');
      if (other) {
        throw new BadRequestException(`Department "${department}" already has a head (${other.name}).`);
      }
    }
    return department;
  }

  private syncDepartmentHead(orgId: string, user: UserRecord): void {
    if (user.role !== 'Dept Head' || !user.department) return;
    const dept = this.dataService.getDepartments().find((d) => d.organizationId === orgId && d.name === user.department);
    if (dept) this.dataService.updateDepartment(dept.id, { head: user.name });
  }

  private clearDepartmentHead(orgId: string, departmentName: string, headName: string): void {
    const dept = this.dataService.getDepartments().find((d) => d.organizationId === orgId && d.name === departmentName);
    if (dept && dept.head === headName) this.dataService.updateDepartment(dept.id, { head: '' });
  }

  deactivate(id: string, context: RequestContext): UserRecord {
    const existing = this.getScopedUser(id, context);
    if (existing.role === 'Dept Head' && existing.department) {
      this.clearDepartmentHead(existing.organizationId || context.organizationId || 'ORG-001', existing.department, existing.name);
    }
    return this.dataService.updateUser(id, { status: 'Inactive' });
  }

  updateStatus(id: string, status: 'Active' | 'Suspended', context: RequestContext) {
    this.getScopedUser(id, context);
    return this.dataService.updateUser(id, { status });
  }

  private getScopedUser(id: string, context: RequestContext): UserRecord {
    const user = this.dataService.getUserById(id);
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found.`);
    }
    if (context.role !== 'Owner' && context.organizationId && user.organizationId !== context.organizationId) {
      throw new NotFoundException(`User with ID ${id} not found.`);
    }
    return user;
  }
}
