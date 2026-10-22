import { PartialType } from '@nestjs/swagger';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, IsArray } from 'class-validator';
import { RESOURCE_CONDITIONS, RESOURCE_STATUSES } from '../../common/domain';

export class CreateResourceDto {
  @ApiProperty({ example: 'RES-ITL-001' })
  @IsString()
  id!: string;

  @ApiPropertyOptional({ example: 'RES-ITL-001' })
  @IsOptional()
  @IsString()
  code?: string;

  @ApiPropertyOptional({ example: 'r101' })
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

  @ApiPropertyOptional({ example: 'IT Services' })
  @IsOptional()
  @IsString()
  department?: string;

  @ApiPropertyOptional({ example: 'SN-1001' })
  @IsOptional()
  @IsString()
  serialNumber?: string;

  @ApiPropertyOptional({ enum: RESOURCE_STATUSES, example: 'Available' })
  @IsOptional()
  @IsEnum(RESOURCE_STATUSES)
  status?: (typeof RESOURCE_STATUSES)[number];

  @ApiPropertyOptional({ enum: RESOURCE_CONDITIONS, example: 'Good' })
  @IsOptional()
  @IsEnum(RESOURCE_CONDITIONS)
  condition?: (typeof RESOURCE_CONDITIONS)[number];

  @ApiPropertyOptional({ example: 'Dell' })
  @IsOptional()
  @IsString()
  vendor?: string;

  @ApiPropertyOptional({ example: 'INV-1001' })
  @IsOptional()
  @IsString()
  invoice?: string;

  @ApiPropertyOptional({ example: 'Block A - Room 12' })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional({ example: 'None' })
  @IsOptional()
  @IsString()
  assignedTo?: string;

  @ApiPropertyOptional({ example: 'U1' })
  @IsOptional()
  @IsString()
  assignedToId?: string;

  @ApiPropertyOptional({ example: 'May 4, 2026' })
  @IsOptional()
  @IsString()
  date?: string;

  @ApiPropertyOptional({ example: 'Screen flickering' })
  @IsOptional()
  @IsString()
  maintenanceIssue?: string;

  @ApiPropertyOptional({ example: 'Medium' })
  @IsOptional()
  @IsString()
  maintenancePriority?: 'Low' | 'Medium' | 'High' | 'Critical';

  @ApiPropertyOptional({ example: 'Project Completed' })
  @IsOptional()
  @IsString()
  returnReason?: string;

  @ApiPropertyOptional({ example: 'Returned with accessories' })
  @IsOptional()
  @IsString()
  returnNotes?: string;

  @ApiPropertyOptional({ example: '2026-11-30' })
  @IsOptional()
  @IsString()
  returnDate?: string;

  @ApiPropertyOptional({ example: 'Nov 30, 2026' })
  @IsOptional()
  @IsString()
  returnDateDisplay?: string;
}

export class UpdateResourceDto extends PartialType(CreateResourceDto) { }

export class UpdateCatalogDto {
  @ApiProperty({ example: 'IT Services' })
  @IsString()
  department!: string;

  @ApiProperty({ example: ['Laptop', 'Projector'], type: [String] })
  @IsArray()
  @IsString({ each: true })
  resourceTypes!: string[];
}

export class RequestMaintenanceDto {
  @ApiPropertyOptional({ example: 'Screen flickering and battery draining quickly' })
  @IsOptional()
  @IsString()
  issue?: string;

  @ApiPropertyOptional({ example: 'High', enum: ['Low', 'Medium', 'High', 'Critical'] })
  @IsOptional()
  @IsString()
  priority?: 'Low' | 'Medium' | 'High' | 'Critical';

  @ApiPropertyOptional({ example: 'Fair' })
  @IsOptional()
  @IsString()
  condition?: string;

  @ApiPropertyOptional({ example: 'Inventory Board' })
  @IsOptional()
  @IsString()
  routedFrom?: string;

  @ApiPropertyOptional({ example: 'Diagnosed during warehouse audit' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class InitiateReturnDto {
  @ApiPropertyOptional({ example: 'Project Completed' })
  @IsOptional()
  @IsString()
  reason?: string;

  @ApiPropertyOptional({ example: 'Device in good condition with original charger' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class RequestExtensionDto {
  @ApiProperty({ example: '2026-11-15', description: 'Proposed new return date in YYYY-MM-DD format' })
  @IsString()
  proposedReturnDate!: string;

  @ApiProperty({ example: 'Project research milestone extended by 2 weeks' })
  @IsString()
  reason!: string;
}

export class RejectExtensionDto {
  @ApiPropertyOptional({ example: 'Asset is scheduled for reallocation to another department' })
  @IsOptional()
  @IsString()
  reason?: string;
}


