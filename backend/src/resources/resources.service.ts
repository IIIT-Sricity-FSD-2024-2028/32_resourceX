import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { DepartmentResourceCatalogRecord, ResourceRecord } from '../common/domain';
import { RequestContext } from '../common/roles';
import { DataService } from '../data/data.service';
import { CreateResourceDto, UpdateResourceDto, UpdateCatalogDto, RequestMaintenanceDto, InitiateReturnDto, RequestExtensionDto, RejectExtensionDto } from './dto/resource.dto';
import {
  getActingUser,
  ensureActor,
  resourceMatchesType,
  ensureValidDepartmentResourceType,
  ensureDepartmentScoped,
} from '../common/utils';

@Injectable()
export class ResourcesService {
  constructor(private readonly dataService: DataService) { }

  getAll(
    context: RequestContext,
    filters?: { status?: string; department?: string; type?: string; assignedToId?: string }
  ): ResourceRecord[] {
    const user = getActingUser(this.dataService, context);
    let items = this.dataService.getResources();

    // 0. Organization isolation — always scope to the user's org first
    if (context.organizationId) {
      items = items.filter((r) => r.organizationId === context.organizationId);
    }

    // 1. Role-based scoping within the org
    if (context.role !== 'System Admin' && context.role !== 'Registrar') {
      if (context.role === 'Dept Head' || context.role === 'Inventory Officer' || context.role === 'Maintenance Officer' || context.role === 'Procurement Officer') {
        items = items.filter((resource) => resource.department === user?.department);
      } else if (context.role === 'Requestor') {
        const uName = user?.name ? user.name.toLowerCase().trim() : '';
        items = items.filter(
          (resource) =>
            ((user?.id && resource.assignedToId === user.id) ||
             (uName && resource.assignedTo && resource.assignedTo.toLowerCase().trim() === uName)) &&
            ['Allocated', 'Maintenance Requested', 'Maintenance', 'Repaired'].includes(resource.status)
        );
      } else {
        items = [];
      }
    }

    // 2. Query filters
    if (filters?.status && filters.status !== 'All') {
      const statuses = filters.status.split(',').map((value) => value.trim());
      items = items.filter((item) => statuses.includes(item.status));
    }
    if (filters?.department && filters.department !== 'All') {
      items = items.filter((item) => item.department === filters.department);
    }
    if (filters?.type) {
      items = items.filter((item) => resourceMatchesType(item, filters.type!));
    }
    if (filters?.assignedToId) {
      items = items.filter((item) => item.assignedToId === filters.assignedToId);
    }

    return items;
  }

  getCatalog(department?: string): DepartmentResourceCatalogRecord[] {
    const catalog = this.dataService.getResourceCatalog();
    if (!department || department === 'All') {
      return catalog;
    }
    return catalog.filter((item) => item.department === department);
  }

  getAvailability(department: string, type: string): { availableCount: number } {
    const resources = this.dataService.getResources();
    const count = resources.filter(
      (item) =>
        item.department === department &&
        item.status === 'Available' &&
        resourceMatchesType(item, type)
    ).length;
    return { availableCount: count };
  }

  create(payload: CreateResourceDto, context: RequestContext): ResourceRecord {
    const user = getActingUser(this.dataService, context);
    const department = payload.department || user?.department || 'Unassigned';

    ensureActor(this.dataService, context);
    ensureDepartmentScoped(this.dataService, context, department);
    ensureValidDepartmentResourceType(this.dataService, department, payload.type, context.organizationId);

    const resource: ResourceRecord = {
      id: `RES-${Date.now()}`,
      organizationId: context.organizationId || 'ORG-001',
      ...payload,
      department,
      status: payload.status || 'Available',
      condition: payload.condition || 'Good',
      assignedTo: payload.assignedTo || 'None',
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    };

    return this.dataService.insertResource(resource);
  }

  update(id: string, payload: UpdateResourceDto): ResourceRecord {
    return this.dataService.updateResource(id, payload);
  }

  requestMaintenance(id: string, dto: RequestMaintenanceDto | undefined, context: RequestContext): ResourceRecord {
    const resource = this.dataService.getResourceById(id);
    if (!resource) {
      throw new NotFoundException(`Resource with ID ${id} not found.`);
    }

    ensureDepartmentScoped(this.dataService, context, resource.department);
    if (resource.status !== 'Allocated' && resource.status !== 'Available') {
      throw new BadRequestException('Only Allocated or Available resources can go to maintenance.');
    }

    this.dataService.notify({
      organizationId: resource.organizationId,
      recipientRole: 'Maintenance Officer',
      department: resource.department,
      title: 'Maintenance requested',
      targetType: 'resource',
      targetId: resource.id,
      description: `${resource.name || resource.type} (${resource.id}) needs maintenance: ${dto?.issue || 'General Maintenance Requested'}.`,
    });
    return this.dataService.updateResource(id, {
      status: 'Maintenance Requested',
      maintenanceIssue: dto?.issue || resource.maintenanceIssue || 'General Maintenance Requested',
      maintenancePriority: dto?.priority || resource.maintenancePriority || 'Medium',
      maintenanceRequestDate: new Date().toLocaleDateString('en-US'),
    });
  }

  initiateReturn(id: string, dto: InitiateReturnDto | undefined, context: RequestContext): ResourceRecord {
    const resource = this.dataService.getResourceById(id);
    if (!resource) {
      throw new NotFoundException(`Resource with ID ${id} not found.`);
    }

    ensureDepartmentScoped(this.dataService, context, resource.department);
    if (resource.status !== 'Allocated') {
      throw new BadRequestException('Only Allocated resources can be returned.');
    }

    this.dataService.notify({
      organizationId: resource.organizationId,
      recipientRole: 'Inventory Officer',
      department: resource.department,
      title: 'Return initiated',
      targetType: 'resource',
      targetId: resource.id,
      description: `${resource.name || resource.type} (${resource.id}) was returned by ${resource.assignedTo || 'a requestor'}. Please inspect and accept it.`,
    });
    this.dataService.notify({
      organizationId: resource.organizationId,
      recipientRole: 'Dept Head',
      department: resource.department,
      title: 'Return initiated',
      targetType: 'resource',
      targetId: resource.id,
      description: `${resource.name || resource.type} (${resource.id}) was returned by ${resource.assignedTo || 'a requestor'}.`,
    });
    return this.dataService.updateResource(id, {
      status: 'Returned',
      returnReason: dto?.reason || 'Return Requested',
      returnNotes: dto?.notes || '',
    });
  }

  confirmRepaired(id: string, context: RequestContext): ResourceRecord {
    const resource = this.dataService.getResourceById(id);
    if (!resource) {
      throw new NotFoundException(`Resource with ID ${id} not found.`);
    }

    ensureDepartmentScoped(this.dataService, context, resource.department);
    if (resource.status !== 'Repaired') {
      throw new BadRequestException('Only Repaired resources can be confirmed.');
    }

    return this.dataService.updateResource(id, { status: 'Allocated' });
  }

  scrap(id: string): ResourceRecord {
    const resource = this.dataService.getResourceById(id);
    if (!resource) {
      throw new NotFoundException(`Resource with ID ${id} not found.`);
    }
    return this.dataService.updateResource(id, { status: 'Scrapped' });
  }

  updateCatalog(dto: UpdateCatalogDto, context: RequestContext): DepartmentResourceCatalogRecord {
    ensureActor(this.dataService, context);
    if (context.role !== 'System Admin') {
      throw new ForbiddenException('Only System Admins can update the resource catalog.');
    }
    const orgId = context.organizationId || 'ORG-001';
    return this.dataService.updateResourceCatalog(orgId, dto.department, dto.resourceTypes);
  }

  requestExtension(id: string, dto: RequestExtensionDto, context: RequestContext): ResourceRecord {
    const user = ensureActor(this.dataService, context);
    const resource = this.dataService.getResourceById(id);
    if (!resource) {
      throw new NotFoundException(`Resource with ID ${id} not found.`);
    }

    if (resource.status !== 'Allocated') {
      throw new BadRequestException('Only Allocated resources can be requested for deadline extension.');
    }

    if (context.role === 'Requestor') {
      if (resource.assignedToId && resource.assignedToId !== user.id && resource.assignedTo !== user.name) {
        throw new ForbiddenException('You can only request extension for resources allocated to you.');
      }
    }

    if (!dto.proposedReturnDate) {
      throw new BadRequestException('Proposed return date is required.');
    }

    const proposedTime = Date.parse(dto.proposedReturnDate);
    if (isNaN(proposedTime)) {
      throw new BadRequestException('Invalid proposed return date format.');
    }

    const todayStart = new Date().setHours(0, 0, 0, 0);
    const currTime = resource.returnDate ? Date.parse(resource.returnDate) : NaN;
    if (!isNaN(currTime) && currTime > todayStart) {
      if (proposedTime <= currTime) {
        throw new BadRequestException(`Proposed return date must be strictly after current return date (${resource.returnDateDisplay || resource.returnDate}).`);
      }
    } else {
      if (proposedTime < todayStart) {
        throw new BadRequestException('Proposed return date must be today or in the future.');
      }
    }

    const displayDate = new Date(proposedTime).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

    const updated = this.dataService.updateResource(id, {
      extensionStatus: 'Pending',
      extensionProposedReturnDate: dto.proposedReturnDate,
      extensionProposedReturnDateDisplay: displayDate,
      extensionReason: dto.reason || 'Need additional time to complete allocation work',
      extensionRequestDate: new Date().toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }),
      extensionRequestedBy: user.name,
      extensionRequestedById: user.id,
    });

    // Notify Department Head
    this.dataService.insertNotification({
      id: `NOTIF-EXT-REQ-${id}-${Date.now()}`,
      organizationId: context.organizationId || resource.organizationId || 'ORG-001',
      title: `📝 Extension Request: ${resource.name || resource.type}`,
      targetType: 'resource',
      targetId: resource.id,
      description: `${user.name} requested an extension for "${resource.name || resource.type}" (${resource.id}) until ${displayDate}. Reason: ${dto.reason}`,
      time: 'Just now',
      read: false,
      recipientRole: 'Dept Head',
    });

    // Notify Requestor
    this.dataService.insertNotification({
      id: `NOTIF-EXT-SUBMIT-${id}-${Date.now()}`,
      organizationId: context.organizationId || resource.organizationId || 'ORG-001',
      title: `⏳ Extension Submitted: ${resource.name || resource.type}`,
      targetType: 'resource',
      targetId: resource.id,
      description: `Your extension request until ${displayDate} for "${resource.name || resource.type}" (${resource.id}) has been submitted for Department Head approval.`,
      time: 'Just now',
      read: false,
      recipientRole: 'Requestor',
    });

    return updated;
  }

  approveExtension(id: string, context: RequestContext): ResourceRecord {
    ensureActor(this.dataService, context);
    if (context.role !== 'Dept Head' && context.role !== 'System Admin') {
      throw new ForbiddenException('Only Department Heads or System Admins can approve resource extensions.');
    }

    const resource = this.dataService.getResourceById(id);
    if (!resource) {
      throw new NotFoundException(`Resource with ID ${id} not found.`);
    }

    ensureDepartmentScoped(this.dataService, context, resource.department);

    if (resource.extensionStatus !== 'Pending') {
      throw new BadRequestException('Resource does not have a pending extension request.');
    }

    const newReturnDate = resource.extensionProposedReturnDate || resource.returnDate;
    const newReturnDateDisplay = resource.extensionProposedReturnDateDisplay || resource.returnDateDisplay;

    const updated = this.dataService.updateResource(id, {
      returnDate: newReturnDate,
      returnDateDisplay: newReturnDateDisplay,
      extensionStatus: 'Approved',
    });

    // Sync any linked requests
    const requests = this.dataService.getRequests();
    const matchingReq = requests.find((r) => r.assignedResources?.includes(id));
    if (matchingReq) {
      this.dataService.updateRequest(matchingReq.id, {
        returnDate: newReturnDate,
        returnDateDisplay: newReturnDateDisplay,
      });
    }

    // Clean up any overdue notifications for this resource now that deadline is extended
    const notifs = this.dataService.getNotifications();
    const overdueNotif = notifs.find((n) => n.id === `NOTIF-RETURN-OVERDUE-${id}`);
    if (overdueNotif) {
      this.dataService.updateNotification(overdueNotif.id, { read: true });
    }

    // Notify Requestor
    this.dataService.insertNotification({
      id: `NOTIF-EXT-APP-${id}-${Date.now()}`,
      organizationId: context.organizationId || resource.organizationId || 'ORG-001',
      title: `✅ Extension Approved: ${resource.name || resource.type}`,
      targetType: 'resource',
      targetId: resource.id,
      description: `Your extension request for "${resource.name || resource.type}" (${resource.id}) was APPROVED. New return deadline: ${newReturnDateDisplay || newReturnDate}.`,
      time: 'Just now',
      read: false,
      recipientRole: 'Requestor',
    });

    return updated;
  }

  rejectExtension(id: string, dto: RejectExtensionDto | undefined, context: RequestContext): ResourceRecord {
    ensureActor(this.dataService, context);
    if (context.role !== 'Dept Head' && context.role !== 'System Admin') {
      throw new ForbiddenException('Only Department Heads or System Admins can reject resource extensions.');
    }

    const resource = this.dataService.getResourceById(id);
    if (!resource) {
      throw new NotFoundException(`Resource with ID ${id} not found.`);
    }

    ensureDepartmentScoped(this.dataService, context, resource.department);

    if (resource.extensionStatus !== 'Pending') {
      throw new BadRequestException('Resource does not have a pending extension request.');
    }

    const updated = this.dataService.updateResource(id, {
      extensionStatus: 'Rejected',
    });

    // Notify Requestor
    this.dataService.insertNotification({
      id: `NOTIF-EXT-REJ-${id}-${Date.now()}`,
      organizationId: context.organizationId || resource.organizationId || 'ORG-001',
      title: `❌ Extension Rejected: ${resource.name || resource.type}`,
      targetType: 'resource',
      targetId: resource.id,
      description: `Your extension request for "${resource.name || resource.type}" (${resource.id}) was REJECTED.${dto?.reason ? ` Reason: ${dto.reason}.` : ''} Please return the asset by the current deadline (${resource.returnDateDisplay || resource.returnDate}).`,
      time: 'Just now',
      read: false,
      recipientRole: 'Requestor',
    });

    return updated;
  }
}

