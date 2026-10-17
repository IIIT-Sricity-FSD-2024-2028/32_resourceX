import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { RequestRecord } from '../common/domain';
import { RequestContext } from '../common/roles';
import { DataService } from '../data/data.service';
import { CreateRequestDto, UpdateRequestDto } from './dto/request.dto';
import {
  getActingUser,
  ensureActor,
  ensureDepartmentScoped,
  ensureValidDepartmentResourceType,
  resourceMatchesType,
} from '../common/utils';

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

    const request: RequestRecord = {
      ...payload,
      id: payload.id || `REQ-${Date.now()}`,
      organizationId: context.organizationId || 'ORG-001',
      department,
      requestor: payload.requestor || user?.name || 'Unknown User',
      requestorId: payload.requestorId || user?.id,
      status: payload.status || 'Pending',
      date: payload.date || new Date().toLocaleDateString('en-US'),
    };

    return this.dataService.insertRequest(request);
  }

  update(id: string, payload: UpdateRequestDto): RequestRecord {
    return this.dataService.updateRequest(id, payload);
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
    return this.dataService.updateRequest(id, { status: 'Approved' });
  }

  reject(id: string, context?: RequestContext): RequestRecord {
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
    return this.dataService.updateRequest(id, { status: 'Rejected' });
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

    return this.dataService.updateRequest(id, {
      status: 'Allocated',
      assignedResources: resourceIds.join(', ')
    });
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

    return this.dataService.updateRequest(id, { status: 'Completed' });
  }
}
