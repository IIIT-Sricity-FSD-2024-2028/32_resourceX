import { Role } from './roles';

export const USER_STATUSES = ['Active', 'Inactive', 'Suspended'] as const;
export type UserStatus = (typeof USER_STATUSES)[number];

export const REQUEST_PRIORITIES = ['Low', 'Normal', 'High'] as const;
export type RequestPriority = (typeof REQUEST_PRIORITIES)[number];

export const REQUEST_STATUSES = [
  'Pending',
  'Approved',
  'Allocated',
  'Completed',
  'Rejected',
] as const;
export type RequestStatus = (typeof REQUEST_STATUSES)[number];

export const RESOURCE_STATUSES = [
  'Available',
  'Allocated',
  'Maintenance Requested',
  'Maintenance',
  'Repaired',
  'Returned',
  'Scrapped',
] as const;
export type ResourceStatus = (typeof RESOURCE_STATUSES)[number];

export const RESOURCE_CONDITIONS = [
  'New',
  'Good',
  'Average',
  'Fair',
  'Damaged',
  'Bad',
] as const;
export type ResourceCondition = (typeof RESOURCE_CONDITIONS)[number];

export const PROCUREMENT_STATUSES = [
  'Pending Approval',
  'Pending',
  'Approved',
  'PO Created',
  'Out for Delivery',
  'Fulfilled',
  'Registered',
  'Rejected',
] as const;
export type ProcurementStatus = (typeof PROCUREMENT_STATUSES)[number];

export const MAINTENANCE_ACTION_STATUSES = ['Repaired', 'Scrap'] as const;
export type MaintenanceActionStatus = (typeof MAINTENANCE_ACTION_STATUSES)[number];

export type RecipientRole = Role | 'All';

export interface UserPreferences {
  notifications: boolean;
}

export interface SubscriptionPlanRecord {
  id: string;
  name: string;
  maxUsers: number;
  pricePerYear: number;
  features: string[];
}

export type OrganizationStatus = 'Pending' | 'Active' | 'Suspended';

export interface OrganizationRecord {
  id: string;
  name: string;
  adminEmail: string;
  subscriptionPlanId: string;
  status: OrganizationStatus;
  assignedEmployeeId?: string;
  subscriptionExpiryDate?: string;
  revenueGenerated?: number;
  adminName?: string;
  /** Proof of the System Admin's identity (uploaded at registration) */
  adminProofFileName?: string;
  adminProofFileType?: string;
  adminProofFileDataUrl?: string;
  /** Supporting document for the organization's details (uploaded at registration) */
  orgProofFileName?: string;
  orgProofFileType?: string;
  orgProofFileDataUrl?: string;
}

export interface QueryRecord {
  id: string;
  organizationId: string;
  title: string;
  description: string;
  status: 'Open' | 'Resolved';
  createdBy: string;
  createdById: string;
  date: string;
  reply?: string;
}

export interface UserRecord {
  id: string;
  organizationId?: string;
  name: string;
  email: string;
  password?: string;
  role: Role;
  department?: string;
  status: UserStatus;
  preferences?: UserPreferences;
}

export interface DepartmentRecord {
  id: string;
  organizationId: string;
  name: string;
  head: string;
  memberCount: number;
}

export interface RequestRecord {
  id: string;
  organizationId: string;
  resourceType: string;
  quantity: number;
  requestor: string;
  requestorId?: string;
  department: string;
  status: RequestStatus;
  priority?: RequestPriority;
  date: string;
  justification: string;
  assignedResources?: string;
  allocatedBy?: string;
  procurementId?: string;  // set when auto-generated from a completed procurement
  requirementDate?: string;       // ISO date string, e.g. "2026-10-20"
  returnDate?: string;            // ISO date string, e.g. "2026-10-30"
  requirementDateDisplay?: string; // Human-readable, e.g. "Oct 20, 2026"
  returnDateDisplay?: string;      // Human-readable, e.g. "Oct 30, 2026"
}

export interface ResourceRecord {
  id: string;
  organizationId: string;
  code?: string;
  internalId?: string;
  name?: string;
  type: string;
  department: string;
  serialNumber?: string;
  status: ResourceStatus;
  condition?: ResourceCondition;
  assignedTo?: string;
  assignedToId?: string;
  date?: string;
  vendor?: string;
  invoice?: string;
  /** Source procurement, used to look up its invoice file without duplicating the file blob per resource */
  procurementId?: string;
  location?: string;
  returnRequestedBy?: string;
  returnRequestedById?: string;
  maintenanceIssue?: string;
  maintenancePriority?: 'Low' | 'Medium' | 'High' | 'Critical';
  maintenanceRequestDate?: string;
  maintenanceNotes?: string;
  returnReason?: string;
  returnNotes?: string;
  routedFromReturn?: boolean;
  returnDate?: string;
  returnDateDisplay?: string;
  extensionStatus?: 'None' | 'Pending' | 'Approved' | 'Rejected';
  extensionProposedReturnDate?: string;
  extensionProposedReturnDateDisplay?: string;
  extensionReason?: string;
  extensionRequestDate?: string;
  extensionRequestedBy?: string;
  extensionRequestedById?: string;
}

export interface ProcurementRegistrationResourceInput
  extends Omit<ResourceRecord, 'department'> {
  department?: string;
}

export interface ProcurementRecord {
  id: string;
  organizationId: string;
  resourceType: string;
  item?: string;
  quantity: number;
  department: string;
  requestedBy?: string;
  requester?: string;
  requestedById?: string;
  requesterRole?: string;
  status: ProcurementStatus;
  priority?: RequestPriority;
  date: string;
  justification: string;
  vendor?: string;
  vendorContact?: string;
  invoice?: string;
  invoiceDate?: string;
  invoiceAmount?: number | string;
  paymentTerms?: string;
  receivedDate?: string;
  receivedBy?: string;
  poNumber?: string;
  poDate?: string;
  poNotes?: string;
  estimatedCost?: number | string;
  estimatedDeliveryDate?: string;
  carrier?: string;
  trackingNumber?: string;
  shippedDate?: string;
  expectedDeliveryDate?: string;
  targetDate?: string;
  targetDateDisplay?: string;
  deliveryNotes?: string;
  /** Resource specification / intent file — stored as a base64 data-URL */
  specFileName?: string;
  specFileType?: string;
  specFileDataUrl?: string;
  /** Purchase order file — stored as a base64 data-URL */
  poFileName?: string;
  poFileType?: string;
  poFileDataUrl?: string;
  /** Invoice file logged by Staff at purchase time — stored as a base64 data-URL */
  invoiceFileName?: string;
  invoiceFileType?: string;
  invoiceFileDataUrl?: string;
}

export interface NotificationRecord {
  id: string;
  organizationId: string;
  title: string;
  description: string;
  time: string;
  read: boolean;
  recipientRole: RecipientRole;
  /** When set, only users of this department (for department-scoped roles) see the notification */
  department?: string;
  /** When set, only this specific user sees the notification */
  recipientUserId?: string;
}

export interface MaintenanceHistoryRecord {
  code: string;
  organizationId: string;
  type: string;
  allocatedTo?: string;
  issue: string;
  actionDate: string;
  status: MaintenanceActionStatus | 'Repaired';
  department: string;
  resolutionNotes?: string;
  cost?: number | string;
  priority?: string;
}

export interface ReturnHistoryRecord {
  code: string;
  organizationId: string;
  type: string;
  returnedBy: string;
  returnDate: string;
  processDate: string;
  condition: ResourceCondition | 'Bad';
  finalStatus: Extract<ResourceStatus, 'Available' | 'Scrapped'> | 'Maintenance' | 'Maintenance Requested';
  department: string;
  returnReason?: string;
  notes?: string;
}

export interface StockThresholdRecord {
  id: string;
  organizationId: string;
  department: string;
  resourceType: string;
  thresholdLevel: number;
}

export interface DepartmentResourceCatalogRecord {
  organizationId: string;
  department: string;
  resourceTypes: string[];
}

export type TicketStatus = 'Open' | 'In Progress' | 'Resolved';

export interface SupportTicketRecord {
  id: string;
  organizationId: string;
  title: string;
  description: string;
  status: TicketStatus;
  createdBy: string;
  createdById: string;
  date: string;
  reply?: string;
}

export type AnnouncementType = 'Maintenance' | 'New Feature' | 'Policy' | 'General';

export interface AnnouncementRecord {
  id: string;
  targetOrgId: string | 'ALL';
  title: string;
  message: string;
  type: AnnouncementType;
  date: string;
  authorId: string;
  adminReply?: string;
  adminReplyDate?: string;
  adminReplyBy?: string;
}

export interface InvoiceRecord {
  id: string;
  organizationId: string;
  amount: number;
  planName: string;
  date: string;
  status: 'Paid' | 'Unpaid';
}

export interface AppState {
  subscriptionPlans: SubscriptionPlanRecord[];
  organizations: OrganizationRecord[];
  supportTickets: SupportTicketRecord[];
  announcements: AnnouncementRecord[];
  invoices: InvoiceRecord[];
  users: UserRecord[];
  departments: DepartmentRecord[];
  requests: RequestRecord[];
  resources: ResourceRecord[];
  procurements: ProcurementRecord[];
  notifications: NotificationRecord[];
  maintenanceHistory: MaintenanceHistoryRecord[];
  returnHistory: ReturnHistoryRecord[];
  stockThresholds: StockThresholdRecord[];
  resourceCatalog: DepartmentResourceCatalogRecord[];
}
