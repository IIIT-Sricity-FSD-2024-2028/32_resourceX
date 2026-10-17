import { PartialType } from '@nestjs/swagger';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ArrayMinSize, IsArray, IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { REQUEST_PRIORITIES, REQUEST_STATUSES } from '../../common/domain';

export class CreateRequestDto {
  @ApiProperty({ example: 'REQ-1001' })
  @IsString()
  id!: string;

  @ApiPropertyOptional({ example: 'IT Services' })
  @IsOptional()
  @IsString()
  department?: string;

  @ApiProperty({ example: 'Laptop' })
  @IsString()
  resourceType!: string;

  @ApiProperty({ example: 2 })
  @IsInt()
  @Min(1)
  quantity!: number;

  @ApiPropertyOptional({ example: 'Asha Nair' })
  @IsOptional()
  @IsString()
  requestor?: string;

  @ApiPropertyOptional({ example: 'U101' })
  @IsOptional()
  @IsString()
  requestorId?: string;

  @ApiPropertyOptional({ enum: REQUEST_STATUSES, example: 'Pending' })
  @IsOptional()
  @IsEnum(REQUEST_STATUSES)
  status?: (typeof REQUEST_STATUSES)[number];

  @ApiPropertyOptional({ example: 'May 4, 2026' })
  @IsOptional()
  @IsString()
  date?: string;

  @ApiProperty({ example: 'Needed for onboarding new team members.' })
  @IsString()
  justification!: string;

  @ApiPropertyOptional({ enum: REQUEST_PRIORITIES, example: 'Normal' })
  @IsOptional()
  @IsEnum(REQUEST_PRIORITIES)
  priority?: (typeof REQUEST_PRIORITIES)[number];

  @ApiPropertyOptional({ example: 'PRC-8668' })
  @IsOptional()
  @IsString()
  procurementId?: string;

  @ApiPropertyOptional({ example: '2026-10-20' })
  @IsOptional()
  @IsString()
  requirementDate?: string;

  @ApiPropertyOptional({ example: '2026-10-30' })
  @IsOptional()
  @IsString()
  returnDate?: string;

  @ApiPropertyOptional({ example: 'Oct 20, 2026' })
  @IsOptional()
  @IsString()
  requirementDateDisplay?: string;

  @ApiPropertyOptional({ example: 'Oct 30, 2026' })
  @IsOptional()
  @IsString()
  returnDateDisplay?: string;

  @ApiPropertyOptional({ example: 'request-letter.pdf' })
  @IsOptional()
  @IsString()
  letterFileName?: string;

  @ApiPropertyOptional({ example: 'application/pdf' })
  @IsOptional()
  @IsString()
  letterFileType?: string;

  @ApiPropertyOptional({ example: 'data:application/pdf;base64,JVBERi0xLjQK...' })
  @IsOptional()
  @IsString()
  letterFileDataUrl?: string;
}

export class UpdateRequestDto extends PartialType(CreateRequestDto) {
  @ApiPropertyOptional({ example: 'RES-1001, RES-1002' })
  @IsOptional()
  @IsString()
  assignedResources?: string;

  @ApiPropertyOptional({ example: 'prem kumar' })
  @IsOptional()
  @IsString()
  allocatedBy?: string;
}

export class AllocateRequestDto {
  @ApiProperty({ type: [String], example: ['RES-ITL-001', 'RES-ITL-002'] })
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  resourceIds!: string[];
}

// Fields a requestor may change while their request is still pending dept-head review
export class EditRequestDto {
  @ApiPropertyOptional({ example: 'Laptops' })
  @IsOptional()
  @IsString()
  resourceType?: string;

  @ApiPropertyOptional({ example: 2 })
  @IsOptional()
  @IsInt()
  @Min(1)
  quantity?: number;

  @ApiPropertyOptional({ example: 'Needed for onboarding new team members.' })
  @IsOptional()
  @IsString()
  justification?: string;

  @ApiPropertyOptional({ enum: REQUEST_PRIORITIES, example: 'Normal' })
  @IsOptional()
  @IsEnum(REQUEST_PRIORITIES)
  priority?: (typeof REQUEST_PRIORITIES)[number];

  @ApiPropertyOptional({ example: '2026-10-20' })
  @IsOptional()
  @IsString()
  requirementDate?: string;

  @ApiPropertyOptional({ example: '2026-10-30' })
  @IsOptional()
  @IsString()
  returnDate?: string;

  @ApiPropertyOptional({ example: 'Oct 20, 2026' })
  @IsOptional()
  @IsString()
  requirementDateDisplay?: string;

  @ApiPropertyOptional({ example: 'Oct 30, 2026' })
  @IsOptional()
  @IsString()
  returnDateDisplay?: string;

  @ApiPropertyOptional({ example: 'request-letter.pdf' })
  @IsOptional()
  @IsString()
  letterFileName?: string;

  @ApiPropertyOptional({ example: 'application/pdf' })
  @IsOptional()
  @IsString()
  letterFileType?: string;

  @ApiPropertyOptional({ example: 'data:application/pdf;base64,JVBERi0xLjQK...' })
  @IsOptional()
  @IsString()
  letterFileDataUrl?: string;
}

export class CancelRequestDto {
  @ApiPropertyOptional({ example: 'No longer needed.' })
  @IsOptional()
  @IsString()
  reason?: string;
}

export class RejectRequestDto {
  // Presence is enforced by the service so callers get a clear "reason is required" message
  @ApiProperty({ example: 'Requested quantity exceeds the team allowance.' })
  @IsOptional()
  @IsString()
  reason?: string;
}
