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

    const saved = this.dataService.insertOrganization(newOrg);
    this.dataService.notify({
      organizationId: 'PLATFORM',
      recipientRole: 'Owner',
      title: 'New organization registration',
      targetType: 'organization',
      targetId: saved.id,
      description: `${saved.name} registered (admin: ${saved.adminName}, ${saved.adminEmail}) and is awaiting approval.`,
    });
    return saved;
  }

  updateStatus(id: string, status: OrganizationStatus, employeeId?: string, actorRole?: string): OrganizationRecord {
    const org = this.dataService.getOrganizationById(id);
    if (!org) {
      throw new NotFoundException(`Organization with ID ${id} not found.`);
    }

    const updates: Partial<OrganizationRecord> = { status };
    if (employeeId) {
      updates.assignedEmployeeId = employeeId;
    }

    const updated = this.dataService.updateOrganization(id, updates);
    if (org.status === status) {
      return updated;
    }

    const verb = org.status === 'Pending' && status === 'Active' ? 'approved' : status === 'Suspended' ? 'suspended' : 'reactivated';
    this.dataService.notify({
      organizationId: id,
      recipientRole: 'System Admin',
      title: `Organization ${verb}`,
      targetType: 'organization',
      targetId: id,
      description:
        verb === 'approved'
          ? `${updated.name} has been approved. Your organization is now active on ResourceX.`
          : verb === 'suspended'
            ? `${updated.name} has been suspended. Please contact support for details.`
            : `${updated.name} has been reactivated.`,
    });
    // Keep the other platform party informed: the owner when an employee acts, the employee when the owner acts
    if (actorRole === 'Employee') {
      this.dataService.notify({
        organizationId: 'PLATFORM',
        recipientRole: 'Owner',
        title: `Organization ${verb}`,
        targetType: 'organization',
        targetId: id,
        description: `${updated.name} was ${verb} by its account employee.`,
      });
    } else if (updated.assignedEmployeeId) {
      this.dataService.notify({
        organizationId: 'PLATFORM',
        recipientRole: 'Employee',
        recipientUserId: updated.assignedEmployeeId,
        title: verb === 'approved' ? 'Organization assigned to you' : `Organization ${verb}`,
        targetType: 'organization',
        targetId: id,
        description: verb === 'approved'
          ? `${updated.name} was approved and assigned to you.`
          : `${updated.name} was ${verb} by the platform owner.`,
      });
    }
    return updated;
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
    const updated = this.dataService.updateOrganization(id, { assignedEmployeeId: employeeId });
    if (org.assignedEmployeeId !== employeeId) {
      this.dataService.notify({
        organizationId: 'PLATFORM',
        recipientRole: 'Employee',
        recipientUserId: employeeId,
        title: 'Organization assigned to you',
        targetType: 'organization',
        targetId: id,
        description: `You are now the account employee for ${updated.name}.`,
      });
      if (org.assignedEmployeeId) {
        this.dataService.notify({
          organizationId: 'PLATFORM',
          recipientRole: 'Employee',
          recipientUserId: org.assignedEmployeeId,
          title: 'Organization reassigned',
          targetType: 'organization',
          targetId: id,
          description: `${updated.name} was reassigned to ${employee.name}.`,
        });
      }
      this.dataService.notify({
        organizationId: id,
        recipientRole: 'System Admin',
        title: 'New account employee',
        targetType: 'organization',
        targetId: id,
        description: `${employee.name} is now your ResourceX support contact.`,
      });
    }
    return updated;
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
    const updated = this.dataService.updateOrganization(orgId, { subscriptionPlanId: planId });
    if (org.subscriptionPlanId !== planId) {
      const plan = plans.find(p => p.id === planId);
      const description = `${updated.name} changed its subscription plan to ${plan?.name || planId}.`;
      this.dataService.notify({
        organizationId: 'PLATFORM',
        recipientRole: 'Owner',
        title: 'Subscription changed',
        targetType: 'organization',
        targetId: orgId,
        description,
      });
      if (updated.assignedEmployeeId) {
        this.dataService.notify({
          organizationId: 'PLATFORM',
          recipientRole: 'Employee',
          recipientUserId: updated.assignedEmployeeId,
          title: 'Subscription changed',
          targetType: 'organization',
          targetId: orgId,
          description,
        });
      }
    }
    return updated;
  }
}
