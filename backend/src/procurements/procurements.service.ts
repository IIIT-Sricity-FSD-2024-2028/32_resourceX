import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { ProcurementRecord, ProcurementRegistrationResourceInput, ResourceRecord } from '../common/domain';
import { RequestContext } from '../common/roles';
import { DataService } from '../data/data.service';
import {
  CreateProcurementDto,
  CreatePurchaseOrderDto,
  DispatchDeliveryDto,
  EditProcurementDto,
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

const SPEC_MIME_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/png',
  'image/jpeg',
];
const MAX_SPEC_BYTES = 5 * 1024 * 1024;

// A replacement spec file arrives inline as a base64 data-URL; check its type and size
function ensureValidSpecFile(dataUrl: string): void {
  const match = /^data:([^;,]+);base64,/.exec(dataUrl);
  if (!match || !SPEC_MIME_TYPES.includes(match[1])) {
    throw new BadRequestException('Specification file must be a PDF, DOC, DOCX, PNG or JPG file.');
  }
  const bytes = Math.floor(((dataUrl.length - match[0].length) * 3) / 4);
  if (bytes > MAX_SPEC_BYTES) {
    throw new BadRequestException('Specification file is too large (max 5 MB).');
  }
}

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
      createdAt: new Date().toISOString(),
    };

    const saved = this.dataService.insertProcurement(procurement);
    if (saved.status === 'Pending Approval') {
      this.dataService.notify({
        organizationId: saved.organizationId,
        recipientRole: 'Dept Head',
        department: saved.department,
        title: 'Procurement needs approval',
        targetType: 'procurement',
        targetId: saved.id,
        description: `${saved.requestedBy} raised procurement ${saved.id} for ${saved.item || saved.resourceType}.`,
      });
    } else if (saved.status === 'Pending') {
      this.dataService.notify({
        organizationId: saved.organizationId,
        recipientRole: 'Registrar',
        title: 'Procurement awaiting approval',
        targetType: 'procurement',
        targetId: saved.id,
        description: `Procurement ${saved.id} for ${saved.item || saved.resourceType} (${saved.department}) awaits registrar approval.`,
      });
    }
    return saved;
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

  // Loads a procurement the acting dept head may manage (their own department; System Admin may act on any)
  private getManagedProcurement(id: string, context: RequestContext): ProcurementRecord {
    const procurement = this.dataService.getProcurementById(id);
    if (!procurement) {
      throw new NotFoundException(`Procurement with ID ${id} not found.`);
    }
    ensureDepartmentScoped(this.dataService, context, procurement.department);
    return procurement;
  }

  edit(id: string, payload: EditProcurementDto, context: RequestContext): ProcurementRecord {
    const procurement = this.getManagedProcurement(id, context);
    if (procurement.status !== 'Pending' && procurement.status !== 'Pending Approval') {
      throw new BadRequestException('A procurement can only be edited before the registrar reviews it.');
    }

    const updates: Partial<ProcurementRecord> = {};
    if (payload.resourceType !== undefined && payload.resourceType !== procurement.resourceType) {
      ensureValidDepartmentResourceType(this.dataService, procurement.department, payload.resourceType, procurement.organizationId);
      updates.resourceType = payload.resourceType;
      updates.item = payload.resourceType;
    }
    if (payload.quantity !== undefined) updates.quantity = payload.quantity;
    if (payload.priority !== undefined) updates.priority = payload.priority;
    if (payload.justification !== undefined) {
      if (!payload.justification.trim()) {
        throw new BadRequestException('Justification cannot be empty.');
      }
      updates.justification = payload.justification.trim();
    }
    if (payload.targetDate !== undefined) {
      updates.targetDate = payload.targetDate || undefined;
      updates.targetDateDisplay = payload.targetDate ? payload.targetDateDisplay : undefined;
      updates.expectedDeliveryDate = payload.targetDate || undefined;
    }
    if (payload.specFileDataUrl) {
      ensureValidSpecFile(payload.specFileDataUrl);
      updates.specFileName = payload.specFileName;
      updates.specFileType = payload.specFileType;
      updates.specFileDataUrl = payload.specFileDataUrl;
    }

    const edited = this.dataService.updateProcurement(id, { ...updates, updatedAt: new Date().toISOString() });
    if (procurement.status === 'Pending') {
      this.dataService.notify({
        organizationId: procurement.organizationId,
        recipientRole: 'Registrar',
        title: 'Procurement updated',
        targetType: 'procurement',
        targetId: id,
        description: `Procurement ${id} (${procurement.department}) was edited: ${edited.quantity} x ${edited.resourceType}.`,
      });
    }
    return edited;
  }

  cancel(id: string, reason: string | undefined, context: RequestContext): ProcurementRecord {
    const procurement = this.getManagedProcurement(id, context);
    if (!['Pending Approval', 'Pending', 'Approved'].includes(procurement.status)) {
      throw new BadRequestException('A procurement can only be cancelled before the purchase order is issued.');
    }

    const cancelled = this.dataService.updateProcurement(id, {
      status: 'Cancelled',
      cancelledAt: new Date().toISOString(),
      cancelledBy: getActingUser(this.dataService, context)?.name,
      cancelReason: reason?.trim() || undefined,
    });
    const what = `Procurement ${id} (${procurement.quantity} x ${procurement.resourceType}, ${procurement.department}) was cancelled by the department head.`;
    // Notify whoever currently holds it in their queue
    if (procurement.status === 'Pending') {
      this.dataService.notify({
        organizationId: procurement.organizationId,
        recipientRole: 'Registrar',
        title: 'Procurement cancelled',
        targetType: 'procurement',
        targetId: id,
        description: `${what} No registrar approval is needed.`,
      });
    } else if (procurement.status === 'Approved') {
      this.dataService.notify({
        organizationId: procurement.organizationId,
        recipientRole: 'Procurement Officer',
        department: procurement.department,
        title: 'Procurement cancelled',
        targetType: 'procurement',
        targetId: id,
        description: `${what} Do not issue a purchase order.`,
      });
    }
    return cancelled;
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

    const updated = this.dataService.updateProcurement(id, {
      status: 'Pending',
      deptApprovedAt: new Date().toISOString(),
      deptApprovedBy: getActingUser(this.dataService, context)?.name,
    });
    this.dataService.notify({
      organizationId: procurement.organizationId,
      recipientRole: 'Registrar',
      title: 'Procurement awaiting approval',
      targetType: 'procurement',
      targetId: id,
      description: `Procurement ${id} for ${procurement.item || procurement.resourceType} (${procurement.department}) was approved by the department head.`,
    });
    this.dataService.notify({
      organizationId: procurement.organizationId,
      recipientRole: 'Requestor',
      recipientUserId: procurement.requestedById,
      title: 'Procurement forwarded to Registrar',
      targetType: 'procurement',
      targetId: id,
      description: `Your procurement ${id} was approved by the department head.`,
    });
    return updated;
  }

  departmentReject(id: string, reason: string | undefined, context: RequestContext): ProcurementRecord {
    const procurement = this.dataService.getProcurementById(id);
    if (!procurement) {
      throw new NotFoundException(`Procurement with ID ${id} not found.`);
    }

    ensureDepartmentScoped(this.dataService, context, procurement.department);
    if (procurement.status !== 'Pending Approval') {
      throw new BadRequestException('Can only reject pending department approval.');
    }

    if (!reason?.trim()) {
      throw new BadRequestException('A rejection reason is required.');
    }
    const rejected = this.dataService.updateProcurement(id, {
      status: 'Rejected',
      rejectedAt: new Date().toISOString(),
      rejectedBy: getActingUser(this.dataService, context)?.name,
      rejectedStage: 'Dept Head',
      rejectionReason: reason.trim(),
    });
    this.dataService.notify({
      organizationId: procurement.organizationId,
      recipientRole: 'Requestor',
      recipientUserId: procurement.requestedById,
      title: 'Procurement rejected',
      targetType: 'procurement',
      targetId: id,
      description: `Your procurement ${id} was rejected by the department head. Reason: ${reason.trim()}`,
    });
    return rejected;
  }

  registrarApprove(id: string, context?: RequestContext): ProcurementRecord {
    const procurement = this.dataService.getProcurementById(id);
    if (!procurement) {
      throw new NotFoundException(`Procurement with ID ${id} not found.`);
    }

    if (procurement.status !== 'Pending') {
      throw new BadRequestException('Can only approve pending registrar approval.');
    }

    const approved = this.dataService.updateProcurement(id, {
      status: 'Approved',
      registrarApprovedAt: new Date().toISOString(),
      registrarApprovedBy: context ? getActingUser(this.dataService, context)?.name : undefined,
    });
    this.dataService.notify({
      organizationId: procurement.organizationId,
      recipientRole: 'Procurement Officer',
      department: procurement.department,
      title: 'Procurement approved',
      targetType: 'procurement',
      targetId: id,
      description: `Procurement ${id} for ${procurement.item || procurement.resourceType} was approved. Create the purchase order.`,
    });
    this.dataService.notify({
      organizationId: procurement.organizationId,
      recipientRole: 'Dept Head',
      department: procurement.department,
      title: 'Procurement approved by Registrar',
      targetType: 'procurement',
      targetId: id,
      description: `Procurement ${id} for ${procurement.item || procurement.resourceType} was approved.`,
    });
    return approved;
  }

  registrarReject(id: string, reason?: string, context?: RequestContext): ProcurementRecord {
    const procurement = this.dataService.getProcurementById(id);
    if (!procurement) {
      throw new NotFoundException(`Procurement with ID ${id} not found.`);
    }

    if (procurement.status !== 'Pending') {
      throw new BadRequestException('Can only reject pending registrar approval.');
    }
    if (!reason?.trim()) {
      throw new BadRequestException('A rejection reason is required.');
    }

    const rejected = this.dataService.updateProcurement(id, {
      status: 'Rejected',
      rejectedAt: new Date().toISOString(),
      rejectedBy: context ? getActingUser(this.dataService, context)?.name : undefined,
      rejectedStage: 'Registrar',
      rejectionReason: reason.trim(),
    });
    const reasonSuffix = ` Reason: ${reason.trim()}`;
    this.dataService.notify({
      organizationId: procurement.organizationId,
      recipientRole: 'Dept Head',
      department: procurement.department,
      title: 'Procurement rejected by Registrar',
      targetType: 'procurement',
      targetId: id,
      description: `Procurement ${id} for ${procurement.item || procurement.resourceType} was rejected.${reasonSuffix}`,
    });
    if (procurement.requestedById && procurement.requesterRole === 'Requestor') {
      this.dataService.notify({
        organizationId: procurement.organizationId,
        recipientRole: 'Requestor',
        recipientUserId: procurement.requestedById,
        title: 'Procurement rejected',
        targetType: 'procurement',
        targetId: id,
        description: `Your procurement ${id} was rejected by the registrar.${reasonSuffix}`,
      });
    }
    return rejected;
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
      poCreatedAt: new Date().toISOString(),
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
      dispatchedAt: new Date().toISOString(),
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

    this.dataService.notify({
      organizationId: procurement.organizationId,
      recipientRole: 'Inventory Officer',
      department: procurement.department,
      title: 'Procurement fulfilled',
      targetType: 'procurement',
      targetId: id,
      description: `Procurement ${id} (${procurement.quantity} x ${procurement.resourceType}) was delivered. Register the new resources.`,
    });
    this.dataService.notify({
      organizationId: procurement.organizationId,
      recipientRole: 'Dept Head',
      department: procurement.department,
      title: 'Procurement fulfilled',
      targetType: 'procurement',
      targetId: id,
      description: `Procurement ${id} for ${procurement.item || procurement.resourceType} has been fulfilled.`,
    });
    return this.dataService.updateProcurement(id, {
      status: 'Fulfilled',
      fulfilledAt: new Date().toISOString(),
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

    return this.dataService.updateProcurement(id, {
      status: 'Registered',
      registeredAt: new Date().toISOString(),
      registeredBy: getActingUser(this.dataService, context)?.name,
    });
  }
}
