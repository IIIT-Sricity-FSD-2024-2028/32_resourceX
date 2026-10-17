import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, Matches } from 'class-validator';
import { PASSWORD_PATTERN, PASSWORD_RULE_MESSAGE } from '../../common/password';

export class ForgotPasswordDto {
  @ApiProperty({ example: 'ravichandrareacmecorp@gmail.com' })
  @IsEmail()
  email!: string;
}

export class VerifyOtpDto {
  @ApiProperty({ example: 'ravichandrareacmecorp@gmail.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: '123456' })
  @Matches(/^[0-9]{6}$/, { message: 'Verification code must be 6 digits.' })
  otp!: string;
}

export class ResetPasswordDto {
  @ApiProperty({ description: 'Token returned by POST /auth/verify-otp' })
  @IsString()
  @IsNotEmpty()
  resetToken!: string;

  @ApiProperty({ example: 'NewPass@123' })
  @Matches(PASSWORD_PATTERN, { message: PASSWORD_RULE_MESSAGE })
  newPassword!: string;
}
