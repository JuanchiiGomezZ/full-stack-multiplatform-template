---
name: prisma-migration
description: >
  Manages Prisma schema changes and database migrations.
  Trigger: When creating/modifying models, running migrations, or changing database schema.
license: MIT
metadata:
  author: juanma-gomez
  version: "1.0"
  scope: [backend]
  auto_invoke: "prisma, migration, model, schema, database"
allowed-tools: Read, Edit, Write, Bash, Glob, Grep
---

## When to Use

- Adding a new database model
- Modifying existing model fields
- Adding relations between models
- Creating or running migrations
- Adding indexes for performance

---

## Critical Rules - NON-NEGOTIABLE

### Model Structure

- **ALWAYS**: UUIDv4 as primary key (`@id @default(uuid())`)
- **ALWAYS**: `createdAt`, `updatedAt` timestamps
- **ALWAYS**: `deletedAt` for soft delete support
- **ALWAYS**: `@map("snake_case")` for columns, `@@map("table_name")` for tables
- **NEVER**: Auto-increment integer PKs

### Naming

- **ALWAYS**: Model names in PascalCase singular (`User`, `Product`)
- **ALWAYS**: Table names in snake_case plural (`users`, `products`)
- **ALWAYS**: Column names in snake_case (`created_at`, `organization_id`)
- **NEVER**: camelCase in database (use `@map`)

### Relations

- **ALWAYS**: Add `@@index` for foreign keys
- **ALWAYS**: Define both sides of relation
- **ALWAYS**: Use `onDelete: Cascade` or `SetNull` appropriately
- **NEVER**: Orphan records (always handle cascades)

### Multi-tenancy

- **ALWAYS**: Add `organizationId` for tenant-scoped data
- **ALWAYS**: Add `@@index([organizationId])` for query performance
- **NEVER**: Create models without considering tenant scope

---

## Decision Tree

### New Model

```
Tenant-scoped data? → Add organizationId + relation
Needs audit trail? → Add createdBy, updatedBy
Has soft delete? → Add deletedAt (yes for most models)
Frequently queried field? → Add @@index
```

### Migration Type

```
New model? → npx prisma migrate dev --name add_<model>
Add field? → npx prisma migrate dev --name add_<field>_to_<model>
Modify field? → npx prisma migrate dev --name update_<field>_in_<model>
Add index? → npx prisma migrate dev --name add_<field>_index
```

---

## Workflow

### 1. Edit schema

**File:** `backend/prisma/schema.prisma`

### 2. Validate schema

```bash
cd backend
npx prisma validate
```

### 3. Create migration

```bash
npx prisma migrate dev --name <descriptive_name>
```

### 4. Generate client

```bash
npx prisma generate
```

### 5. Verify

```bash
npx prisma studio  # Visual check
npm run start:dev  # App starts without errors
```

---

## Code Examples

### Standard Model Template

```prisma
/// Description of what this model represents
model Product {
  id          String   @id @default(uuid())
  name        String
  description String?
  price       Decimal  @db.Decimal(10, 2)
  isActive    Boolean  @default(true) @map("is_active")

  // Multi-tenancy
  organizationId String       @map("organization_id")
  organization   Organization @relation(fields: [organizationId], references: [id])

  // Audit fields
  createdAt DateTime  @default(now()) @map("created_at")
  updatedAt DateTime  @updatedAt @map("updated_at")
  deletedAt DateTime? @map("deleted_at")
  createdBy String?   @map("created_by")
  updatedBy String?   @map("updated_by")

  // Relations
  // orders Order[]

  @@index([organizationId])
  @@index([name])
  @@map("products")
}
```

### Relation Patterns

**One-to-Many:**
```prisma
model User {
  id       String    @id @default(uuid())
  posts    Post[]    // One user has many posts
}

model Post {
  id       String @id @default(uuid())
  userId   String @map("user_id")
  user     User   @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
}
```

**Many-to-Many:**
```prisma
model Post {
  id    String @id @default(uuid())
  tags  Tag[]  @relation("PostTags")
}

model Tag {
  id    String @id @default(uuid())
  posts Post[] @relation("PostTags")
}
```

### Enum Definition

```prisma
enum Status {
  DRAFT
  PUBLISHED
  ARCHIVED
}

model Post {
  status Status @default(DRAFT)
}
```

---

## Commands

```bash
# Validate schema syntax
npx prisma validate

# Create migration (development)
npx prisma migrate dev --name <name>

# Apply migrations (production)
npx prisma migrate deploy

# Reset database (WARNING: deletes all data)
npx prisma migrate reset

# Generate Prisma Client
npx prisma generate

# Open visual database browser
npx prisma studio

# Format schema file
npx prisma format
```

---

## Checklist

- [ ] Model has UUID primary key
- [ ] Model has `createdAt`, `updatedAt`
- [ ] Model has `deletedAt` for soft delete
- [ ] Column names use `@map("snake_case")`
- [ ] Table name uses `@@map("table_name")`
- [ ] Foreign keys have `@@index`
- [ ] `organizationId` added if tenant-scoped
- [ ] `npx prisma validate` passes
- [ ] Migration created and applied
- [ ] `npx prisma generate` run after changes

---

## Resources

- **Schema File**: `backend/prisma/schema.prisma`
- **Migrations**: `backend/prisma/migrations/`
- **Canonical Models**: `User`, `Organization`, `RefreshToken` in schema.prisma
