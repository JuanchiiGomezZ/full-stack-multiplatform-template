# Backend: API Endpoints

<!-- AUTO-GENERATED: START -->

## NestJS Pattern

This template follows standard NestJS patterns for creating REST APIs.

### Module Structure

Every endpoint group is organized as a NestJS module:

```
module-name/
├── module-name.controller.ts    # Routes and HTTP handling
├── module-name.service.ts       # Business logic
├── module-name.module.ts        # Dependencies
└── dto/
    ├── create-module.dto.ts     # Request DTOs
    └── update-module.dto.ts
```

## Canonical Example: Users Module

Location: `backend/src/modules/users/`

### Controller Pattern

**File:** `backend/src/modules/users/users.controller.ts`

```typescript
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
} from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { UsersService } from './users.service';
import { CreateUserDto, UpdateUserDto } from './dto/user.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Create a new user (Admin only)' })
  create(@Body() dto: CreateUserDto) {
    return this.usersService.create(dto);
  }

  @Get()
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get all users with pagination' })
  findAll(@Query() query: Record<string, string>) {
    const pagination = paginationSchema.parse(query);
    return this.usersService.findAll(pagination);
  }

  @Get('me')
  @ApiOperation({ summary: 'Get current user profile' })
  getMe(@CurrentUser() user: { id: string }) {
    return this.usersService.findOne(user.id);
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateUserDto,
    @CurrentUser() user: { id: string },
  ) {
    return this.usersService.update(id, dto, user.id);
  }

  @Delete(':id')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Soft delete user' })
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.usersService.remove(id, user.id);
  }
}
```

**Key points:**
- `@Controller('users')` defines base route: `/users`
- `@ApiTags()` groups endpoints in Swagger
- `@Roles()` enforces role-based access control
- `@CurrentUser()` extracts user from JWT
- Validation pipes (`ParseUUIDPipe`) ensure type safety

**See:** `backend/src/modules/users/users.controller.ts:1-81`

### Service Pattern

**File:** `backend/src/modules/users/users.service.ts`

```typescript
import { Injectable, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../core/database/prisma.service';
import { CreateUserDto, UpdateUserDto } from './dto/user.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateUserDto) {
    const hashedPassword = await bcrypt.hash(dto.password, 12);

    return this.prisma.user.create({
      data: {
        ...dto,
        password: hashedPassword,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        organizationId: true,
        createdAt: true,
      },
    });
  }

  async findAll(pagination: PaginationDto, organizationId?: string) {
    const { page, limit, sortBy, sortOrder } = pagination;
    const skip = (page - 1) * limit;

    const where = {
      deletedAt: null,
      ...(organizationId && { organizationId }),
    };

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: sortBy ? { [sortBy]: sortOrder } : { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          isActive: true,
          organizationId: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    return createPaginatedResult(users, total, page, limit);
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id, deletedAt: null },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        emailVerified: true,
        organizationId: true,
        organization: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async update(id: string, dto: UpdateUserDto, updatedBy?: string) {
    await this.findOne(id); // Verify exists

    return this.prisma.user.update({
      where: { id },
      data: {
        ...dto,
        updatedBy,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        organizationId: true,
        updatedAt: true,
      },
    });
  }

  async remove(id: string, deletedBy?: string) {
    await this.findOne(id); // Verify exists

    // Soft delete
    await this.prisma.user.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        updatedBy: deletedBy,
      },
    });
  }
}
```

**Key patterns:**
- Always use `deletedAt: null` filter for soft-deleted records
- Use `select` to control response shape (never return passwords)
- Parallel queries with `Promise.all()` for pagination
- Throw descriptive exceptions (`NotFoundException`)
- Track audit trail with `updatedBy`, `deletedAt`

**See:** `backend/src/modules/users/users.service.ts:1-139`

## DTO Pattern (Data Transfer Objects)

DTOs define request/response structure with validation.

### Using Zod Validation

**File:** `backend/src/modules/users/dto/user.dto.ts`

```typescript
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  role: z.enum(['USER', 'ADMIN', 'SUPER_ADMIN']).optional(),
  organizationId: z.string().uuid().optional(),
});

export class CreateUserDto extends createZodDto(createUserSchema) {}

export const updateUserSchema = createUserSchema.partial();
export class UpdateUserDto extends createZodDto(updateUserSchema) {}
```

**Validation happens automatically:**
- Invalid email → `400 Bad Request`
- Password too short → `400 Bad Request`
- Invalid UUID → `400 Bad Request`

### Alternative: class-validator

```typescript
import { IsEmail, IsString, MinLength, IsOptional, IsEnum } from 'class-validator';
import { Role } from '@prisma/client';

export class CreateUserDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;

  @IsString()
  @IsOptional()
  firstName?: string;

  @IsString()
  @IsOptional()
  lastName?: string;

  @IsEnum(Role)
  @IsOptional()
  role?: Role;
}
```

**This template uses Zod** (see `backend/package.json` dependencies).

## Pagination Pattern

**File:** `backend/src/common/dto/pagination.dto.ts`

```typescript
import { z } from 'zod';

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type PaginationDto = z.infer<typeof paginationSchema>;

export function createPaginatedResult<T>(
  data: T[],
  total: number,
  page: number,
  limit: number,
) {
  return {
    data,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}
```

**Usage in controller:**
```typescript
@Get()
findAll(@Query() query: Record<string, string>) {
  const pagination = paginationSchema.parse(query);
  return this.usersService.findAll(pagination);
}
```

**Example request:**
```
GET /users?page=2&limit=20&sortBy=createdAt&sortOrder=asc
```

**Response:**
```json
{
  "data": [ /* 20 users */ ],
  "meta": {
    "page": 2,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  }
}
```

## Swagger Documentation

**Decorators:**
- `@ApiTags('Group')` - Group endpoints
- `@ApiOperation({ summary: '...' })` - Describe endpoint
- `@ApiResponse({ status: 201, description: '...' })` - Document responses
- `@ApiBearerAuth()` - Require JWT token

**Access Swagger UI:**
```
http://localhost:3000/api/docs
```

## Custom Decorators

### @CurrentUser()

Extracts user from JWT payload.

**File:** `backend/src/common/decorators/current-user.decorator.ts`

```typescript
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
```

**Usage:**
```typescript
@Get('me')
getMe(@CurrentUser() user: { id: string; email: string }) {
  return this.usersService.findOne(user.id);
}
```

### @Roles()

Declares required roles for endpoint.

**File:** `backend/src/common/decorators/roles.decorator.ts`

```typescript
import { SetMetadata } from '@nestjs/common';
import { Role } from '@prisma/client';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
```

**Usage:**
```typescript
@Post()
@Roles(Role.ADMIN, Role.SUPER_ADMIN)
create(@Body() dto: CreateUserDto) {
  return this.usersService.create(dto);
}
```

## Error Handling

### Standard Exceptions

```typescript
import {
  NotFoundException,
  BadRequestException,
  UnauthorizedException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';

// 404
throw new NotFoundException('User not found');

// 400
throw new BadRequestException('Invalid email format');

// 401
throw new UnauthorizedException('Invalid credentials');

// 403
throw new ForbiddenException('Insufficient permissions');

// 409
throw new ConflictException('Email already exists');
```

### Global Exception Filter

**File:** `backend/src/core/filters/http-exception.filter.ts`

All exceptions are caught and transformed to consistent format:

```json
{
  "statusCode": 404,
  "message": "User not found",
  "error": "Not Found",
  "timestamp": "2026-01-01T12:00:00.000Z",
  "path": "/users/invalid-id"
}
```

## Common Patterns

### Multi-tenancy Filtering

```typescript
async findAll(pagination: PaginationDto, organizationId?: string) {
  const where = {
    deletedAt: null,
    ...(organizationId && { organizationId }),
  };

  return this.prisma.model.findMany({ where });
}
```

### Soft Delete

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

### Password Hashing

```typescript
import * as bcrypt from 'bcrypt';

// Hash password
const hashedPassword = await bcrypt.hash(password, 12);

// Verify password
const isValid = await bcrypt.compare(plainPassword, hashedPassword);
```

### Selective Field Return

```typescript
return this.prisma.user.create({
  data: { ...dto },
  select: {
    id: true,
    email: true,
    firstName: true,
    lastName: true,
    role: true,
    // password: NEVER included
  },
});
```

## Adding a New Endpoint

See `.claude/rules/sop/adding-api-endpoint.md` for step-by-step guide.

<!-- AUTO-GENERATED: END -->
