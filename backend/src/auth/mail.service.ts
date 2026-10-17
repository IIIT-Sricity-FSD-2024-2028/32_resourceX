import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

/**
 * Sends emails over SMTP. Configure with SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS and
 * MAIL_FROM (see backend/.env.example). When SMTP is not configured, emails are written to
 * the backend console instead so the flow can still be tested locally.
 */
@Injectable()
export class MailService {
  private readonly logger = new Logger('MailService');
  private readonly transporter = process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS
    ? nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT || '587'),
        secure: Number(process.env.SMTP_PORT || '587') === 465,
        auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS.replace(/\s/g, '') },
      })
    : null;

  onModuleInit() {
    if (this.transporter) {
      this.logger.log(`Emails will be sent from ${process.env.SMTP_USER} via ${process.env.SMTP_HOST}`);
    } else {
      this.logger.warn('SMTP not configured (fill SMTP_USER and SMTP_PASS in backend/.env). Codes will be printed here.');
    }
  }

  isConfigured(): boolean {
    return this.transporter !== null;
  }

  async sendPasswordResetOtp(to: string, name: string, otp: string, validMinutes: number): Promise<void> {
    const subject = 'ResourceX password reset code';
    const text =
      `Hello ${name},\n\n` +
      `Your ResourceX password reset code is ${otp}. It is valid for ${validMinutes} minutes.\n\n` +
      `If you did not ask to reset your password, you can ignore this email.`;

    if (!this.transporter) {
      this.logger.warn(`SMTP not configured. Password reset code for ${to}: ${otp}`);
      return;
    }

    await this.transporter.sendMail({
      // MAIL_FROM may be a full address or just a display name shown next to SMTP_USER
      from: process.env.MAIL_FROM?.includes('@')
        ? process.env.MAIL_FROM
        : { name: process.env.MAIL_FROM || 'ResourceX', address: process.env.SMTP_USER! },
      to,
      subject,
      text,
      html:
        `<p>Hello ${escapeHtml(name)},</p>` +
        `<p>Your ResourceX password reset code is:</p>` +
        `<p style="font-size:24px;font-weight:bold;letter-spacing:4px">${otp}</p>` +
        `<p>It is valid for ${validMinutes} minutes.</p>` +
        `<p>If you did not ask to reset your password, you can ignore this email.</p>`,
    });
  }
}

function escapeHtml(value: string): string {
  return String(value).replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
}
