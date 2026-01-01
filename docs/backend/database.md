# Database

## Prisma Setup

### PrismaService

Location: `src/core/database/prisma.service.ts`

The `PrismaService` extends `PrismaClient` and handles connection lifecycle:

```typescript
import { PrismaService } from "@/core/database";

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.user.findMany();
  }
}
```

### DatabaseModule

The `DatabaseModule` is global - no need to import in each module:

```typescript
// Already imported in AppModule
// PrismaService is available everywhere
```

## Schema Conventions

### Model Naming

```prisma
model User {
  id        String   @id @default(uuid())
  email     String   @unique
  firstName String?  @map("first_name")  // Camel in code, snake in DB

  @@map("users")  // Table name in snake_case
}
```

### Standard Fields

Every model should have:

```prisma
model Example {
  id        String    @id @default(uuid())

  // Audit fields
  createdAt DateTime  @default(now()) @map("created_at")
  updatedAt DateTime  @updatedAt @map("updated_at")
  deletedAt DateTime? @map("deleted_at")  // Soft delete
  createdBy String?   @map("created_by")
  updatedBy String?   @map("updated_by")

  @@map("examples")
}
```

### Relations

```prisma
// One-to-Many
model Organization {
  id    String @id @default(uuid())
  users User[]
}

model User {
  organizationId String?       @map("organization_id")
  organization   Organization? @relation(fields: [organizationId], references: [id])

  @@index([organizationId])
}

// Cascade delete
model RefreshToken {
  userId String @map("user_id")
  user   User   @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

### Enums

```prisma
enum Role {
  USER
  ADMIN
  SUPER_ADMIN
}

model User {
  role Role @default(USER)
}
```

## Common Patterns

### Pagination

```typescript
import { createPaginatedResult, PaginationDto } from '@/common/dto';

async findAll(pagination: PaginationDto) {
  const { page, limit, sortBy, sortOrder } = pagination;
  const skip = (page - 1) * limit;

  const [data, total] = await Promise.all([
    this.prisma.product.findMany({
      skip,
      take: limit,
      orderBy: sortBy ? { [sortBy]: sortOrder } : { createdAt: 'desc' },
      where: { deletedAt: null },
    }),
    this.prisma.product.count({ where: { deletedAt: null } }),
  ]);

  return createPaginatedResult(data, total, page, limit);
}
```

### Soft Delete

```typescript
// Never use prisma.model.delete()
// Use soft delete instead:

async remove(id: string, userId: string) {
  return this.prisma.product.update({
    where: { id },
    data: {
      deletedAt: new Date(),
      updatedBy: userId,
    },
  });
}

// Always filter out deleted records
async findAll() {
  return this.prisma.product.findMany({
    where: { deletedAt: null },
  });
}
```

### Transactions

```typescript
async transferFunds(fromId: string, toId: string, amount: number) {
  return this.prisma.$transaction(async (tx) => {
    // Deduct from sender
    await tx.account.update({
      where: { id: fromId },
      data: { balance: { decrement: amount } },
    });

    // Add to receiver
    await tx.account.update({
      where: { id: toId },
      data: { balance: { increment: amount } },
    });

    // Create transaction record
    return tx.transfer.create({
      data: { fromId, toId, amount },
    });
  });
}
```

### Relations and Includes

```typescript
async findOne(id: string) {
  return this.prisma.user.findUnique({
    where: { id },
    include: {
      organization: true,
      refreshTokens: {
        where: { revokedAt: null },
      },
    },
  });
}

// Or select specific fields
async findOne(id: string) {
  return this.prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      organization: {
        select: { name: true },
      },
    },
  });
}
```

## Migrations

### Create Migration

```bash
# Create migration from schema changes
npx prisma migrate dev --name add_products_table

# Apply migrations without creating new
npx prisma migrate deploy
```

### Reset Database

```bash
# Reset and re-apply all migrations (DEV ONLY)
npx prisma migrate reset
```

### Prisma Studio

```bash
# Open visual database browser
npx prisma studio
```

### Generate Client

```bash
# Regenerate Prisma client after schema changes
npx prisma generate
```

## Database Seeding

Create `prisma/seed.ts`:

```typescript
import { PrismaClient, Role } from "@prisma/client";
import * as bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  // Create admin user
  const hashedPassword = await bcrypt.hash("admin123", 10);

  await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: {},
    create: {
      email: "admin@example.com",
      password: hashedPassword,
      firstName: "Admin",
      lastName: "User",
      role: Role.SUPER_ADMIN,
      emailVerified: true,
    },
  });

  console.log("Seed completed");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
```

Add to `package.json`:

```json
{
  "prisma": {
    "seed": "ts-node prisma/seed.ts"
  }
}
```

Run seed:

```bash
npx prisma db seed
```
