import { PartialType } from '@nestjs/swagger';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ArrayUnique, IsArray, IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';
import { ROLES } from '../../common/roles';
import { USER_STATUSES } from '../../common/domain';
import { PASSWORD_PATTERN, PASSWORD_RULE_MESSAGE } from '../../common/password';

/** Document uploaded with an account (PDF, PNG or JPG up to 5 MB, sent as a data URL) */
export class UserDocumentDto {
  @ApiProperty({ example: 'aadhaar.pdf' })
  @IsString()
  @IsNotEmpty({ message: 'Please upload a document for this account.' })
  @MaxLength(100)
  documentFileName!: string;

  @ApiProperty({ example: 'application/pdf' })
  @IsString()
  @Matches(/^(application\/pdf|image\/png|image\/jpeg)$/, { message: 'Document must be a PDF, PNG or JPG file.' })
  documentFileType!: string;

  @ApiProperty({ description: 'File contents as a data URL' })
  @IsString()
  @MaxLength(8_000_000, { message: 'Document is too large (max 5 MB).' })
  @Matches(/^data:/, { message: 'Document file is invalid.' })
  documentFileDataUrl!: string;
}

export class CreateEmployeeDto extends UserDocumentDto {
  @ApiProperty({ example: 'Priya Sharma' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ example: 'priya@resourcex.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'Welcome@123', description: 'Login password for the new employee' })
  @IsString()
  @Matches(PASSWORD_PATTERN, { message: PASSWORD_RULE_MESSAGE })
  password!: string;
}

export class CreateUserDto extends UserDocumentDto {
  @ApiProperty({ example: 'U201' })
  @IsString()
  id!: string;

  @ApiProperty({ example: 'Asha Nair' })
  @IsString()
  name!: string;

  @ApiProperty({ example: 'asha@resourcex.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ enum: ROLES, example: 'Inventory Officer' })
  @IsEnum(ROLES)
  role!: (typeof ROLES)[number];

  @ApiPropertyOptional({ example: 'IT Services' })
  @IsOptional()
  @IsString()
  department?: string;

  @ApiProperty({ enum: USER_STATUSES, example: 'Active' })
  @IsEnum(USER_STATUSES)
  status!: (typeof USER_STATUSES)[number];

  @ApiProperty({ example: 'temporary123' })
  @IsString()
  @MinLength(6)
  password!: string;
}

export class UpdateEmployeeDto extends PartialType(UserDocumentDto) {
  @ApiPropertyOptional({ example: 'Priya Sharma' })
  @IsOptional()
  @IsString()
  @IsNotEmpty({ message: 'Name cannot be empty.' })
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({ example: ['ORG-001', 'ORG-004'], description: 'Full list of organizations this employee manages' })
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsString({ each: true })
  organizationIds?: string[];
}

export class UpdateUserDto extends PartialType(CreateUserDto) {
  @ApiPropertyOptional({ example: 'newsecret123' })
  @IsOptional()
  @IsString()
  @MinLength(6)
  password?: string;
}
