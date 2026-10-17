import { ApiProperty } from '@nestjs/swagger';

export class UserPreferencesDto {
  @ApiProperty({ example: true })
  notifications!: boolean;
}

export class UserResponseDto {
  @ApiProperty({ example: 'U1' })
  id!: string;

  @ApiProperty({ example: 'RAVI CHANDRA' })
  name!: string;

  @ApiProperty({ example: 'ravi@resourcex.com' })
  email!: string;

  @ApiProperty({ example: '12345678', required: false })
  password?: string;

  @ApiProperty({ example: 'Requestor' })
  role!: string;

  @ApiProperty({ example: 'IT Services', required: false })
  department?: string;

  @ApiProperty({ example: 'Active' })
  status!: string;

  @ApiProperty({ type: UserPreferencesDto, required: false })
  preferences?: UserPreferencesDto;
}

export class DepartmentResponseDto {
  @ApiProperty({ example: 'D1' })
  id!: string;

  @ApiProperty({ example: 'IT Services' })
  name!: string;

  @ApiProperty({ example: 'pradhyum' })
  head!: string;

  @ApiProperty({ example: 15 })
  memberCount!: number;
}

export class RequestResponseDto {
  @ApiProperty({ example: 'REQ-101' })
  id!: string;

  @ApiProperty({ example: 'High-Cap Battery' })
  resourceType!: string;

  @ApiProperty({ example: 1 })
  quantity!: number;

  @ApiProperty({ example: 'RAVI CHANDRA' })
  requestor!: string;

  @ApiProperty({ example: 'U1', required: false })
  requestorId?: string;

  @ApiProperty({ example: 'IT Services' })
  department!: string;

  @ApiProperty({ example: 'Allocated' })
  status!: string;

  @ApiProperty({ example: 'Normal', required: false })
  priority?: string;

  @ApiProperty({ example: 'Oct 24, 2023' })
  date!: string;

  @ApiProperty({ example: 'Restocking for field ops' })
  justification!: string;

  @ApiProperty({ example: 'RES-1049', required: false })
  assignedResources?: string;

  @ApiProperty({ example: 'prem kumar', required: false })
  allocatedBy?: string;

  @ApiProperty({ example: '2026-10-17T09:30:00.000Z', required: false })
  createdAt?: string;

  @ApiProperty({ example: '2026-10-18T11:00:00.000Z', required: false })
  approvedAt?: string;

  @ApiProperty({ example: 'pradhyum', required: false })
  approvedBy?: string;

  @ApiProperty({ example: '2026-10-19T14:15:00.000Z', required: false })
  allocatedAt?: string;

  @ApiProperty({ example: '2026-10-20T10:00:00.000Z', required: false })
  receivedAt?: string;

  @ApiProperty({ example: '2026-10-18T08:00:00.000Z', required: false })
  cancelledAt?: string;

  @ApiProperty({ example: 'No longer needed.', required: false })
  cancelReason?: string;

  @ApiProperty({ example: 'Requested quantity exceeds the team allowance.', required: false })
  rejectionReason?: string;

  @ApiProperty({ example: 'request-letter.pdf', required: false })
  letterFileName?: string;
}

export class ResourceResponseDto {
  @ApiProperty({ example: 'RES-1049' })
  id!: string;

  @ApiProperty({ example: 'Laptop - Dell XPS', required: false })
  name?: string;

  @ApiProperty({ example: 'Laptop' })
  type!: string;

  @ApiProperty({ example: 'IT Services' })
  department!: string;

  @ApiProperty({ example: 'SN-998822', required: false })
  serialNumber?: string;

  @ApiProperty({ example: 'Allocated' })
  status!: string;

  @ApiProperty({ example: 'Good', required: false })
  condition?: string;

  @ApiProperty({ example: 'RAVI CHANDRA', required: false })
  assignedTo?: string;

  @ApiProperty({ example: 'U1', required: false })
  assignedToId?: string;

  @ApiProperty({ example: 'Jan 12, 2023', required: false })
  date?: string;

  @ApiProperty({ example: 'Cisco Systems', required: false })
  vendor?: string;

  @ApiProperty({ example: 'INV-8899', required: false })
  invoice?: string;

  @ApiProperty({ example: 'IT Lab', required: false })
  location?: string;

  @ApiProperty({ example: 'RAVI CHANDRA', required: false })
  returnRequestedBy?: string;

  @ApiProperty({ example: 'U1', required: false })
  returnRequestedById?: string;
}

export class ProcurementResponseDto {
  @ApiProperty({ example: 'PROC-819' })
  id!: string;

  @ApiProperty({ example: 'Server Blades v2' })
  resourceType!: string;

  @ApiProperty({ example: 'Server Blades v2', required: false })
  item?: string;

  @ApiProperty({ example: 10 })
  quantity!: number;

  @ApiProperty({ example: 'IT Services' })
  department!: string;

  @ApiProperty({ example: 'pradhyum', required: false })
  requestedBy?: string;

  @ApiProperty({ example: 'pradhyum', required: false })
  requester?: string;

  @ApiProperty({ example: 'U2', required: false })
  requestedById?: string;

  @ApiProperty({ example: 'Pending' })
  status!: string;

  @ApiProperty({ example: 'Oct 26, 2023' })
  date!: string;

  @ApiProperty({ example: 'Capacity increase required.' })
  justification!: string;

  @ApiProperty({ example: 'Dell', required: false })
  vendor?: string;

  @ApiProperty({ example: 'INV-2026-1001', required: false })
  invoice?: string;
}

export class NotificationResponseDto {
  @ApiProperty({ example: 'N1' })
  id!: string;

  @ApiProperty({ example: 'Welcome to ResourceX' })
  title!: string;

  @ApiProperty({ example: 'Your account has been created.' })
  description!: string;

  @ApiProperty({ example: '1 day ago' })
  time!: string;

  @ApiProperty({ example: false })
  read!: boolean;

  @ApiProperty({ example: 'All' })
  recipientRole!: string;
}

export class MaintenanceHistoryResponseDto {
  @ApiProperty({ example: 'RES-2233' })
  code!: string;

  @ApiProperty({ example: 'Printer Color' })
  type!: string;

  @ApiProperty({ example: 'None' })
  allocatedTo!: string;

  @ApiProperty({ example: 'Paper Jam' })
  issue!: string;

  @ApiProperty({ example: 'Oct 16, 2023' })
  actionDate!: string;

  @ApiProperty({ example: 'Repaired' })
  status!: string;

  @ApiProperty({ example: 'Administration' })
  department!: string;
}

export class ReturnHistoryResponseDto {
  @ApiProperty({ example: 'RES-9988' })
  code!: string;

  @ApiProperty({ example: 'Laptop - Old' })
  type!: string;

  @ApiProperty({ example: 'Bob Builder' })
  returnedBy!: string;

  @ApiProperty({ example: 'Oct 20, 2023' })
  returnDate!: string;

  @ApiProperty({ example: 'Oct 21, 2023' })
  processDate!: string;

  @ApiProperty({ example: 'Bad' })
  condition!: string;

  @ApiProperty({ example: 'Scrapped' })
  finalStatus!: string;

  @ApiProperty({ example: 'Operations' })
  department!: string;
}

export class StockRowResponseDto {
  @ApiProperty({ example: 'TH-1' })
  id!: string;

  @ApiProperty({ example: 'IT Services' })
  department!: string;

  @ApiProperty({ example: 'Laptop' })
  resourceType!: string;

  @ApiProperty({ example: 15 })
  thresholdLevel!: number;

  @ApiProperty({ example: 18, required: false })
  currentQuantity?: number;

  @ApiProperty({ example: 'Safe', required: false })
  status?: string;
}

export class DepartmentResourceCatalogResponseDto {
  @ApiProperty({ example: 'IT Services' })
  department!: string;

  @ApiProperty({
    type: [String],
    example: ['Laptop', 'Monitor', 'Router', 'Server Blade'],
  })
  resourceTypes!: string[];
}

export class ResourceAvailabilityResponseDto {
  @ApiProperty({ example: 'IT Services' })
  department!: string;

  @ApiProperty({ example: 'Laptop' })
  resourceType!: string;

  @ApiProperty({ example: 3 })
  availableCount!: number;
}

export class RequestorSummaryResponseDto {
  @ApiProperty({ example: 4 })
  totalRequests!: number;

  @ApiProperty({ example: 2 })
  pendingRequests!: number;

  @ApiProperty({ example: 1 })
  approvedRequests!: number;

  @ApiProperty({ example: 1 })
  allocatedRequests!: number;

  @ApiProperty({ example: 2 })
  resources!: number;

  @ApiProperty({ example: 1 })
  maintenance!: number;
}

export class DepartmentSummaryResponseDto {
  @ApiProperty({ example: 12 })
  totalResources!: number;

  @ApiProperty({ example: 7 })
  available!: number;

  @ApiProperty({ example: 3 })
  allocated!: number;

  @ApiProperty({ example: 1 })
  maintenance!: number;

  @ApiProperty({ example: 1 })
  scrap!: number;

  @ApiProperty({ example: 2 })
  pendingRequests!: number;

  @ApiProperty({ type: [ProcurementResponseDto] })
  procurements!: ProcurementResponseDto[];
}

export class RegistrarSummaryResponseDto {
  @ApiProperty({ example: 14 })
  totalAssets!: number;

  @ApiProperty({ example: 4 })
  pendingRequests!: number;

  @ApiProperty({ example: 3 })
  pendingProcurements!: number;

  @ApiProperty({ example: 5 })
  approvedToday!: number;
}

export class SuccessResponseDto {
  @ApiProperty({ example: true })
  success!: boolean;
}

export class ErrorResponseDto {
  @ApiProperty({ example: 400 })
  statusCode!: number;

  @ApiProperty({ example: 'Selected resources must match request quantity.' })
  message!: string | string[];

  @ApiProperty({ example: 'Bad Request' })
  error!: string;
}
