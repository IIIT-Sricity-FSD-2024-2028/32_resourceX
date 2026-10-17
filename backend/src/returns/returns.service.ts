import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { ResourceCondition, ResourceRecord, ReturnHistoryRecord } from '../common/domain';
import { RequestContext } from '../common/roles';
import { DataService } from '../data/data.service';
import { getActingUser, ensureDepartmentScoped } from '../common/utils';
import { ReturnProcessDto } from './dto/return.dto';

@Injectable()
export class ReturnsService {
  constructor(private readonly dataService: DataService) {}

  getHistory(context: RequestContext): ReturnHistoryRecord[] {
    const user = getActingUser(this.dataService, context);
    let history = this.dataService.getReturnHistory();

    // Organization isolation — always scope to the user's org first
    if (context.organizationId) {
      history = history.filter((h) => h.organizationId === context.organizationId);
    }

    if (context.role === 'System Admin' || context.role === 'Registrar') {
      return history;
    }

    if (context.role === 'Requestor') {
      const uName = user?.name ? user.name.trim().toLowerCase() : '';
      return history.filter(
        (item) => item.returnedBy && item.returnedBy.trim().toLowerCase() === uName
      );
    }

    return history.filter(
      (item) => item.department === user?.department || item.returnedBy === user?.name
    );
  }

  process(
    resourceId: string,
    payload: ResourceCondition | ReturnProcessDto,
    context: RequestContext
  ): ResourceRecord {
    const resource = this.dataService.getResourceById(resourceId);
    if (!resource) {
      throw new NotFoundException(`Resource with ID ${resourceId} not found.`);
    }

    ensureDepartmentScoped(this.dataService, context, resource.department);
    if (resource.status !== 'Returned') {
      throw new BadRequestException('Can only process returned resources.');
    }

    const isDto = typeof payload === 'object';
    const condition = isDto ? payload.condition : payload;
    const specifiedDestination = isDto ? payload.destination : undefined;
    const returnReason = (isDto ? payload.returnReason : undefined) || resource.returnReason || 'General Return';
    const notes = (isDto ? payload.notes : undefined) || resource.returnNotes || '';
    const maintenanceIssue = (isDto ? payload.maintenanceIssue : undefined) || notes || returnReason || 'Maintenance required post-return';

    // Destination routing
    let finalStatus: 'Available' | 'Scrapped' | 'Maintenance Requested';
    if (specifiedDestination) {
      finalStatus = specifiedDestination;
    } else {
      finalStatus = condition === 'Damaged' || condition === 'Bad' ? 'Scrapped' : 'Available';
    }

    // Insert log into return history
    this.dataService.insertReturnHistory({
      code: resource.id,
      organizationId: context.organizationId || 'ORG-001',
      type: resource.type,
      returnedBy: resource.assignedTo || 'Unknown',
      returnDate: new Date().toLocaleDateString('en-US'),
      processDate: new Date().toLocaleDateString('en-US'),
      condition,
      finalStatus,
      department: resource.department,
      returnReason,
      notes,
    });

    const updatePayload: Partial<ResourceRecord> = {
      status: finalStatus,
      condition,
      assignedTo: 'None',
      assignedToId: undefined,
      returnReason,
      returnNotes: notes,
    };

    if (finalStatus === 'Maintenance Requested') {
      updatePayload.maintenanceIssue = maintenanceIssue;
      updatePayload.maintenancePriority = condition === 'Damaged' || condition === 'Bad' ? 'High' : 'Medium';
      updatePayload.maintenanceRequestDate = new Date().toLocaleDateString('en-US');
      updatePayload.routedFromReturn = true;
    }

    // Update resource state
    return this.dataService.updateResource(resourceId, updatePayload);
  }
}
