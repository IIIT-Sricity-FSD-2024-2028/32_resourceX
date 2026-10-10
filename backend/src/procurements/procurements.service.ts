import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { ProcurementRecord, ProcurementRegistrationResourceInput, ResourceRecord } from '../common/domain';
import { RequestContext } from '../common/roles';
import { DataService } from '../data/data.service';
import {
  CreateProcurementDto,
  LogPurchaseDto,
  ProcurementRegistrationResourceDto,
  UpdateProcurementDto,
} from './dto/procurement.dto';
import {
  getActingUser,
  ensureActor,
  ensureDepartmentScoped,
  ensureValidDepartmentResourceType,
} from '../common/utils';

@Injectable()
export class ProcurementsService {
  constructor(private readonly dataService: DataService) {}

  getAll(context: RequestContext, filters?: { status?: string; department?: string }): ProcurementRecord[] {
    const user = getActingUser(this.dataService, context);
    let items = this.dataService.getProcurements();

    // 0. Organization isolation — always scope to the user's org first
    if (context.organizationId) {
      items = items.filter((p) => p.organizationId === context.organizationId);
    }

    // 1. Role-based scoping within the org
    if (context.role !== 'System Admin' && context.role !== 'Registrar') {
      if (context.role === 'Dept Head' || context.role === 'Staff') {
        items = items.filter((procurement) => procurement.department === user?.department);
      } else if (context.role === 'Requestor') {
        items = items.filter(
          (procurement) =>
            procurement.requestedById === user?.id || procurement.requester === user?.name
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

  create(payload: CreateProcurementDto, context: RequestContext): ProcurementRecord {
    const user = ensureActor(this.dataService, context);
    const department = payload.department || user?.department || 'Unassigned';
    const resourceType = payload.resourceType || payload.item;

    ensureDepartmentScoped(this.dataService, context, department);
    ensureValidDepartmentResourceType(this.dataService, department, resourceType, context.organizationId);

    const procurement: ProcurementRecord = {
      ...payload,
      id: payload.id || `PROC-${Date.now()}`,
      organizationId: context.organizationId || 'ORG-001',
      resourceType,
      item: payload.item || payload.resourceType,
      department,
      requestedBy: payload.requestedBy || payload.requester || user?.name || 'Unknown User',
      requester: payload.requester || payload.requestedBy || user?.name || 'Unknown User',
      requestedById: payload.requestedById || user?.id,
      status:
        context.role === 'Requestor'
          ? 'Pending Approval'
          : context.role === 'Dept Head'
            ? 'Pending'
            : payload.status || 'Pending',
      date: payload.date || new Date().toLocaleDateString('en-US'),
    };

    return this.dataService.insertProcurement(procurement);
  }

  update(id: string, payload: UpdateProcurementDto, context?: RequestContext): ProcurementRecord {
    if (context) {
      const procurement = this.dataService.getProcurementById(id);
      if (!procurement) {
        throw new NotFoundException(`Procurement with ID ${id} not found.`);
      }
      ensureDepartmentScoped(this.dataService, context, procurement.department);
      if (payload.department) {
        ensureDepartmentScoped(this.dataService, context, payload.department);
      }
    }
    return this.dataService.updateProcurement(id, payload);
  }

  departmentApprove(id: string, context: RequestContext): ProcurementRecord {
    const procurement = this.dataService.getProcurementById(id);
    if (!procurement) {
      throw new NotFoundException(`Procurement with ID ${id} not found.`);
    }

    ensureDepartmentScoped(this.dataService, context, procurement.department);
    if (procurement.status !== 'Pending Approval') {
      throw new BadRequestException('Can only approve pending department approval.');
    }

    return this.dataService.updateProcurement(id, { status: 'Pending' });
  }

  departmentReject(id: string, context: RequestContext): ProcurementRecord {
    const procurement = this.dataService.getProcurementById(id);
    if (!procurement) {
      throw new NotFoundException(`Procurement with ID ${id} not found.`);
    }

    ensureDepartmentScoped(this.dataService, context, procurement.department);
    if (procurement.status !== 'Pending Approval') {
      throw new BadRequestException('Can only reject pending department approval.');
    }

    return this.dataService.updateProcurement(id, { status: 'Rejected' });
  }

  registrarApprove(id: string): ProcurementRecord {
    const procurement = this.dataService.getProcurementById(id);
    if (!procurement) {
      throw new NotFoundException(`Procurement with ID ${id} not found.`);
    }

    if (procurement.status !== 'Pending') {
      throw new BadRequestException('Can only approve pending registrar approval.');
    }

    return this.dataService.updateProcurement(id, { status: 'Approved' });
  }

  registrarReject(id: string): ProcurementRecord {
    const procurement = this.dataService.getProcurementById(id);
    if (!procurement) {
      throw new NotFoundException(`Procurement with ID ${id} not found.`);
    }

    if (procurement.status !== 'Pending') {
      throw new BadRequestException('Can only reject pending registrar approval.');
    }

    return this.dataService.updateProcurement(id, { status: 'Rejected' });
  }

  logPurchase(id: string, dto: LogPurchaseDto, context: RequestContext): ProcurementRecord {
    const procurement = this.dataService.getProcurementById(id);
    if (!procurement) {
      throw new NotFoundException(`Procurement with ID ${id} not found.`);
    }

    if (procurement.status !== 'Approved') {
      throw new BadRequestException('Can only log purchases for approved requests.');
    }

    return this.dataService.updateProcurement(id, {
      status: 'Fulfilled',
      vendor: dto.vendor,
      invoice: dto.invoice,
      invoiceFileName: dto.invoiceFileName,
      invoiceFileType: dto.invoiceFileType,
      invoiceFileDataUrl: dto.invoiceFileDataUrl,
    });
  }

  register(id: string, resources: ProcurementRegistrationResourceDto[], context: RequestContext): ProcurementRecord {
    const procurement = this.dataService.getProcurementById(id);
    if (!procurement) {
      throw new NotFoundException(`Procurement with ID ${id} not found.`);
    }

    if (procurement.status !== 'Fulfilled') {
      throw new BadRequestException('Can only register resources for fulfilled requests.');
    }

    if (resources.length !== procurement.quantity) {
      throw new BadRequestException('Sum of registered resource quantities must match procurement request.');
    }

    // Ingest resources into inventory
    resources.forEach((r, idx) => {
      this.dataService.insertResource({
        id: `RES-${Date.now()}-${idx}`,
        name: r.name || procurement.item || procurement.resourceType,
        type: procurement.resourceType,
        department: procurement.department,
        serialNumber: r.serialNumber,
        status: 'Available',
        organizationId: context.organizationId || 'ORG-001',
        condition: 'New',
        assignedTo: 'None',
        date: new Date().toLocaleDateString('en-US'),
        vendor: procurement.vendor,
        invoice: procurement.invoice,
        procurementId: procurement.id,
      });
    });

    return this.dataService.updateProcurement(id, { status: 'Registered' });
  }
}
