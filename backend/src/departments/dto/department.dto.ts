import { PartialType } from '@nestjs/swagger';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class CreateDepartmentDto {
  @ApiPropertyOptional({ example: 'DEPT-001', description: 'Ignored: a unique id is generated per organization.' })
  @IsOptional()
  @IsString()
  id?: string;

  @ApiProperty({ example: 'IT Services' })
  @IsString()
  name!: string;

  @ApiPropertyOptional({ example: 'Pradhyum', description: 'Assigned automatically when a Dept Head user is created for the department.' })
  @IsOptional()
  @IsString()
  head?: string;

  @ApiPropertyOptional({ example: 12 })
  @IsOptional()
  @IsInt()
  @Min(0)
  memberCount?: number;
}

export class UpdateDepartmentDto extends PartialType(CreateDepartmentDto) {}
