import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { DataService } from '../data/data.service';
import { validateOrgEmail } from '../common/email-format';
import { RegisterOrgDto } from './dto/organization.dto';
import { OrganizationRecord, OrganizationStatus, UserRecord } from '../common/domain';

@Injectable()
export class OrganizationsService {
  constructor(private readonly dataService: DataService) {}

  getAll(): OrganizationRecord[] {
    return this.dataService.getOrganizations();
  }

  getPublicOrganizations(): Partial<OrganizationRecord>[] {
    return this.dataService.getOrganizations()
      .filter(org => org.status === 'Active')
      .map(org => ({ id: org.id, name: org.name }));
  }

  register(payload: RegisterOrgDto): OrganizationRecord {
    // Basic validations
    if (!payload.name || !payload.adminName || !payload.adminEmail || !payload.password || !payload.subscriptionPlanId) {
      throw new BadRequestException('Missing required fields for organization registration.');
    }

    // Verify subscription plan exists
    const plans = this.dataService.getSubscriptionPlans();
    if (!plans.some(p => p.id === payload.subscriptionPlanId)) {
      throw new BadRequestException('Invalid subscription plan ID.');
    }

    // adminEmail becomes this org's System Admin login below, so it has to be unique
    // across the whole platform the same way any other user's email would be.
    if (this.dataService.getUserByEmail(payload.adminEmail)) {
      throw new BadRequestException('An account with this email already exists.');
    }

    const formatError = validateOrgEmail(payload.adminEmail, 'System Admin', payload.name);
    if (formatError) {
      throw new BadRequestException(formatError);
    }

    const orgId = `ORG-${Date.now()}`;
    const newOrg: OrganizationRecord = {
      id: orgId,
      name: payload.name,
      adminEmail: payload.adminEmail,
      subscriptionPlanId: payload.subscriptionPlanId,
      status: 'Pending',
      revenueGenerated: 0,
      adminName: payload.adminName,
      adminProofFileName: payload.adminProofFileName,
      adminProofFileType: payload.adminProofFileType,
      adminProofFileDataUrl: payload.adminProofFileDataUrl,
      orgProofFileName: payload.orgProofFileName,
      orgProofFileType: payload.orgProofFileType,
      orgProofFileDataUrl: payload.orgProofFileDataUrl,
    };

    // Registering an organization also provisions its first user: the System Admin
    // who filled out this form, logging in with the password they just chose (an
    // Owner still has to approve the organization itself before it's usable — see
    // approveOrganization/updateStatus — but the account exists from this point on).
    const adminUser: UserRecord = {
      id: `SA-${orgId}`,
      organizationId: orgId,
      name: payload.adminName,
      email: payload.adminEmail,
      password: payload.password,
      role: 'System Admin',
      status: 'Active',
      preferences: { notifications: true },
    };
    this.dataService.insertUser(adminUser);

    return this.dataService.insertOrganization(newOrg);
  }

  updateStatus(id: string, status: OrganizationStatus, employeeId?: string): OrganizationRecord {
    const org = this.dataService.getOrganizationById(id);
    if (!org) {
      throw new NotFoundException(`Organization with ID ${id} not found.`);
    }

    const updates: Partial<OrganizationRecord> = { status };
    if (employeeId) {
      updates.assignedEmployeeId = employeeId;
    }

    return this.dataService.updateOrganization(id, updates);
  }

  /** Owner changes which platform employee manages an organization */
  assignEmployee(id: string, employeeId: string): OrganizationRecord {
    const org = this.dataService.getOrganizationById(id);
    if (!org) {
      throw new NotFoundException(`Organization with ID ${id} not found.`);
    }
    const employee = this.dataService.getUserById(employeeId);
    if (!employee || employee.role !== 'Employee') {
      throw new BadRequestException(`Employee ${employeeId} not found.`);
    }
    if (employee.status !== 'Active') {
      throw new BadRequestException(`${employee.name} is ${employee.status.toLowerCase()} and cannot be assigned organizations.`);
    }
    return this.dataService.updateOrganization(id, { assignedEmployeeId: employeeId });
  }

  getMyOrganization(orgId: string): OrganizationRecord {
    const org = this.dataService.getOrganizationById(orgId);
    if (!org) {
      throw new NotFoundException(`Organization not found.`);
    }
    return org;
  }

  updateSubscription(orgId: string, planId: string): OrganizationRecord {
    const org = this.dataService.getOrganizationById(orgId);
    if (!org) {
      throw new NotFoundException(`Organization not found.`);
    }
    const plans = this.dataService.getSubscriptionPlans();
    if (!plans.some(p => p.id === planId)) {
      throw new BadRequestException('Invalid subscription plan ID.');
    }
    return this.dataService.updateOrganization(orgId, { subscriptionPlanId: planId });
  }
}
