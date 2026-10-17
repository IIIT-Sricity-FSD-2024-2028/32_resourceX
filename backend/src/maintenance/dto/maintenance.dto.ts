import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class ResolveMaintenanceDto {
  @ApiPropertyOptional({ example: 'Cleaned fan assembly and replaced thermal interface material' })
  @IsOptional()
  @IsString()
  resolutionNotes?: string;

  @ApiPropertyOptional({ example: 45.0 })
  @IsOptional()
  cost?: number | string;

  @ApiPropertyOptional({ example: 'Good' })
  @IsOptional()
  @IsString()
  condition?: string;

  @ApiPropertyOptional({ example: 'Overheating and throttling' })
  @IsOptional()
  @IsString()
  issue?: string;

  @ApiPropertyOptional({ example: 'High' })
  @IsOptional()
  @IsString()
  priority?: string;
}

export class AcceptMaintenanceDto {
  @ApiPropertyOptional({ example: 'Assigned to Hardware Specialist Team' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ example: 'High' })
  @IsOptional()
  @IsString()
  priority?: string;
}
