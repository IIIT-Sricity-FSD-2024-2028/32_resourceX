import { Injectable, NotFoundException } from '@nestjs/common';
import { seedState } from './seed';
import {
  AppState,
  DepartmentRecord,
  NotificationRecord,
  ProcurementRecord,
  RequestRecord,
  ResourceRecord,
  UserRecord,
  OrganizationRecord,
  SupportTicketRecord,
  AnnouncementRecord,
  InvoiceRecord,
  SubscriptionPlanRecord,
  StockThresholdRecord,
  MaintenanceHistoryRecord,
  ReturnHistoryRecord,
  DepartmentResourceCatalogRecord,
} from '../common/domain';

@Injectable()
export class DataService {
  private readonly initialState: AppState = JSON.parse(JSON.stringify(seedState));
  private state: AppState = JSON.parse(JSON.stringify(seedState));

  private clone<T>(value: T): T {
    if (value === undefined) {
      return undefined as any;
    }
    return JSON.parse(JSON.stringify(value));
  }

  reset(): AppState {
    this.state = this.clone(this.initialState);
    return this.getState();
  }

  getState(): AppState {
    return this.clone(this.state);
  }

  // --- GENERAL COLLECTIONS CRUD ---

  getSubscriptionPlans(): SubscriptionPlanRecord[] {
    return this.clone(this.state.subscriptionPlans);
  }

  getOrganizations(): OrganizationRecord[] {
    return this.clone(this.state.organizations);
  }

  getOrganizationById(id: string): OrganizationRecord | undefined {
    return this.clone(this.state.organizations.find(o => o.id === id));
  }

  insertOrganization(org: OrganizationRecord): OrganizationRecord {
    this.state.organizations.unshift(org);
    return this.clone(org);
  }

  updateOrganization(id: string, updates: Partial<OrganizationRecord>): OrganizationRecord {
    const org = this.state.organizations.find(o => o.id === id);
    if (!org) throw new NotFoundException(`Organization with id ${id} not found`);
    Object.assign(org, updates);
    return this.clone(org);
  }

  getSupportTickets(): SupportTicketRecord[] {
    return this.clone(this.state.supportTickets);
  }

  insertSupportTicket(ticket: SupportTicketRecord): SupportTicketRecord {
    this.state.supportTickets.unshift(ticket);
    return this.clone(ticket);
  }

  updateSupportTicket(id: string, updates: Partial<SupportTicketRecord>): SupportTicketRecord {
    const ticket = this.state.supportTickets.find(q => q.id === id);
    if (!ticket) throw new NotFoundException(`Ticket with id ${id} not found`);
    Object.assign(ticket, updates);
    return this.clone(ticket);
  }

  getAnnouncements(): AnnouncementRecord[] {
    return this.clone(this.state.announcements);
  }

  insertAnnouncement(ann: AnnouncementRecord): AnnouncementRecord {
    this.state.announcements.unshift(ann);
    return this.clone(ann);
  }

  updateAnnouncement(id: string, updates: Partial<AnnouncementRecord>): AnnouncementRecord {
    const ann = this.state.announcements.find(a => a.id === id);
    if (!ann) throw new NotFoundException(`Announcement ${id} not found`);
    Object.assign(ann, updates);
    return this.clone(ann);
  }

  getInvoices(): InvoiceRecord[] {
    return this.clone(this.state.invoices);
  }

  insertInvoice(invoice: InvoiceRecord): InvoiceRecord {
    this.state.invoices.unshift(invoice);
    return this.clone(invoice);
  }

  getUsers(): UserRecord[] {
    return this.clone(this.state.users);
  }

  getUserById(id: string): UserRecord | undefined {
    return this.clone(this.state.users.find((u) => u.id === id));
  }

  getUserByEmail(email: string): UserRecord | undefined {
    const target = email.toLowerCase();
    return this.clone(
      this.state.users.find((u) => {
        if (u.email.toLowerCase() === target) return true;
        if (u.id === 'U4' && (target === 'yaswanth@resourcex.com' || target === 'prem@resourcex.com')) return true;
        return false;
      })
    );
  }

  insertUser(user: UserRecord): UserRecord {
    this.state.users.unshift(user);
    return this.clone(user);
  }

  updateUser(id: string, updates: Partial<UserRecord>): UserRecord {
    const user = this.state.users.find((u) => u.id === id);
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found.`);
    }
    Object.assign(user, updates);
    return this.clone(user);
  }

  deleteUser(id: string): UserRecord {
    const idx = this.state.users.findIndex((u) => u.id === id);
    if (idx === -1) {
      throw new NotFoundException(`User with ID ${id} not found.`);
    }
    const [deleted] = this.state.users.splice(idx, 1);
    return this.clone(deleted);
  }

  // --- DEPARTMENTS ---

  getDepartments(): DepartmentRecord[] {
    return this.clone(this.state.departments);
  }

  getDepartmentById(id: string): DepartmentRecord | undefined {
    return this.clone(this.state.departments.find((d) => d.id === id));
  }

  insertDepartment(dept: DepartmentRecord): DepartmentRecord {
    this.state.departments.unshift(dept);
    return this.clone(dept);
  }

  updateDepartment(id: string, updates: Partial<DepartmentRecord>): DepartmentRecord {
    const dept = this.state.departments.find((d) => d.id === id);
    if (!dept) {
      throw new NotFoundException(`Department with ID ${id} not found.`);
    }
    Object.assign(dept, updates);
    return this.clone(dept);
  }

  deleteDepartment(id: string): DepartmentRecord {
    const idx = this.state.departments.findIndex((d) => d.id === id);
    if (idx === -1) {
      throw new NotFoundException(`Department with ID ${id} not found.`);
    }
    const [deleted] = this.state.departments.splice(idx, 1);
    return this.clone(deleted);
  }

  // --- REQUESTS ---

  getRequests(): RequestRecord[] {
    return this.clone(this.state.requests);
  }

  getRequestById(id: string): RequestRecord | undefined {
    return this.clone(this.state.requests.find((r) => r.id === id));
  }

  insertRequest(req: RequestRecord): RequestRecord {
    this.state.requests.unshift(req);
    return this.clone(req);
  }

  updateRequest(id: string, updates: Partial<RequestRecord>): RequestRecord {
    const req = this.state.requests.find((r) => r.id === id);
    if (!req) {
      throw new NotFoundException(`Request with ID ${id} not found.`);
    }
    Object.assign(req, updates);
    return this.clone(req);
  }

  // --- RESOURCES ---

  getResources(): ResourceRecord[] {
    return this.clone(this.state.resources);
  }

  getResourceById(id: string): ResourceRecord | undefined {
    return this.clone(this.state.resources.find((r) => r.id === id));
  }

  insertResource(res: ResourceRecord): ResourceRecord {
    this.state.resources.unshift(res);
    return this.clone(res);
  }

  updateResource(id: string, updates: Partial<ResourceRecord>): ResourceRecord {
    const res = this.state.resources.find((r) => r.id === id);
    if (!res) {
      throw new NotFoundException(`Resource with ID ${id} not found.`);
    }
    Object.assign(res, updates);
    return this.clone(res);
  }

  // --- PROCUREMENTS ---

  getProcurements(): ProcurementRecord[] {
    return this.clone(this.state.procurements);
  }

  getProcurementById(id: string): ProcurementRecord | undefined {
    return this.clone(this.state.procurements.find((p) => p.id === id));
  }

  insertProcurement(proc: ProcurementRecord): ProcurementRecord {
    this.state.procurements.unshift(proc);
    return this.clone(proc);
  }

  updateProcurement(id: string, updates: Partial<ProcurementRecord>): ProcurementRecord {
    const proc = this.state.procurements.find((p) => p.id === id);
    if (!proc) {
      throw new NotFoundException(`Procurement with ID ${id} not found.`);
    }
    Object.assign(proc, updates);
    return this.clone(proc);
  }

  // --- NOTIFICATIONS ---

  getNotifications(): NotificationRecord[] {
    return this.clone(this.state.notifications);
  }

  getNotificationById(id: string): NotificationRecord | undefined {
    return this.clone(this.state.notifications.find((n) => n.id === id));
  }

  insertNotification(notif: NotificationRecord): NotificationRecord {
    this.state.notifications.unshift(notif);
    return this.clone(notif);
  }

  updateNotification(id: string, updates: Partial<NotificationRecord>): NotificationRecord {
    const notif = this.state.notifications.find((n) => n.id === id);
    if (!notif) {
      throw new NotFoundException(`Notification with ID ${id} not found.`);
    }
    Object.assign(notif, updates);
    return this.clone(notif);
  }

  // --- STOCK THRESHOLDS ---

  getStockThresholds(): StockThresholdRecord[] {
    return this.clone(this.state.stockThresholds);
  }

  getStockThresholdById(id: string): StockThresholdRecord | undefined {
    return this.clone(this.state.stockThresholds.find((s) => s.id === id));
  }

  updateStockThreshold(id: string, updates: Partial<StockThresholdRecord>): StockThresholdRecord {
    const st = this.state.stockThresholds.find((s) => s.id === id);
    if (!st) {
      throw new NotFoundException(`Stock threshold with ID ${id} not found.`);
    }
    Object.assign(st, updates);
    return this.clone(st);
  }

  // --- HISTORY RECORDS (READ-ONLY INSERTS) ---

  getMaintenanceHistory(): MaintenanceHistoryRecord[] {
    return this.clone(this.state.maintenanceHistory);
  }

  insertMaintenanceHistory(item: MaintenanceHistoryRecord): MaintenanceHistoryRecord {
    this.state.maintenanceHistory.unshift(item);
    return this.clone(item);
  }

  getReturnHistory(): ReturnHistoryRecord[] {
    return this.clone(this.state.returnHistory);
  }

  insertReturnHistory(item: ReturnHistoryRecord): ReturnHistoryRecord {
    this.state.returnHistory.unshift(item);
    return this.clone(item);
  }

  getResourceCatalog(): DepartmentResourceCatalogRecord[] {
    return this.clone(this.state.resourceCatalog);
  }

  updateResourceCatalog(organizationId: string, department: string, resourceTypes: string[]): DepartmentResourceCatalogRecord {
    let entry = this.state.resourceCatalog.find(
      (item) => item.organizationId === organizationId && item.department === department
    );
    if (entry) {
      entry.resourceTypes = this.clone(resourceTypes);
    } else {
      entry = { organizationId, department, resourceTypes: this.clone(resourceTypes) };
      this.state.resourceCatalog.push(entry);
    }
    return this.clone(entry);
  }
}
