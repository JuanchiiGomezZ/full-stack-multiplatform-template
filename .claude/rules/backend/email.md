# Backend: Email

<!-- AUTO-GENERATED: START -->

## Stack

- **Library:** Nodemailer
- **Transport:** SMTP
- **Location:** `backend/src/shared/mail/`

## Configuration

**Environment variables:**
```bash
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your-email@example.com
SMTP_PASSWORD=your-password
SMTP_FROM=noreply@example.com
```

**File:** `backend/src/core/config/mail.config.ts`

```typescript
import { registerAs } from '@nestjs/config';

export default registerAs('mail', () => ({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT, 10) || 587,
  secure: process.env.SMTP_PORT === '465', // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
  from: process.env.SMTP_FROM || 'noreply@example.com',
}));
```

## Mail Service

**File:** `backend/src/shared/mail/mail.service.ts`

```typescript
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

@Injectable()
export class MailService {
  private transporter: Transporter;

  constructor(private configService: ConfigService) {
    this.transporter = nodemailer.createTransporter({
      host: this.configService.get<string>('mail.host'),
      port: this.configService.get<number>('mail.port'),
      secure: this.configService.get<boolean>('mail.secure'),
      auth: {
        user: this.configService.get<string>('mail.auth.user'),
        pass: this.configService.get<string>('mail.auth.pass'),
      },
    });
  }

  async sendMail(options: {
    to: string;
    subject: string;
    text?: string;
    html?: string;
  }) {
    const from = this.configService.get<string>('mail.from');

    return this.transporter.sendMail({
      from,
      ...options,
    });
  }
}
```

## Email Templates

### Welcome Email

```typescript
async sendWelcomeEmail(user: { email: string; firstName: string }) {
  const subject = 'Welcome to Our Platform';
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .button {
            background-color: #007bff;
            color: white;
            padding: 12px 24px;
            text-decoration: none;
            border-radius: 4px;
            display: inline-block;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>Welcome, ${user.firstName}!</h1>
          <p>Thank you for joining our platform.</p>
          <p>
            <a href="https://yourapp.com/dashboard" class="button">
              Get Started
            </a>
          </p>
        </div>
      </body>
    </html>
  `;

  await this.sendMail({
    to: user.email,
    subject,
    html,
  });
}
```

### Password Reset Email

```typescript
async sendPasswordResetEmail(user: { email: string; firstName: string }, token: string) {
  const resetUrl = `https://yourapp.com/reset-password?token=${token}`;

  const subject = 'Reset Your Password';
  const html = `
    <!DOCTYPE html>
    <html>
      <body>
        <div class="container">
          <h1>Password Reset Request</h1>
          <p>Hi ${user.firstName},</p>
          <p>You requested to reset your password. Click the button below:</p>
          <p>
            <a href="${resetUrl}" class="button">Reset Password</a>
          </p>
          <p>This link will expire in 1 hour.</p>
          <p>If you didn't request this, please ignore this email.</p>
        </div>
      </body>
    </html>
  `;

  await this.sendMail({
    to: user.email,
    subject,
    html,
  });
}
```

### Email Verification

```typescript
async sendVerificationEmail(user: { email: string; firstName: string }, token: string) {
  const verifyUrl = `https://yourapp.com/verify-email?token=${token}`;

  const subject = 'Verify Your Email';
  const html = `
    <!DOCTYPE html>
    <html>
      <body>
        <div class="container">
          <h1>Verify Your Email</h1>
          <p>Hi ${user.firstName},</p>
          <p>Please verify your email address by clicking the button below:</p>
          <p>
            <a href="${verifyUrl}" class="button">Verify Email</a>
          </p>
        </div>
      </body>
    </html>
  `;

  await this.sendMail({
    to: user.email,
    subject,
    html,
  });
}
```

## Template Engine Integration

For complex templates, use a template engine like Handlebars:

```bash
npm install handlebars
```

**Template file:** `backend/src/shared/mail/templates/welcome.hbs`

```handlebars
<!DOCTYPE html>
<html>
  <body>
    <div class="container">
      <h1>Welcome, {{firstName}}!</h1>
      <p>Thank you for joining {{appName}}.</p>
      <p>
        <a href="{{dashboardUrl}}" class="button">Get Started</a>
      </p>
    </div>
  </body>
</html>
```

**Service:**
```typescript
import * as handlebars from 'handlebars';
import * as fs from 'fs';
import * as path from 'path';

async sendWelcomeEmail(user: { email: string; firstName: string }) {
  const templatePath = path.join(__dirname, 'templates', 'welcome.hbs');
  const templateSource = fs.readFileSync(templatePath, 'utf-8');
  const template = handlebars.compile(templateSource);

  const html = template({
    firstName: user.firstName,
    appName: 'Your App',
    dashboardUrl: 'https://yourapp.com/dashboard',
  });

  await this.sendMail({
    to: user.email,
    subject: 'Welcome to Your App',
    html,
  });
}
```

## Queued Emails (with Bull)

For high-volume emails, use a queue:

```bash
npm install @nestjs/bull bull
```

**Email queue processor:**

```typescript
import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';

@Processor('email')
export class EmailProcessor {
  constructor(private mailService: MailService) {}

  @Process('send')
  async handleSendEmail(job: Job) {
    const { to, subject, html } = job.data;

    await this.mailService.sendMail({
      to,
      subject,
      html,
    });
  }
}
```

**Add to queue:**

```typescript
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';

@Injectable()
export class AuthService {
  constructor(@InjectQueue('email') private emailQueue: Queue) {}

  async register(dto: RegisterDto) {
    const user = await this.createUser(dto);

    // Queue welcome email (non-blocking)
    await this.emailQueue.add('send', {
      to: user.email,
      subject: 'Welcome!',
      html: this.getWelcomeTemplate(user),
    });

    return user;
  }
}
```

## Testing Emails

### Development: MailHog

Use MailHog to catch emails locally:

```yaml
# docker-compose.yml
services:
  mailhog:
    image: mailhog/mailhog
    ports:
      - '1025:1025' # SMTP
      - '8025:8025' # Web UI
```

**Configuration:**
```bash
SMTP_HOST=localhost
SMTP_PORT=1025
SMTP_USER=
SMTP_PASSWORD=
```

**Access UI:** http://localhost:8025

### Development: Mailtrap

Free SMTP service for testing:

```bash
SMTP_HOST=smtp.mailtrap.io
SMTP_PORT=2525
SMTP_USER=your-mailtrap-user
SMTP_PASSWORD=your-mailtrap-password
```

## Error Handling

```typescript
async sendMail(options: EmailOptions) {
  try {
    const info = await this.transporter.sendMail({
      from: this.from,
      ...options,
    });

    console.log('Email sent:', info.messageId);
    return info;
  } catch (error) {
    console.error('Email send failed:', error);
    throw new Error('Failed to send email');
  }
}
```

## Attachments

```typescript
async sendWithAttachment(to: string, filePath: string) {
  await this.sendMail({
    to,
    subject: 'Your Document',
    html: '<p>Please find the attached document.</p>',
    attachments: [
      {
        filename: 'document.pdf',
        path: filePath,
      },
    ],
  });
}
```

## Best Practices

### ✅ DO

- Use queues for non-critical emails
- Implement retry logic for failed sends
- Use templates for consistent styling
- Test with MailHog or Mailtrap in development
- Include plain text version
- Validate email addresses before sending
- Track email delivery status
- Use environment-specific from addresses

### ❌ DON'T

- Send emails synchronously in critical paths
- Hardcode email content in code
- Expose SMTP credentials
- Send emails without error handling
- Spam users with unnecessary emails
- Use production SMTP in development

## Production Setup

### Gmail SMTP

```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password  # Not your regular password!
```

**Note:** Enable "App Passwords" in Gmail settings.

### SendGrid

```bash
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASSWORD=your-sendgrid-api-key
```

### AWS SES

```bash
SMTP_HOST=email-smtp.us-east-1.amazonaws.com
SMTP_PORT=587
SMTP_USER=your-ses-smtp-user
SMTP_PASSWORD=your-ses-smtp-password
```

<!-- AUTO-GENERATED: END -->
