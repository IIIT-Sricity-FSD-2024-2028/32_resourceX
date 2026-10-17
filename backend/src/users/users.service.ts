import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { UserRecord } from '../common/domain';
import { RequestContext } from '../common/roles';
import { DataService } from '../data/data.service';
import { EMPLOYEE_EMAIL_PATTERN, validateOrgEmail } from '../common/email-format';
import { CreateEmployeeDto, CreateUserDto, UpdateEmployeeDto, UpdateUserDto } from './dto/user.dto';

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
