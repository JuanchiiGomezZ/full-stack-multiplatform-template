# Backend: Database

<!-- AUTO-GENERATED: START -->

## Stack

- **Database:** PostgreSQL
- **ORM:** Prisma 5
- **Schema Location:** `backend/prisma/schema.prisma`
- **Migrations:** `backend/prisma/migrations/`

## Schema Overview

**File:** `backend/prisma/schema.prisma`

### Models

#### Organization
```prisma
model Organization {
  id        String   @id @default(uuid())
  name      String
  slug      String   @unique
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")
  deletedAt DateTime? @map("deleted_at")

  // Relations
  users         User[]
  refreshTokens RefreshToken[]

  @@map("organizations")
}
```

**Purpose:** Multi-tenancy support - users and data belong to organizations

#### User
```prisma
model User {
  id             String   @id @default(uuid())
  email          String   @unique
  password       String
  firstName      String?  @map("first_name")
  lastName       String?  @map("last_name")
  role           Role     @default(USER)
  isActive       Boolean  @default(true) @map("is_active")
  emailVerified  Boolean  @default(false) @map("email_verified")

  // Multi-tenancy
  organizationId String?  @map("organization_id")
  organization   Organization? @relation(fields: [organizationId], references: [id])

  // Audit fields
  createdAt      DateTime @default(now()) @map("created_at")
  updatedAt      DateTime @updatedAt @map("updated_at")
  deletedAt      DateTime? @map("deleted_at")
  createdBy      String?  @map("created_by")
  updatedBy      String?  @map("updated_by")

  // Relations
  refreshTokens  RefreshToken[]

  @@index([email])
  @@index([organizationId])
  @@map("users")
}
```

**Key fields:**
- `deletedAt` - Soft delete support
- `createdBy`, `updatedBy` - Audit trail
- `organizationId` - Multi-tenancy
- Indexes on `email` and `organizationId` for performance

#### RefreshToken
```prisma
model RefreshToken {
  id             String   @id @default(uuid())
  token          String   @unique
  userId         String   @map("user_id")
  user           User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  // Multi-tenancy
  organizationId String?  @map("organization_id")
  organization   Organization? @relation(fields: [organizationId], references: [id])

  expiresAt      DateTime @map("expires_at")
  createdAt      DateTime @default(now()) @map("created_at")
  revokedAt      DateTime? @map("revoked_at")

  @@index([userId])
  @@index([token])
  @@map("refresh_tokens")
}
```

**Purpose:** JWT refresh token rotation - old tokens are revoked

### Enums

```prisma
enum Role {
  USER
  ADMIN
  SUPER_ADMIN
}
```

**See:** `backend/prisma/schema.prisma:1-92`

## Prisma Service

**File:** `backend/src/core/database/prisma.service.ts`

```typescript
import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
```

**Usage in services:**
```typescript
@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.user.findMany();
  }
}
```

## Common Query Patterns

### Soft Delete Filter

**Always filter soft-deleted records:**

```typescript
// ✅ Correct
await this.prisma.user.findMany({
  where: { deletedAt: null },
});

// ❌ Wrong (includes deleted)
await this.prisma.user.findMany();
```

### Multi-tenancy Filter

```typescript
await this.prisma.user.findMany({
  where: {
    deletedAt: null,
    organizationId: orgId, // Scope to organization
  },
});
```

### Pagination

```typescript
const { page, limit } = pagination;
const skip = (page - 1) * limit;

const [items, total] = await Promise.all([
  this.prisma.user.findMany({
    where: { deletedAt: null },
    skip,
    take: limit,
    orderBy: { createdAt: 'desc' },
  }),
  this.prisma.user.count({
    where: { deletedAt: null },
  }),
]);
```

### Select Specific Fields

```typescript
// Only return needed fields
await this.prisma.user.findUnique({
  where: { id },
  select: {
    id: true,
    email: true,
    firstName: true,
    lastName: true,
    role: true,
    // password: false (excluded by default)
  },
});
```

### Include Relations

```typescript
await this.prisma.user.findUnique({
  where: { id },
  include: {
    organization: {
      select: {
        id: true,
        name: true,
        slug: true,
      },
    },
  },
});
```

### Soft Delete Operation

```typescript
async remove(id: string, deletedBy?: string) {
  await this.prisma.user.update({
    where: { id },
    data: {
      deletedAt: new Date(),
      updatedBy: deletedBy,
    },
  });
}
```

### Upsert Pattern

```typescript
await this.prisma.user.upsert({
  where: { email },
  update: { firstName, lastName },
  create: { email, firstName, lastName, password },
});
```

### Transactions

```typescript
await this.prisma.$transaction(async (prisma) => {
  const user = await prisma.user.create({ data: userData });
  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      token: refreshToken,
      expiresAt: new Date(),
    },
  });
  return user;
});
```

## Migrations

### Create Migration

```bash
cd backend

# 1. Edit prisma/schema.prisma
# 2. Generate migration
npx prisma migrate dev --name add_your_feature

# Migration created in: prisma/migrations/TIMESTAMP_add_your_feature/
```

### Apply Migrations (Production)

```bash
npx prisma migrate deploy
```

### Reset Database (Development)

```bash
npx prisma migrate reset
# WARNING: Deletes all data and re-runs migrations
```

### Generate Prisma Client

```bash
npx prisma generate
# Re-generates TypeScript types after schema changes
```

## Prisma Studio

Visual database browser:

```bash
npx prisma studio
# Opens http://localhost:5555
```

## Seeding

**File:** `backend/prisma/seed.ts` (optional)

```typescript
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash('admin123', 12);

  await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      password: hashedPassword,
      firstName: 'Admin',
      lastName: 'User',
      role: 'SUPER_ADMIN',
      emailVerified: true,
    },
  });

  console.log('Seeded admin user');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

**Run seed:**
```bash
npx prisma db seed
```

## Database Configuration

**File:** `backend/src/core/config/database.config.ts`

```typescript
import { registerAs } from '@nestjs/config';

export default registerAs('database', () => ({
  url: process.env.DATABASE_URL,
}));
```

**Environment variable:**
```bash
DATABASE_URL="postgresql://user:password@localhost:5432/dbname?schema=public"
```

## Performance Best Practices

### Indexes

Add indexes for frequently queried fields:

```prisma
model User {
  // ...
  @@index([email])
  @@index([organizationId])
  @@index([createdAt])
}
```

### Select Only Needed Fields

```typescript
// ✅ Good - Only fetch needed fields
await this.prisma.user.findMany({
  select: { id: true, email: true },
});

// ❌ Bad - Fetches all fields
await this.prisma.user.findMany();
```

### Batch Operations

```typescript
// Create multiple records
await this.prisma.user.createMany({
  data: [user1, user2, user3],
});

// Update multiple records
await this.prisma.user.updateMany({
  where: { role: 'USER' },
  data: { isActive: true },
});
```

### Connection Pooling

Prisma handles connection pooling automatically. Configure in `schema.prisma`:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

**For production, use connection pooling:**
```bash
DATABASE_URL="postgresql://user:pass@host:5432/db?pgbouncer=true&connection_limit=10"
```

## Common Patterns

### Check if Exists

```typescript
const exists = await this.prisma.user.findUnique({
  where: { email },
  select: { id: true },
});

if (exists) {
  throw new ConflictException('Email already exists');
}
```

### Cascade Delete

```prisma
model RefreshToken {
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

When user is deleted, all refresh tokens are automatically deleted.

### Conditional Queries

```typescript
const where: any = { deletedAt: null };

if (organizationId) {
  where.organizationId = organizationId;
}

if (search) {
  where.OR = [
    { email: { contains: search, mode: 'insensitive' } },
    { firstName: { contains: search, mode: 'insensitive' } },
  ];
}

await this.prisma.user.findMany({ where });
```

## Troubleshooting

### Schema Out of Sync

```bash
npx prisma db push
# Syncs schema to database without creating migration
```

### View Generated SQL

```typescript
// Enable query logging
const user = await this.prisma.user.findMany();
console.log(this.prisma.$queryRaw`SELECT * FROM users`);
```

### Connection Issues

Check `DATABASE_URL` format:
```
postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=SCHEMA
```

<!-- AUTO-GENERATED: END -->
