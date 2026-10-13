import { PartialType } from '@nestjs/swagger';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, Matches, MinLength } from 'class-validator';
import { ROLES } from '../../common/roles';
import { USER_STATUSES } from '../../common/domain';
import { PASSWORD_PATTERN, PASSWORD_RULE_MESSAGE } from '../../common/password';

export class CreateEmployeeDto {
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

export class CreateUserDto {
  @ApiProperty({ example: 'U201' })
  @IsString()
  id!: string;

  @ApiProperty({ example: 'Asha Nair' })
  @IsString()
  name!: string;

  @ApiProperty({ example: 'asha@resourcex.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ enum: ROLES, example: 'Staff' })
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

export class UpdateUserDto extends PartialType(CreateUserDto) {
  @ApiPropertyOptional({ example: 'newsecret123' })
  @IsOptional()
  @IsString()
  @MinLength(6)
  password?: string;
}
