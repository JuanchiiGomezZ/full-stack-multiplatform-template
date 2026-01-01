# Validation

## Zod + nestjs-zod

This project uses Zod for validation instead of class-validator. DTOs are created using `nestjs-zod`.

## Creating DTOs

### Basic Pattern

```typescript
// dto/product.dto.ts
import { z } from "zod";
import { createZodDto } from "nestjs-zod";

// 1. Define Zod schema
export const createProductSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  price: z.number().positive(),
  isActive: z.boolean().default(true),
});

// 2. Create DTO class
export class CreateProductDto extends createZodDto(createProductSchema) {}

// 3. Update DTO (all fields optional)
export const updateProductSchema = createProductSchema.partial();
export class UpdateProductDto extends createZodDto(updateProductSchema) {}
```

### Using DTOs

```typescript
// product.controller.ts
import { Body, Post } from '@nestjs/common';
import { CreateProductDto } from './dto/product.dto';

@Post()
create(@Body() dto: CreateProductDto) {
  // dto is validated and typed
  console.log(dto.name);   // string
  console.log(dto.price);  // number
}
```

## Common Schemas

### String Validations

```typescript
z.string(); // Any string
z.string().min(1); // Non-empty
z.string().max(255); // Max length
z.string().email(); // Email format
z.string().url(); // URL format
z.string().uuid(); // UUID format
z.string().regex(/^[a-z]+$/); // Custom regex
z.string().optional(); // Optional field
z.string().nullable(); // Can be null
```

### Number Validations

```typescript
z.number(); // Any number
z.number().positive(); // > 0
z.number().nonnegative(); // >= 0
z.number().int(); // Integer only
z.number().min(0).max(100); // Range
z.coerce.number(); // Coerce from string (for query params)
```

### Date Validations

```typescript
z.date(); // Date object
z.coerce.date(); // Coerce from string/number
z.string().datetime(); // ISO datetime string
```

### Enum Validations

```typescript
// From static values
z.enum(["PENDING", "APPROVED", "REJECTED"]);

// From Prisma enum
import { Role } from "@prisma/client";
z.nativeEnum(Role);
```

### Array Validations

```typescript
z.array(z.string()); // Array of strings
z.array(z.string()).min(1); // Non-empty array
z.array(z.string()).max(10); // Max 10 items
```

### Object Validations

```typescript
z.object({
  nested: z.object({
    field: z.string(),
  }),
});
```

## Pagination DTO

Location: `src/common/dto/pagination.dto.ts`

```typescript
import { z } from "zod";

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  sortBy: z.string().optional(),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export type PaginationDto = z.infer<typeof paginationSchema>;
```

Usage in controller:

```typescript
import { paginationSchema } from '@/common/dto';

@Get()
findAll(@Query() query: Record<string, string>) {
  // Parse and validate pagination
  const pagination = paginationSchema.parse(query);
  return this.service.findAll(pagination);
}
```

## Transformation & Defaults

```typescript
const schema = z.object({
  // Default value
  status: z.string().default("pending"),

  // Transform value
  email: z
    .string()
    .email()
    .transform((v) => v.toLowerCase()),

  // Coerce type (for query params)
  page: z.coerce.number(),

  // Optional with default
  isActive: z.boolean().optional().default(true),
});
```

## Conditional Validation

```typescript
const schema = z
  .object({
    type: z.enum(["individual", "company"]),

    // Required only for companies
    companyName: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.type === "company") {
        return !!data.companyName;
      }
      return true;
    },
    {
      message: "Company name is required for company type",
      path: ["companyName"],
    }
  );
```

## Custom Error Messages

```typescript
const schema = z.object({
  email: z
    .string({
      required_error: "Email is required",
      invalid_type_error: "Email must be a string",
    })
    .email({ message: "Invalid email format" }),

  password: z
    .string()
    .min(8, { message: "Password must be at least 8 characters" })
    .max(72, { message: "Password too long" }),
});
```

## Schema Composition

```typescript
// Base schema
const baseUserSchema = z.object({
  email: z.string().email(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
});

// Extend for registration (add password)
const registerSchema = baseUserSchema
  .extend({
    password: z.string().min(8),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

// Partial for updates
const updateSchema = baseUserSchema.partial();

// Pick specific fields
const loginSchema = baseUserSchema.pick({ email: true }).extend({
  password: z.string(),
});

// Omit fields
const publicUserSchema = baseUserSchema.omit({ password: true });
```

## Validation Error Format

When validation fails, the response format is:

```json
{
  "statusCode": 400,
  "message": [
    "email: Invalid email",
    "password: String must contain at least 8 character(s)"
  ],
  "error": "Bad Request",
  "timestamp": "2026-01-01T18:00:00.000Z",
  "path": "/api/users"
}
```
