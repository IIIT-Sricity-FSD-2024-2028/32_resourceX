import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { ProcurementRecord, ProcurementRegistrationResourceInput, ResourceRecord } from '../common/domain';
import { RequestContext } from '../common/roles';
import { DataService } from '../data/data.service';
import {
  CreateProcurementDto,
  CreatePurchaseOrderDto,
  DispatchDeliveryDto,
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
      if (context.role === 'Procurement Officer') {
        items = items.filter((p) => p.status !== 'Pending Approval' && (!user?.department || p.department === user?.department));
      } else if (context.role === 'Dept Head' || context.role === 'Inventory Officer' || context.role === 'Maintenance Officer') {
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

    const targetDate = payload.targetDate || payload.expectedDeliveryDate;
    let targetDateDisplay = payload.targetDateDisplay;
    if (targetDate && !targetDateDisplay) {
      const parsed = Date.parse(targetDate);
      if (!isNaN(parsed)) {
        targetDateDisplay = new Date(parsed).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        });
      }
    }

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
      targetDate,
      targetDateDisplay,
      expectedDeliveryDate: targetDate || payload.expectedDeliveryDate,
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

  createPurchaseOrder(id: string, dto: CreatePurchaseOrderDto, context: RequestContext): ProcurementRecord {
    const procurement = this.dataService.getProcurementById(id);
    if (!procurement) {
      throw new NotFoundException(`Procurement with ID ${id} not found.`);
    }

    ensureDepartmentScoped(this.dataService, context, procurement.department);
    if (procurement.status !== 'Approved' && procurement.status !== 'Pending') {
      throw new BadRequestException('Can only issue a Purchase Order for approved requests.');
    }

    const rawId = id.replace(/[^0-9]/g, '') || Date.now().toString().slice(-4);
    const poNumber = dto.poNumber?.trim() || dto.poFileName?.replace(/\.[^/.]+$/, '') || `PO-${rawId}`;
    const vendor = dto.vendor?.trim() || procurement.vendor || 'Authorized Vendor';

    return this.dataService.updateProcurement(id, {
      status: 'PO Created',
      poNumber,
      vendor,
      vendorContact: dto.vendorContact,
      estimatedCost: dto.estimatedCost,
      estimatedDeliveryDate: dto.estimatedDeliveryDate,
      poDate: new Date().toLocaleDateString('en-US'),
      poNotes: dto.poNotes,
      poFileName: dto.poFileName,
      poFileType: dto.poFileType,
      poFileDataUrl: dto.poFileDataUrl,
    });
  }

  dispatchDelivery(id: string, dto: DispatchDeliveryDto, context: RequestContext): ProcurementRecord {
    const procurement = this.dataService.getProcurementById(id);
    if (!procurement) {
      throw new NotFoundException(`Procurement with ID ${id} not found.`);
    }

    ensureDepartmentScoped(this.dataService, context, procurement.department);
    if (procurement.status !== 'PO Created' && procurement.status !== 'Approved') {
      throw new BadRequestException('Can only mark out for delivery after purchase order is issued.');
    }

    const rawId = id.replace(/[^0-9]/g, '') || Date.now().toString().slice(-4);
    const carrier = dto.carrier?.trim() || 'Logistics Partner';
    const trackingNumber = dto.trackingNumber?.trim() || `TRK-${rawId}-${Math.floor(1000 + Math.random() * 9000)}`;

    return this.dataService.updateProcurement(id, {
      status: 'Out for Delivery',
      carrier,
      trackingNumber,
      shippedDate: dto.shippedDate || new Date().toLocaleDateString('en-US'),
      expectedDeliveryDate: dto.expectedDeliveryDate,
      deliveryNotes: dto.deliveryNotes,
    });
  }

  logPurchase(id: string, dto: LogPurchaseDto, context: RequestContext): ProcurementRecord {
    const procurement = this.dataService.getProcurementById(id);
    if (!procurement) {
      throw new NotFoundException(`Procurement with ID ${id} not found.`);
    }

    ensureDepartmentScoped(this.dataService, context, procurement.department);
    const validStatuses = ['Approved', 'PO Created'];
    if (!validStatuses.includes(procurement.status)) {
      throw new BadRequestException('Can only log invoice and fulfill purchases for approved or PO created requests.');
    }

    const rawId = id.replace(/[^0-9]/g, '') || Date.now().toString().slice(-4);
    const invoiceNumber = dto.invoice?.trim() || dto.invoiceFileName?.replace(/\.[^/.]+$/, '') || `INV-${rawId}`;

    return this.dataService.updateProcurement(id, {
      status: 'Fulfilled',
      vendor: dto.vendor?.trim() || procurement.vendor || 'Authorized Vendor',
      invoice: invoiceNumber,
      invoiceDate: dto.invoiceDate || new Date().toLocaleDateString('en-US'),
      invoiceAmount: dto.invoiceAmount,
      paymentTerms: dto.paymentTerms,
      receivedDate: dto.receivedDate || new Date().toLocaleDateString('en-US'),
      receivedBy: dto.receivedBy || getActingUser(this.dataService, context)?.name || 'Procurement Team',
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
