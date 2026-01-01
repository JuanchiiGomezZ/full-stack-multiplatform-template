# Services

## Shared Services Overview

| Service        | Location              | Purpose            |
| -------------- | --------------------- | ------------------ |
| MailService    | `src/shared/mail/`    | Send emails        |
| StorageService | `src/shared/storage/` | S3/R2 file storage |
| CacheModule    | `src/core/cache/`     | Redis caching      |

---

## MailService

Location: `src/shared/mail/`

### Configuration

```env
# .env
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your-username
SMTP_PASS=your-password
SMTP_FROM="noreply@example.com"
```

### Usage

```typescript
import { MailService } from "@/shared/mail";

@Injectable()
export class AuthService {
  constructor(private readonly mailService: MailService) {}

  async sendWelcomeEmail(user: User) {
    await this.mailService.send({
      to: user.email,
      subject: "Welcome!",
      html: `<h1>Hello ${user.firstName}!</h1>`,
    });
  }

  async sendPasswordReset(email: string, token: string) {
    const resetUrl = `https://app.example.com/reset?token=${token}`;

    await this.mailService.send({
      to: email,
      subject: "Reset Your Password",
      html: `<a href="${resetUrl}">Click here to reset</a>`,
    });
  }
}
```

---

## StorageService

Location: `src/shared/storage/`

Supports S3, R2 (Cloudflare), MinIO, and any S3-compatible storage.

### Configuration

```env
# .env
STORAGE_ENDPOINT=https://your-r2-endpoint.r2.cloudflarestorage.com
STORAGE_BUCKET=your-bucket
STORAGE_ACCESS_KEY=your-access-key
STORAGE_SECRET_KEY=your-secret-key
STORAGE_REGION=auto
```

### Usage

```typescript
import { StorageService } from "@/shared/storage";

@Injectable()
export class FilesService {
  constructor(private readonly storage: StorageService) {}

  async uploadFile(file: Express.Multer.File, folder: string) {
    const key = `${folder}/${Date.now()}-${file.originalname}`;

    await this.storage.upload(key, file.buffer, {
      contentType: file.mimetype,
    });

    return { key };
  }

  async getSignedUrl(key: string) {
    return this.storage.getSignedUrl(key, 3600); // 1 hour
  }

  async deleteFile(key: string) {
    await this.storage.delete(key);
  }
}
```

---

## CacheModule (Redis)

Location: `src/core/cache/`

### Configuration

```env
# .env
REDIS_HOST=localhost
REDIS_PORT=6379
```

### Using with @nestjs/cache-manager

```typescript
import { CACHE_MANAGER } from "@nestjs/cache-manager";
import { Cache } from "cache-manager";

@Injectable()
export class UsersService {
  constructor(@Inject(CACHE_MANAGER) private cache: Cache) {}

  async findOne(id: string) {
    // Try cache first
    const cached = await this.cache.get<User>(`user:${id}`);
    if (cached) return cached;

    // Fetch from DB
    const user = await this.prisma.user.findUnique({ where: { id } });

    // Store in cache (TTL: 5 minutes)
    await this.cache.set(`user:${id}`, user, 300000);

    return user;
  }

  async update(id: string, dto: UpdateUserDto) {
    const user = await this.prisma.user.update({
      where: { id },
      data: dto,
    });

    // Invalidate cache
    await this.cache.del(`user:${id}`);

    return user;
  }
}
```

### Cache Patterns

```typescript
// Get or Set pattern
async getOrSet<T>(key: string, fn: () => Promise<T>, ttl = 300000): Promise<T> {
  const cached = await this.cache.get<T>(key);
  if (cached) return cached;

  const value = await fn();
  await this.cache.set(key, value, ttl);
  return value;
}

// Usage
const user = await this.getOrSet(
  `user:${id}`,
  () => this.prisma.user.findUnique({ where: { id } }),
);
```

### Cache Key Conventions

```typescript
// Format: entity:id or entity:id:relation
`user:${userId}``user:${userId}:profile``users:list:${page}:${limit}``org:${orgId}:users`;
```

---

## Adding New Shared Services

1. Create folder in `src/shared/[service-name]/`
2. Create service, module, and index.ts
3. Import module in `AppModule`

```typescript
// src/shared/sms/sms.module.ts
import { Module, Global } from "@nestjs/common";
import { SmsService } from "./sms.service";

@Global() // Makes it available everywhere without importing
@Module({
  providers: [SmsService],
  exports: [SmsService],
})
export class SmsModule {}

// app.module.ts
import { SmsModule } from "./shared/sms";

@Module({
  imports: [SmsModule],
})
export class AppModule {}
```
