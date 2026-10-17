import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiOkResponse } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto, ResetPasswordDto, VerifyOtpDto } from './dto/password-reset.dto';

import { Public } from './public.decorator';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Public()
  @Post('login')
  @ApiOperation({ summary: 'Login to get JWT token' })
  @ApiOkResponse({ description: 'Successful login' })
  signIn(@Body() loginDto: LoginDto) {
    return this.authService.signIn(loginDto);
  }

  @Public()
  @Post('forgot-password')
  @HttpCode(200)
  @ApiOperation({ summary: 'Email a 6-digit verification code for resetting the password' })
  @ApiOkResponse({ description: 'Code sent; 404 when no account uses this email' })
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.requestPasswordReset(dto);
  }

  @Public()
  @Post('verify-otp')
  @HttpCode(200)
  @ApiOperation({ summary: 'Verify the emailed code and get a one-time reset token' })
  @ApiOkResponse({ description: 'Code verified; returns resetToken' })
  verifyOtp(@Body() dto: VerifyOtpDto) {
    return this.authService.verifyPasswordResetOtp(dto);
  }

  @Public()
  @Post('reset-password')
  @HttpCode(200)
  @ApiOperation({ summary: 'Set a new password using the reset token' })
  @ApiOkResponse({ description: 'Password updated' })
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }
}
