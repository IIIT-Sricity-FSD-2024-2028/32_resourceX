import { Injectable, BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { RequestRecord } from '../common/domain';
import { RequestContext } from '../common/roles';
import { DataService } from '../data/data.service';
import { CreateRequestDto, EditRequestDto, UpdateRequestDto } from './dto/request.dto';
import {
  getActingUser,
  ensureActor,
  ensureDepartmentScoped,
  ensureValidDepartmentResourceType,
  resourceMatchesType,
} from '../common/utils';

const MIN_REQUIREMENT_LEAD_DAYS = 2;
const LETTER_MIME_TYPES = ['application/pdf', 'image/png', 'image/jpeg'];
const MAX_LETTER_BYTES = 5 * 1024 * 1024;

// The request letter / proof arrives inline as a base64 data-URL; check its type and size
function ensureValidLetter(dataUrl?: string): void {
  if (!dataUrl) return;
  const match = /^data:([^;,]+);base64,/.exec(dataUrl);
  if (!match || !LETTER_MIME_TYPES.includes(match[1])) {
    throw new BadRequestException('Request letter must be a PDF, PNG or JPG file.');
  }
  const bytes = Math.floor(((dataUrl.length - match[0].length) * 3) / 4);
  if (bytes > MAX_LETTER_BYTES) {
    throw new BadRequestException('Request letter is too large (max 5 MB).');
  }
}

// Requestors must ask at least MIN_REQUIREMENT_LEAD_DAYS ahead of the requirement date
function ensureRequirementLeadTime(requirementDate: string): void {
  const earliest = new Date();
  earliest.setHours(0, 0, 0, 0);
  earliest.setDate(earliest.getDate() + MIN_REQUIREMENT_LEAD_DAYS);
  const [y, m, d] = requirementDate.slice(0, 10).split('-').map(Number);
  if (new Date(y, m - 1, d) < earliest) {
    throw new BadRequestException(
      `Requirement date must be at least ${MIN_REQUIREMENT_LEAD_DAYS} days after the request date.`
    );
  }
}

@Injectable()
export class RequestsService {
  constructor(private readonly dataService: DataService) {}

  private purgeExpiredRequests(): void {
    const all = this.dataService.getRequests();
    const now = Date.now();

    for (const req of all) {
      if (req.status !== 'Allocated' && req.status !== 'Completed') {
        const dateStr = req.requirementDate;
        if (dateStr) {
          const parsed = Date.parse(dateStr);
          if (!isNaN(parsed)) {
            const deadline = new Date(parsed);
            deadline.setHours(23, 59, 59, 999);
            if (now > deadline.getTime()) {
              this.dataService.deleteRequest(req.id);
            }
          }
        }
      }
    }
  }

  getAll(context: RequestContext, filters?: { status?: string; department?: string }): RequestRecord[] {
    // Automatically purge requests whose requirement date has crossed and are not yet allocated
    this.purgeExpiredRequests();

    const user = getActingUser(this.dataService, context);
    let items = this.dataService.getRequests();

    // 0. Organization isolation — always scope to the user's org first
    if (context.organizationId) {
      items = items.filter((r) => r.organizationId === context.organizationId);
    }

    // 1. Role-based scoping within the org
    if (context.role !== 'System Admin' && context.role !== 'Registrar') {
      if (context.role === 'Dept Head' || context.role === 'Inventory Officer' || context.role === 'Maintenance Officer' || context.role === 'Procurement Officer') {
        items = items.filter((request) => request.department === user?.department);
      } else if (context.role === 'Requestor') {
        items = items.filter(
          (request) =>
            request.requestorId === user?.id || request.requestor === user?.name
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
    return items;
  }

  create(payload: CreateRequestDto, context: RequestContext): RequestRecord {
    const user = getActingUser(this.dataService, context);
    const department = payload.department || user?.department || 'Unassigned';

    // Skip type catalog check for auto-generated procurement allocation requests —
    // the resource type was already validated during procurement approval
    if (!payload.procurementId) {
      ensureValidDepartmentResourceType(this.dataService, department, payload.resourceType, context.organizationId);
    }

    // Requestors must ask at least 2 days ahead (auto-generated procurement requests are exempt)
    if (!payload.procurementId && payload.requirementDate) {
      ensureRequirementLeadTime(payload.requirementDate);
    }
    ensureValidLetter(payload.letterFileDataUrl);

    const request: RequestRecord = {
      ...payload,
      id: payload.id || `REQ-${Date.now()}`,
      organizationId: context.organizationId || 'ORG-001',
      department,
      requestor: payload.requestor || user?.name || 'Unknown User',
      requestorId: payload.requestorId || user?.id,
      status: payload.status || 'Pending',
      date: payload.date || new Date().toLocaleDateString('en-US'),
      createdAt: new Date().toISOString(),
    };

    const saved = this.dataService.insertRequest(request);
    this.dataService.notify({
      organizationId: saved.organizationId,
      recipientRole: 'Dept Head',
      department: saved.department,
      title: 'New resource request',
      targetType: 'request',
      targetId: saved.id,
      description: `${saved.requestor} requested ${saved.quantity} x ${saved.resourceType} (${saved.id}). Review it in Incoming Requests.`,
    });
    return saved;
  }

  update(id: string, payload: UpdateRequestDto): RequestRecord {
    return this.dataService.updateRequest(id, payload);
  }

  // Loads a request and makes sure the acting requestor owns it (System Admin may act on any)
  private getOwnedRequest(id: string, context: RequestContext): RequestRecord {
    const request = this.dataService.getRequestById(id);
    if (!request) {
      throw new NotFoundException(`Request with ID ${id} not found.`);
    }
    if (context.role !== 'System Admin') {
      const user = ensureActor(this.dataService, context);
      const owns = request.requestorId ? request.requestorId === user.id : request.requestor === user.name;
      if (!owns) {
        throw new ForbiddenException('You can only manage your own requests.');
      }
    }
    return request;
  }

  edit(id: string, payload: EditRequestDto, context: RequestContext): RequestRecord {
    const request = this.getOwnedRequest(id, context);
    if (request.status !== 'Pending') {
      throw new BadRequestException('A request can only be edited before the department head reviews it.');
    }

    const updates: Partial<RequestRecord> = {};
    if (payload.resourceType !== undefined && payload.resourceType !== request.resourceType) {
      ensureValidDepartmentResourceType(this.dataService, request.department, payload.resourceType, request.organizationId);
      updates.resourceType = payload.resourceType;
    }
    if (payload.quantity !== undefined) updates.quantity = payload.quantity;
    if (payload.priority !== undefined) updates.priority = payload.priority;
    if (payload.justification !== undefined) {
      if (!payload.justification.trim()) {
        throw new BadRequestException('Justification cannot be empty.');
      }
      updates.justification = payload.justification.trim();
    }
    if (payload.requirementDate !== undefined && payload.requirementDate !== request.requirementDate) {
      ensureRequirementLeadTime(payload.requirementDate);
      updates.requirementDate = payload.requirementDate;
      updates.requirementDateDisplay = payload.requirementDateDisplay;
    }
    if (payload.returnDate !== undefined) {
      updates.returnDate = payload.returnDate;
      updates.returnDateDisplay = payload.returnDateDisplay;
    }
    if (payload.letterFileDataUrl) {
      ensureValidLetter(payload.letterFileDataUrl);
      updates.letterFileName = payload.letterFileName;
      updates.letterFileType = payload.letterFileType;
      updates.letterFileDataUrl = payload.letterFileDataUrl;
    }
    const requirementDate = updates.requirementDate ?? request.requirementDate;
    const returnDate = updates.returnDate ?? request.returnDate;
    if (requirementDate && returnDate && returnDate.slice(0, 10) <= requirementDate.slice(0, 10)) {
      throw new BadRequestException('Return date must be after the requirement date.');
    }

    const edited = this.dataService.updateRequest(id, { ...updates, updatedAt: new Date().toISOString() });
    this.dataService.notify({
      organizationId: request.organizationId,
      recipientRole: 'Dept Head',
      department: request.department,
      title: 'Request updated',
      targetType: 'request',
      targetId: id,
      description: `${request.requestor} edited request ${id} (${edited.quantity} x ${edited.resourceType}).`,
    });
    return edited;
  }

  cancel(id: string, reason: string | undefined, context: RequestContext): RequestRecord {
    const request = this.getOwnedRequest(id, context);
    if (request.status !== 'Pending' && request.status !== 'Approved') {
      throw new BadRequestException('A request can only be cancelled before resources are allocated.');
    }

    const cancelled = this.dataService.updateRequest(id, {
      status: 'Cancelled',
      cancelledAt: new Date().toISOString(),
      cancelReason: reason?.trim() || undefined,
    });
    const description = `${request.requestor} cancelled request ${id} (${request.quantity} x ${request.resourceType}).`;
    this.dataService.notify({
      organizationId: request.organizationId,
      recipientRole: 'Dept Head',
      department: request.department,
      title: 'Request cancelled',
      targetType: 'request',
      targetId: id,
      description,
    });
    // Once approved, the request sits in the inventory officer's allocation queue too
    if (request.status === 'Approved') {
      this.dataService.notify({
        organizationId: request.organizationId,
        recipientRole: 'Inventory Officer',
        department: request.department,
        title: 'Request cancelled',
        targetType: 'request',
        targetId: id,
        description: `${description} No allocation is needed.`,
      });
    }
    return cancelled;
  }

  approve(id: string, context?: RequestContext): RequestRecord {
    const request = this.dataService.getRequestById(id);
    if (!request) {
      throw new NotFoundException(`Request with ID ${id} not found.`);
    }
    if (context) {
      // Dept Heads may only act on requests from their own department
      ensureDepartmentScoped(this.dataService, context, request.department);
    }
    if (request.status !== 'Pending') {
      throw new BadRequestException('Can only approve pending requests.');
    }

    // Approve only when the department has enough available stock. Units already promised to
    // other approved requests that are still waiting for allocation are not counted as available.
    const sameTypeInDept = (item: { organizationId: string; department: string }) =>
      item.organizationId === request.organizationId && item.department === request.department;
    const availableCount = this.dataService
      .getResources()
      .filter((r) => sameTypeInDept(r) && r.status === 'Available' && resourceMatchesType(r, request.resourceType)).length;
    const reservedCount = this.dataService
      .getRequests()
      .filter((r) => r.id !== id && sameTypeInDept(r) && r.status === 'Approved' && resourceMatchesType({ type: r.resourceType }, request.resourceType))
      .reduce((sum, r) => sum + (Number(r.quantity) || 0), 0);
    const freeCount = Math.max(availableCount - reservedCount, 0);
    if (freeCount < request.quantity) {
      throw new BadRequestException(
        `Not enough quantity in inventory: ${request.quantity} x ${request.resourceType} requested, ` +
          `only ${freeCount} available in ${request.department}` +
          (reservedCount > 0 ? ` (${reservedCount} already reserved for approved requests).` : '.')
      );
    }

    const approver = context ? getActingUser(this.dataService, context) : undefined;
    const approved = this.dataService.updateRequest(id, {
      status: 'Approved',
      approvedAt: new Date().toISOString(),
      approvedBy: approver?.name,
    });
    this.dataService.notify({
      organizationId: request.organizationId,
      recipientRole: 'Requestor',
      recipientUserId: request.requestorId,
      title: 'Request approved',
      targetType: 'request',
      targetId: id,
      description: `Your request ${id} for ${request.resourceType} was approved by the department head.`,
    });
    this.dataService.notify({
      organizationId: request.organizationId,
      recipientRole: 'Inventory Officer',
      department: request.department,
      title: 'Request ready for allocation',
      targetType: 'request',
      targetId: id,
      description: `Request ${id} (${request.quantity} x ${request.resourceType}) was approved and awaits allocation.`,
    });
    return approved;
  }

  reject(id: string, reason: string | undefined, context?: RequestContext): RequestRecord {
    const request = this.dataService.getRequestById(id);
    if (!request) {
      throw new NotFoundException(`Request with ID ${id} not found.`);
    }
    if (context) {
      ensureDepartmentScoped(this.dataService, context, request.department);
    }
    if (request.status !== 'Pending') {
      throw new BadRequestException('Can only reject pending requests.');
    }
    if (!reason?.trim()) {
      throw new BadRequestException('A rejection reason is required.');
    }
    const rejecter = context ? getActingUser(this.dataService, context) : undefined;
    const rejected = this.dataService.updateRequest(id, {
      status: 'Rejected',
      rejectedAt: new Date().toISOString(),
      rejectedBy: rejecter?.name,
      rejectionReason: reason.trim(),
    });
    this.dataService.notify({
      organizationId: request.organizationId,
      recipientRole: 'Requestor',
      recipientUserId: request.requestorId,
      title: 'Request rejected',
      targetType: 'request',
      targetId: id,
      description: `Your request ${id} for ${request.resourceType} was rejected by the department head. Reason: ${reason.trim()}`,
    });
    return rejected;
  }

  allocate(id: string, resourceIds: string[], context: RequestContext): RequestRecord {
    const request = this.dataService.getRequestById(id);
    if (!request) {
      throw new NotFoundException(`Request with ID ${id} not found.`);
    }

    ensureDepartmentScoped(this.dataService, context, request.department);
    if (request.status !== 'Approved') {
      throw new BadRequestException('Can only allocate resources for approved requests.');
    }

    if (resourceIds.length !== request.quantity) {
      throw new BadRequestException('Number of allocated resources must match requested quantity.');
    }

    // Validate resource statuses and types
    for (const resId of resourceIds) {
      const resource = this.dataService.getResourceById(resId);
      if (!resource) {
        throw new NotFoundException(`Resource with ID ${resId} not found.`);
      }
      if (resource.status !== 'Available') {
        throw new BadRequestException('Only available resources can be allocated.');
      }
      if (!resourceMatchesType(resource, request.resourceType)) {
        throw new BadRequestException('Resource type does not match request.');
      }
    }

    // Allocate resources
    for (const resId of resourceIds) {
      this.dataService.updateResource(resId, {
        status: 'Allocated',
        assignedTo: request.requestor,
        assignedToId: request.requestorId,
        date: new Date().toLocaleDateString('en-US'),
        returnDate: request.returnDate,
        returnDateDisplay: request.returnDateDisplay,
      });
    }

    const allocated = this.dataService.updateRequest(id, {
      status: 'Allocated',
      assignedResources: resourceIds.join(', '),
      allocatedAt: new Date().toISOString(),
      allocatedBy: getActingUser(this.dataService, context)?.name ?? request.allocatedBy,
    });
    this.dataService.notify({
      organizationId: request.organizationId,
      recipientRole: 'Requestor',
      recipientUserId: request.requestorId,
      title: 'Resource allocated',
      targetType: 'request',
      targetId: id,
      description: `${request.quantity} x ${request.resourceType} was allocated for request ${id}. Please confirm receipt.`,
    });
    this.dataService.notify({
      organizationId: request.organizationId,
      recipientRole: 'Dept Head',
      department: request.department,
      title: 'Resource allocated',
      targetType: 'request',
      targetId: id,
      description: `Request ${id} from ${request.requestor} (${request.resourceType}) has been allocated.`,
    });
    return allocated;
  }

  delete(id: string): RequestRecord {
    const deleted = this.dataService.deleteRequest(id);
    if (!deleted) {
      throw new NotFoundException(`Request with ID ${id} not found.`);
    }
    return deleted;
  }

  confirmReceipt(id: string, context: RequestContext): RequestRecord {
    const request = this.dataService.getRequestById(id);
    if (!request) {
      throw new NotFoundException(`Request with ID ${id} not found.`);
    }

    const user = ensureActor(this.dataService, context);
    if (request.status !== 'Allocated') {
      throw new BadRequestException('Can only confirm receipt for allocated requests.');
    }

    // Firmly ensure all allocated resources for this request are linked to this requestor
    if (request.assignedResources) {
      const resIds = request.assignedResources.split(',').map((s) => s.trim()).filter(Boolean);
      for (const resId of resIds) {
        const existing = this.dataService.getResourceById(resId);
        if (existing) {
          this.dataService.updateResource(resId, {
            status: 'Allocated',
            assignedTo: request.requestor || user.name,
            assignedToId: request.requestorId || user.id,
            returnDate: request.returnDate || existing.returnDate,
            returnDateDisplay: request.returnDateDisplay || existing.returnDateDisplay,
          });
        }
      }
    } else {
      // If assignedResources wasn't previously set, find or allocate available resources of matching type
      const avail = this.dataService.getResources().filter(
        (r) =>
          r.organizationId === request.organizationId &&
          r.department === request.department &&
          resourceMatchesType(r, request.resourceType) &&
          (r.status === 'Allocated' && (r.assignedToId === user.id || r.assignedTo === user.name) || r.status === 'Available')
      );
      const toAssign = avail.slice(0, request.quantity);
      for (const r of toAssign) {
        this.dataService.updateResource(r.id, {
          status: 'Allocated',
          assignedTo: request.requestor || user.name,
          assignedToId: request.requestorId || user.id,
          returnDate: request.returnDate,
          returnDateDisplay: request.returnDateDisplay,
        });
      }
      if (toAssign.length > 0) {
        this.dataService.updateRequest(id, {
          assignedResources: toAssign.map((r) => r.id).join(', '),
        });
      }
    }

    return this.dataService.updateRequest(id, { status: 'Completed', receivedAt: new Date().toISOString() });
  }
}
