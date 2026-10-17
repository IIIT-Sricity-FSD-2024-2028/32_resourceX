import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { RESOURCE_CONDITIONS } from '../../common/domain';

export class ReturnProcessDto {
  @ApiProperty({ enum: RESOURCE_CONDITIONS, example: 'Good' })
  @IsEnum(RESOURCE_CONDITIONS)
  condition!: (typeof RESOURCE_CONDITIONS)[number];

  @ApiPropertyOptional({ enum: ['Available', 'Maintenance Requested', 'Scrapped'], example: 'Available' })
  @IsOptional()
  @IsString()
  destination?: 'Available' | 'Maintenance Requested' | 'Scrapped';

  @ApiPropertyOptional({ example: 'Hardware Fault / Broken' })
  @IsOptional()
  @IsString()
  returnReason?: string;

  @ApiPropertyOptional({ example: 'Trackpad cracked and battery draining rapidly' })
  @IsOptional()
  @IsString()
  maintenanceIssue?: string;

  @ApiPropertyOptional({ example: 'Returned with charger and dock' })
  @IsOptional()
  @IsString()
  notes?: string;
}
