import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { createHash, randomBytes, randomInt, timingSafeEqual } from 'node:crypto';
import { DataService } from '../data/data.service';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto, ResetPasswordDto, VerifyOtpDto } from './dto/password-reset.dto';
import { MailService } from './mail.service';

const OTP_VALID_MINUTES = 10;
const OTP_MAX_ATTEMPTS = 5;
const OTP_RESEND_COOLDOWN_MS = 60 * 1000;
const RESET_TOKEN_VALID = '10m';

interface PendingOtp {
  userId: string;
  hash: Buffer;
  expiresAt: number;
  attempts: number;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger('AuthService');
  /** Pending password-reset codes, keyed by lowercase email */
  private readonly pendingOtps = new Map<string, PendingOtp>();
  /** Last time a code was requested for an email, used for the resend cooldown */
  private readonly lastOtpRequest = new Map<string, number>();
  /** One-time nonce per user embedded in the reset token, so each token works once */
  private readonly resetNonces = new Map<string, string>();
  /** Separate signing key so a reset token can never be used as a login token */
  private readonly resetSecret = randomBytes(32).toString('hex');

  constructor(
    private dataService: DataService,
    private jwtService: JwtService,
    private mailService: MailService
  ) {}

  async signIn(loginDto: LoginDto) {
    const user = this.dataService.getUserByEmail(loginDto.email);
    if (user?.password !== loginDto.password) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.status === 'Inactive') {
      throw new UnauthorizedException('Your account has been deactivated. Please contact your administrator.');
    }

    if (user.status === 'Suspended') {
      throw new UnauthorizedException('Your account has been suspended. Please contact your administrator.');
    }

    // In our new multi-tenant architecture, the owner and employees might be scoped to 'PLATFORM'
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      organizationId: user.organizationId
    };

    return {
      access_token: await this.jwtService.signAsync(payload),
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        organizationId: user.organizationId
      }
    };
  }

  /** Step 1: check the email belongs to an active account, then email it a 6-digit code. */
  async requestPasswordReset(dto: ForgotPasswordDto) {
    const email = dto.email.toLowerCase().trim();
    const user = this.dataService.getUserByEmail(email);
    if (!user) {
      throw new NotFoundException(`There is no account for ${email}.`);
    }
    if (user.status !== 'Active') {
      throw new BadRequestException(
        `The account for ${email} is ${user.status.toLowerCase()}. Please contact your administrator.`
      );
    }

    const now = Date.now();
    const last = this.lastOtpRequest.get(email);
    if (last && now - last < OTP_RESEND_COOLDOWN_MS) {
      const wait = Math.ceil((OTP_RESEND_COOLDOWN_MS - (now - last)) / 1000);
      throw new HttpException(`Please wait ${wait} seconds before requesting another code.`, HttpStatus.TOO_MANY_REQUESTS);
    }
    this.lastOtpRequest.set(email, now);

    const otp = randomInt(0, 1_000_000).toString().padStart(6, '0');
    this.pendingOtps.set(email, {
      userId: user.id,
      hash: hashOtp(otp),
      expiresAt: now + OTP_VALID_MINUTES * 60 * 1000,
      attempts: 0,
    });
    try {
      await this.mailService.sendPasswordResetOtp(user.email, user.name, otp, OTP_VALID_MINUTES);
    } catch (err) {
      this.pendingOtps.delete(email);
      this.lastOtpRequest.delete(email);
      this.logger.error(`Failed to send password reset email to ${email}: ${(err as Error).message}`);
      throw new ServiceUnavailableException('Could not send the verification email. Please try again later.');
    }

    return {
      message: `A verification code has been sent to ${email}. It is valid for ${OTP_VALID_MINUTES} minutes.`,
    };
  }

  /** Step 2: check the code and return a short-lived token that allows one password change. */
  async verifyPasswordResetOtp(dto: VerifyOtpDto) {
    const email = dto.email.toLowerCase().trim();
    const pending = this.pendingOtps.get(email);
    if (!pending || pending.expiresAt < Date.now()) {
      this.pendingOtps.delete(email);
      throw new BadRequestException('The verification code has expired or was not requested. Please request a new code.');
    }

    if (!timingSafeEqual(pending.hash, hashOtp(dto.otp))) {
      pending.attempts += 1;
      if (pending.attempts >= OTP_MAX_ATTEMPTS) {
        this.pendingOtps.delete(email);
        throw new BadRequestException('Too many incorrect attempts. Please request a new code.');
      }
      throw new BadRequestException(`Incorrect verification code. ${OTP_MAX_ATTEMPTS - pending.attempts} attempts left.`);
    }

    this.pendingOtps.delete(email);
    const nonce = randomBytes(16).toString('hex');
    this.resetNonces.set(pending.userId, nonce);
    const resetToken = await this.jwtService.signAsync(
      { sub: pending.userId, purpose: 'password-reset', nonce },
      { secret: this.resetSecret, expiresIn: RESET_TOKEN_VALID }
    );
    return { message: 'Email verified. You can now set a new password.', resetToken };
  }

  /** Step 3: set the new password using the token from step 2. */
  async resetPassword(dto: ResetPasswordDto) {
    let payload: { sub: string; purpose: string; nonce: string };
    try {
      payload = await this.jwtService.verifyAsync(dto.resetToken, { secret: this.resetSecret });
    } catch {
      throw new BadRequestException('The reset session has expired. Please verify your email again.');
    }

    if (payload.purpose !== 'password-reset' || this.resetNonces.get(payload.sub) !== payload.nonce) {
      throw new BadRequestException('This reset link has already been used. Please verify your email again.');
    }

    const user = this.dataService.getUserById(payload.sub);
    if (!user) {
      throw new BadRequestException('Account not found.');
    }
    if (user.password === dto.newPassword) {
      throw new BadRequestException('The new password must be different from the current password.');
    }

    this.dataService.updateUser(user.id, { password: dto.newPassword });
    this.resetNonces.delete(user.id);
    return { message: 'Password updated. You can now sign in with your new password.' };
  }
}

function hashOtp(otp: string): Buffer {
  return createHash('sha256').update(otp).digest();
}
