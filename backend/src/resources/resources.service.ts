import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { DepartmentResourceCatalogRecord, ResourceRecord } from '../common/domain';
import { RequestContext } from '../common/roles';
import { DataService } from '../data/data.service';
import { CreateResourceDto, UpdateResourceDto, UpdateCatalogDto } from './dto/resource.dto';
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
        items = items.filter(
          (resource) =>
            resource.assignedToId === user?.id || resource.assignedTo === user?.name
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

  requestMaintenance(id: string, context: RequestContext): ResourceRecord {
    const resource = this.dataService.getResourceById(id);
    if (!resource) {
      throw new NotFoundException(`Resource with ID ${id} not found.`);
    }

    ensureDepartmentScoped(this.dataService, context, resource.department);
    if (resource.status !== 'Allocated' && resource.status !== 'Available') {
      throw new BadRequestException('Only Allocated or Available resources can go to maintenance.');
    }

    return this.dataService.updateResource(id, { status: 'Maintenance Requested' });
  }

  initiateReturn(id: string, context: RequestContext): ResourceRecord {
    const resource = this.dataService.getResourceById(id);
    if (!resource) {
      throw new NotFoundException(`Resource with ID ${id} not found.`);
    }

    ensureDepartmentScoped(this.dataService, context, resource.department);
    if (resource.status !== 'Allocated') {
      throw new BadRequestException('Only Allocated resources can be returned.');
    }

    return this.dataService.updateResource(id, { status: 'Returned' });
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
}
