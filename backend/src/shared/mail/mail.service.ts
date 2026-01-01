import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

export interface SendMailOptions {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
}

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter | null = null;

  constructor(private readonly configService: ConfigService) {
    this.initializeTransporter();
  }

  private initializeTransporter() {
    const host = this.configService.get<string>('mail.host');
    const port = this.configService.get<number>('mail.port');
    const user = this.configService.get<string>('mail.user');
    const pass = this.configService.get<string>('mail.pass');

    if (!host || !user) {
      this.logger.warn('Mail service not configured. Emails will not be sent.');
      return;
    }

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: {
        user,
        pass,
      },
    });
  }

  async sendMail(options: SendMailOptions): Promise<boolean> {
    if (!this.transporter) {
      this.logger.warn('Mail transporter not initialized. Email not sent.');
      return false;
    }

    const from = this.configService.get<string>('mail.from');

    try {
      await this.transporter.sendMail({
        from,
        ...options,
      });
      const recipient = Array.isArray(options.to)
        ? options.to.join(', ')
        : options.to;
      this.logger.log(`Email sent to ${recipient}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to send email: ${String(error)}`);
      return false;
    }
  }

  async sendWelcomeEmail(email: string, firstName?: string): Promise<boolean> {
    return this.sendMail({
      to: email,
      subject: 'Welcome!',
      html: `
        <h1>Welcome${firstName ? `, ${firstName}` : ''}!</h1>
        <p>Thank you for joining us.</p>
      `,
    });
  }

  async sendPasswordResetEmail(
    email: string,
    resetToken: string,
  ): Promise<boolean> {
    return this.sendMail({
      to: email,
      subject: 'Password Reset Request',
      html: `
        <h1>Password Reset</h1>
        <p>Use this token to reset your password: <strong>${resetToken}</strong></p>
        <p>If you did not request this, please ignore this email.</p>
      `,
    });
  }
}
