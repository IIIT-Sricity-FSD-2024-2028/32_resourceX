import { PartialType } from '@nestjs/swagger';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ArrayMinSize, IsArray, IsEnum, IsInt, IsOptional, IsString, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { PROCUREMENT_STATUSES, REQUEST_PRIORITIES, RESOURCE_CONDITIONS, RESOURCE_STATUSES } from '../../common/domain';

export class CreateProcurementDto {
  @ApiPropertyOptional({ example: 'PROC-1001' })
  @IsOptional()
  @IsString()
  id?: string;

  @ApiProperty({ example: 'Server Blades v2' })
  @IsString()
  resourceType!: string;

  @ApiPropertyOptional({ example: 'Server Blades v2' })
  @IsOptional()
  @IsString()
  item?: string;

  @ApiProperty({ example: 10 })
  // multipart/form-data (the file-upload middleware's transport now that it runs
  // through multer) delivers every field, including this one, as a string — @Type
  // coerces it back to a number before @IsInt/@Min run. A no-op for plain JSON
  // requests, where it already arrives as a number.
  @Type(() => Number)
  @IsInt()
  @Min(1)
  quantity!: number;

  @ApiPropertyOptional({ example: 'IT Services' })
  @IsOptional()
  @IsString()
  department?: string;

  @ApiPropertyOptional({ example: 'pradhyum' })
  @IsOptional()
  @IsString()
  requestedBy?: string;

  @ApiPropertyOptional({ example: 'pradhyum' })
  @IsOptional()
  @IsString()
  requester?: string;

  @ApiPropertyOptional({ example: 'U2' })
  @IsOptional()
  @IsString()
  requestedById?: string;

  @ApiPropertyOptional({ example: 'Requestor' })
  @IsOptional()
  @IsString()
  requesterRole?: string;

  @ApiPropertyOptional({ enum: PROCUREMENT_STATUSES, example: 'Pending Approval' })
  @IsOptional()
  @IsEnum(PROCUREMENT_STATUSES)
  status?: (typeof PROCUREMENT_STATUSES)[number];

  @ApiPropertyOptional({ enum: REQUEST_PRIORITIES, example: 'Normal' })
  @IsOptional()
  @IsEnum(REQUEST_PRIORITIES)
  priority?: (typeof REQUEST_PRIORITIES)[number];

  @ApiPropertyOptional({ example: 'May 4, 2026' })
  @IsOptional()
  @IsString()
  date?: string;

  @ApiProperty({ example: 'Capacity increase required.' })
  @IsString()
  justification!: string;

  @ApiPropertyOptional({ example: 'resource-spec.pdf' })
  @IsOptional()
  @IsString()
  specFileName?: string;

  @ApiPropertyOptional({ example: 'application/pdf' })
  @IsOptional()
  @IsString()
  specFileType?: string;

  @ApiPropertyOptional({ example: 'data:application/pdf;base64,...' })
  @IsOptional()
  @IsString()
  specFileDataUrl?: string;

  @ApiPropertyOptional({ example: '2026-11-20', description: 'Needed by / target completion date' })
  @IsOptional()
  @IsString()
  targetDate?: string;

  @ApiPropertyOptional({ example: 'Nov 20, 2026' })
  @IsOptional()
  @IsString()
  targetDateDisplay?: string;

  @ApiPropertyOptional({ example: '2026-11-20' })
  @IsOptional()
  @IsString()
  expectedDeliveryDate?: string;
}

export class UpdateProcurementDto extends PartialType(CreateProcurementDto) {
  @ApiPropertyOptional({ example: 'Dell' })
  @IsOptional()
  @IsString()
  vendor?: string;

  @ApiPropertyOptional({ example: 'INV-2026-1001' })
  @IsOptional()
  @IsString()
  invoice?: string;

  @ApiPropertyOptional({ example: 'PO-2026-0042' })
  @IsOptional()
  @IsString()
  poNumber?: string;

  @ApiPropertyOptional({ example: 'FedEx' })
  @IsOptional()
  @IsString()
  carrier?: string;

  @ApiPropertyOptional({ example: 'TRK-99214059' })
  @IsOptional()
  @IsString()
  trackingNumber?: string;
}

export class CreatePurchaseOrderDto {
  @ApiPropertyOptional({ example: 'PO-2026-0042' })
  @IsOptional()
  @IsString()
  poNumber?: string;

  @ApiProperty({ example: 'Dell Technologies' })
  @IsString()
  vendor!: string;

  @ApiPropertyOptional({ example: 'orders@dell.com' })
  @IsOptional()
  @IsString()
  vendorContact?: string;

  @ApiPropertyOptional({ example: 4500 })
  @IsOptional()
  estimatedCost?: number | string;

  @ApiPropertyOptional({ example: '2026-11-05' })
  @IsOptional()
  @IsString()
  estimatedDeliveryDate?: string;

  @ApiPropertyOptional({ example: 'Standard Net 30 payment terms' })
  @IsOptional()
  @IsString()
  poNotes?: string;

  @ApiPropertyOptional({ example: 'PO-2026-0042.pdf' })
  @IsOptional()
  @IsString()
  poFileName?: string;

  @ApiPropertyOptional({ example: 'application/pdf' })
  @IsOptional()
  @IsString()
  poFileType?: string;

  @ApiPropertyOptional({ example: 'data:application/pdf;base64,...' })
  @IsOptional()
  @IsString()
  poFileDataUrl?: string;
}

export class DispatchDeliveryDto {
  @ApiPropertyOptional({ example: 'FedEx Express' })
  @IsOptional()
  @IsString()
  carrier?: string;

  @ApiPropertyOptional({ example: 'TRK-9823411' })
  @IsOptional()
  @IsString()
  trackingNumber?: string;

  @ApiPropertyOptional({ example: '2026-10-18' })
  @IsOptional()
  @IsString()
  shippedDate?: string;

  @ApiPropertyOptional({ example: '2026-10-22' })
  @IsOptional()
  @IsString()
  expectedDeliveryDate?: string;

  @ApiPropertyOptional({ example: 'Dispatched from central hub in 2 crates' })
  @IsOptional()
  @IsString()
  deliveryNotes?: string;
}

export class LogPurchaseDto {
  @ApiPropertyOptional({ example: 'Dell' })
  @IsOptional()
  @IsString()
  vendor?: string;

  @ApiProperty({ example: 'INV-2026-1001' })
  @IsString()
  invoice!: string;

  @ApiPropertyOptional({ example: '2026-10-20' })
  @IsOptional()
  @IsString()
  invoiceDate?: string;

  @ApiPropertyOptional({ example: 4500 })
  @IsOptional()
  invoiceAmount?: number | string;

  @ApiPropertyOptional({ example: 'Net 30' })
  @IsOptional()
  @IsString()
  paymentTerms?: string;

  @ApiPropertyOptional({ example: '2026-10-22' })
  @IsOptional()
  @IsString()
  receivedDate?: string;

  @ApiPropertyOptional({ example: 'Ravi Teja' })
  @IsOptional()
  @IsString()
  receivedBy?: string;

  @ApiPropertyOptional({ example: 'invoice-1024.pdf' })
  @IsOptional()
  @IsString()
  invoiceFileName?: string;

  @ApiPropertyOptional({ example: 'application/pdf' })
  @IsOptional()
  @IsString()
  invoiceFileType?: string;

  @ApiPropertyOptional({ example: 'data:application/pdf;base64,...' })
  @IsOptional()
  @IsString()
  invoiceFileDataUrl?: string;
}

export class ProcurementRegistrationResourceDto {
  @ApiProperty({ example: 'RES-ITL-001' })
  @IsString()
  id!: string;

  @ApiPropertyOptional({ example: 'RES-ITL-001' })
  @IsOptional()
  @IsString()
  code?: string;

  @ApiPropertyOptional({ example: 'r501' })
  @IsOptional()
  @IsString()
  internalId?: string;

  @ApiProperty({ example: 'Laptop' })
  @IsString()
  type!: string;

  @ApiPropertyOptional({ example: 'Dell Latitude 5440' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ example: 'SN-1001' })
  @IsString()
  serialNumber!: string;

  @ApiPropertyOptional({ example: 'Block A - Room 12' })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional({ enum: RESOURCE_CONDITIONS, example: 'New' })
  @IsOptional()
  @IsEnum(RESOURCE_CONDITIONS)
  condition?: (typeof RESOURCE_CONDITIONS)[number];

  @ApiPropertyOptional({ enum: RESOURCE_STATUSES, example: 'Available' })
  @IsOptional()
  @IsEnum(RESOURCE_STATUSES)
  status?: (typeof RESOURCE_STATUSES)[number];

  @ApiPropertyOptional({ example: 'None' })
  @IsOptional()
  @IsString()
  assignedTo?: string;
}

export class RegisterProcurementDto {
  @ApiProperty({ type: [ProcurementRegistrationResourceDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ProcurementRegistrationResourceDto)
  resources!: ProcurementRegistrationResourceDto[];
}

// Fields a dept head may change while the procurement awaits registrar review
export class EditProcurementDto {
  @ApiPropertyOptional({ example: 'Laptops' })
  @IsOptional()
  @IsString()
  resourceType?: string;

  @ApiPropertyOptional({ example: 5 })
  @IsOptional()
  @IsInt()
  @Min(1)
  quantity?: number;

  @ApiPropertyOptional({ example: 'Capacity increase required.' })
  @IsOptional()
  @IsString()
  justification?: string;

  @ApiPropertyOptional({ enum: REQUEST_PRIORITIES, example: 'Normal' })
  @IsOptional()
  @IsEnum(REQUEST_PRIORITIES)
  priority?: (typeof REQUEST_PRIORITIES)[number];

  @ApiPropertyOptional({ example: '2026-11-20' })
  @IsOptional()
  @IsString()
  targetDate?: string;

  @ApiPropertyOptional({ example: 'Nov 20, 2026' })
  @IsOptional()
  @IsString()
  targetDateDisplay?: string;

  @ApiPropertyOptional({ example: 'resource-spec.pdf' })
  @IsOptional()
  @IsString()
  specFileName?: string;

  @ApiPropertyOptional({ example: 'application/pdf' })
  @IsOptional()
  @IsString()
  specFileType?: string;

  @ApiPropertyOptional({ example: 'data:application/pdf;base64,...' })
  @IsOptional()
  @IsString()
  specFileDataUrl?: string;
}

export class CancelProcurementDto {
  @ApiPropertyOptional({ example: 'No longer needed.' })
  @IsOptional()
  @IsString()
  reason?: string;
}

export class RejectProcurementDto {
  @ApiPropertyOptional({ example: 'Budget for this quarter is exhausted.' })
  @IsOptional()
  @IsString()
  reason?: string;
}
