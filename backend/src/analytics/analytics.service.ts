import { Injectable, NotFoundException } from '@nestjs/common';
import { ProcurementRecord, RequestRecord, ResourceRecord } from '../common/domain';
import { RequestContext } from '../common/roles';
import { DataService } from '../data/data.service';
import { getActingUser, ensureDepartmentScoped, resourceMatchesType } from '../common/utils';

@Injectable()
export class AnalyticsService {
  constructor(private readonly dataService: DataService) {}

  private getScopedRequests(context: RequestContext): RequestRecord[] {
    const user = getActingUser(this.dataService, context);
    let items = this.dataService.getRequests();
    // Organization isolation first
    if (context.organizationId) {
      items = items.filter((r) => r.organizationId === context.organizationId);
    }
    if (context.role === 'System Admin' || context.role === 'Registrar') {
      return items;
    }
    if (context.role === 'Dept Head' || context.role === 'Inventory Officer' || context.role === 'Maintenance Officer' || context.role === 'Procurement Officer') {
      return items.filter((request) => request.department === user?.department);
    }
    if (context.role === 'Requestor') {
      return items.filter(
        (request) =>
          request.requestorId === user?.id || request.requestor === user?.name
      );
    }
    return [];
  }

  private getScopedResources(context: RequestContext): ResourceRecord[] {
    const user = getActingUser(this.dataService, context);
    let items = this.dataService.getResources();
    // Organization isolation first
    if (context.organizationId) {
      items = items.filter((r) => r.organizationId === context.organizationId);
    }
    if (context.role === 'System Admin' || context.role === 'Registrar') {
      return items;
    }
    if (context.role === 'Dept Head' || context.role === 'Inventory Officer' || context.role === 'Maintenance Officer' || context.role === 'Procurement Officer') {
      return items.filter((resource) => resource.department === user?.department);
    }
    if (context.role === 'Requestor') {
      return items.filter(
        (resource) =>
          resource.assignedToId === user?.id || resource.assignedTo === user?.name
      );
    }
    return [];
  }

  private getScopedProcurements(context: RequestContext): ProcurementRecord[] {
    const user = getActingUser(this.dataService, context);
    let items = this.dataService.getProcurements();
    // Organization isolation first
    if (context.organizationId) {
      items = items.filter((p) => p.organizationId === context.organizationId);
    }
    if (context.role === 'System Admin' || context.role === 'Registrar') {
      return items;
    }
    if (context.role === 'Dept Head' || context.role === 'Inventory Officer' || context.role === 'Maintenance Officer' || context.role === 'Procurement Officer') {
      return items.filter((procurement) => procurement.department === user?.department);
    }
    if (context.role === 'Requestor') {
      return items.filter(
        (procurement) =>
          procurement.requestedById === user?.id || procurement.requester === user?.name
      );
    }
    return [];
  }

  getRequestorSummary(context: RequestContext) {
    const requests = this.getScopedRequests(context);
    const resources = this.getScopedResources(context);
    return {
      totalRequests: requests.length,
      pendingRequests: requests.filter((item) => item.status === 'Pending').length,
      approvedRequests: requests.filter((item) => item.status === 'Approved').length,
      allocatedRequests: requests.filter((item) => item.status === 'Allocated').length,
      resources: resources.length,
      maintenance: resources.filter((item) => ['Maintenance Requested', 'Maintenance'].includes(item.status)).length,
    };
  }

  getDepartmentSummary(context: RequestContext) {
    const resources = this.getScopedResources(context);
    const requests = this.getScopedRequests(context);
    const procurements = this.getScopedProcurements(context);
    return {
      totalResources: resources.length,
      available: resources.filter((item) => item.status === 'Available').length,
      allocated: resources.filter((item) => item.status === 'Allocated').length,
      maintenance: resources.filter((item) => ['Maintenance Requested', 'Maintenance'].includes(item.status)).length,
      scrap: resources.filter((item) => item.status === 'Scrapped').length,
      pendingRequests: requests.filter((item) => item.status === 'Pending').length,
      procurements,
    };
  }

  getRegistrarSummary(context: RequestContext) {
    const resources = this.getScopedResources(context);
    const requests = this.getScopedRequests(context);
    const procurements = this.getScopedProcurements(context);
    return {
      totalAssets: resources.length,
      pendingRequests: requests.filter((item) => item.status === 'Pending').length,
      pendingProcurements: procurements.filter((item) => item.status === 'Pending').length,
      approvedToday:
        requests.filter((item) => item.status === 'Approved').length +
        procurements.filter((item) => item.status === 'Approved').length,
    };
  }

  getStock(context: RequestContext) {
    let thresholds = this.dataService.getStockThresholds();
    let resources = this.dataService.getResources();
    // Organization isolation — only show stock data for the current org
    if (context.organizationId) {
      thresholds = thresholds.filter((t) => !t.organizationId || t.organizationId === context.organizationId);
      resources = resources.filter((r) => r.organizationId === context.organizationId);
    }
    // Department scoping — Dept Head / Staff only see thresholds for their own department
    if (context.role === 'Dept Head' || context.role === 'Inventory Officer' || context.role === 'Maintenance Officer' || context.role === 'Procurement Officer') {
      const user = getActingUser(this.dataService, context);
      thresholds = thresholds.filter((t) => t.department === user?.department);
    }
    return thresholds.map((threshold) => {
      const currentQuantity = resources.filter(
        (resource) =>
          resource.department === threshold.department &&
          resource.status === 'Available' &&
          resourceMatchesType(resource, threshold.resourceType)
      ).length;
      const status =
        currentQuantity >= threshold.thresholdLevel
          ? 'Safe'
          : currentQuantity >= threshold.thresholdLevel * 0.7
            ? 'Near Threshold'
            : 'Low Stock';
      return { ...threshold, currentQuantity, status };
    });
  }

  updateStockThreshold(id: string, level: number, context: RequestContext) {
    const threshold = this.dataService.getStockThresholdById(id);
    if (!threshold) {
      throw new NotFoundException('Threshold not found.');
    }
    ensureDepartmentScoped(this.dataService, context, threshold.department);
    return this.dataService.updateStockThreshold(id, { thresholdLevel: level });
  }
}
