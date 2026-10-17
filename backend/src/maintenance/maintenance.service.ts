import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { RequestContext } from '../common/roles';
import { DataService } from '../data/data.service';
import { ResourceRecord, MaintenanceHistoryRecord } from '../common/domain';
import { getActingUser, ensureDepartmentScoped } from '../common/utils';

@Injectable()
export class MaintenanceService {
  constructor(private readonly dataService: DataService) {}

  getHistory(context: RequestContext): MaintenanceHistoryRecord[] {
    const user = getActingUser(this.dataService, context);
    let history = this.dataService.getMaintenanceHistory();

    // 0. Organization isolation — always scope to the user's org first
    if (context.organizationId) {
      history = history.filter((h) => h.organizationId === context.organizationId);
    }

    if (context.role === 'System Admin' || context.role === 'Registrar') {
      return history;
    }

    return history.filter(
      (item) => item.department === user?.department || item.allocatedTo === user?.name
    );
  }

  accept(resourceId: string, dto: any, context: RequestContext): ResourceRecord {
    const resource = this.dataService.getResourceById(resourceId);
    if (!resource) {
      throw new NotFoundException(`Resource with ID ${resourceId} not found.`);
    }

    ensureDepartmentScoped(this.dataService, context, resource.department);
    if (resource.status !== 'Maintenance Requested') {
      throw new BadRequestException('Only maintenance-requested resources can be accepted.');
    }

    return this.dataService.updateResource(resourceId, {
      status: 'Maintenance',
      maintenancePriority: dto?.priority || resource.maintenancePriority || 'Medium',
      maintenanceNotes: dto?.notes || resource.maintenanceNotes || '',
    });
  }

  private resolve(
    resourceId: string,
    status: 'Repaired' | 'Scrapped',
    dto: any,
    context: RequestContext
  ): ResourceRecord {
    const resource = this.dataService.getResourceById(resourceId);
    if (!resource) {
      throw new NotFoundException(`Resource with ID ${resourceId} not found.`);
    }

    ensureDepartmentScoped(this.dataService, context, resource.department);
    if (!['Maintenance Requested', 'Maintenance'].includes(resource.status)) {
      throw new BadRequestException('Only active maintenance items can be resolved.');
    }

    // If item was allocated to a user, mark as 'Repaired' so user confirms receipt.
    // If it was unallocated / returned, mark as 'Available' so it goes directly to inventory.
    const isAllocatedUser = Boolean(resource.assignedTo && resource.assignedTo !== 'None');
    const finalStatus = status === 'Repaired'
      ? (isAllocatedUser ? 'Repaired' : 'Available')
      : 'Scrapped';
    const finalCondition = dto?.condition || (status === 'Repaired' ? 'Good' : resource.condition);
    const recordedIssue = dto?.issue || resource.maintenanceIssue || (status === 'Repaired' ? 'Routine Maintenance' : 'Unrepairable Fault');
    const resolutionNotes = dto?.resolutionNotes || (status === 'Repaired' ? 'Repaired and tested operational' : 'Decommissioned - beyond economical repair');
    const priority = dto?.priority || resource.maintenancePriority || 'Medium';

    // Log the maintenance action
    this.dataService.insertMaintenanceHistory({
      code: resource.id,
      organizationId: context.organizationId || 'ORG-001',
      type: resource.type,
      department: resource.department,
      allocatedTo: resource.assignedTo,
      issue: recordedIssue,
      actionDate: new Date().toLocaleDateString('en-US'),
      status: status === 'Repaired' ? 'Repaired' : 'Scrap',
      resolutionNotes,
      cost: dto?.cost !== undefined ? dto.cost : 0,
      priority,
    });

    // Update resource state
    return this.dataService.updateResource(resourceId, {
      status: finalStatus,
      condition: finalCondition,
      maintenanceNotes: resolutionNotes,
      maintenanceIssue: recordedIssue,
    });
  }

  repair(resourceId: string, dto: any, context: RequestContext): ResourceRecord {
    return this.resolve(resourceId, 'Repaired', dto, context);
  }

  scrap(resourceId: string, dto: any, context: RequestContext): ResourceRecord {
    return this.resolve(resourceId, 'Scrapped', dto, context);
  }
}
