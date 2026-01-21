---
name: nestjs-endpoint
description: >
  Creates and modifies NestJS endpoints following project patterns.
  Trigger: When creating controllers, services, DTOs, or modules in the backend.
license: MIT
metadata:
  author: juanma-gomez
  version: "1.0"
  scope: [backend]
  auto_invoke: "endpoint, controller, service, dto, module, CRUD, API"
allowed-tools: Read, Edit, Write, Glob, Grep, Bash, Task
---

## When to Use

- Creating a new REST endpoint
- Adding a new feature module
- Modifying existing controllers or services
- Creating/updating DTOs with Zod validation

---

## Critical Rules - NON-NEGOTIABLE

### Controller

- **ALWAYS**: `@ApiTags()`, `@ApiBearerAuth()`, `@ApiOperation()` decorators
- **ALWAYS**: `ParseUUIDPipe` for ID params
- **ALWAYS**: `@Roles()` for protected routes, `@Public()` for public
- **NEVER**: Business logic in controllers

### Service

- **ALWAYS**: Inject `PrismaService` via constructor
- **ALWAYS**: Use `select` to control response (never return passwords)
- **ALWAYS**: Filter `deletedAt: null` in all queries
- **ALWAYS**: `Promise.all()` for pagination (count + data)
- **NEVER**: Raw SQL, skip soft delete filter

### DTO

- **ALWAYS**: Use `z.object()` + `createZodDto()` from `nestjs-zod`
- **ALWAYS**: Separate `CreateDto` and `UpdateDto`
- **ALWAYS**: Use `z.nativeEnum()` for Prisma enums
- **NEVER**: Use class-validator decorators

### Module

- **ALWAYS**: Import `PrismaModule` (or `DatabaseModule`)
- **ALWAYS**: Export service if used by other modules
- **ALWAYS**: Register in `app.module.ts`

---

## Decision Tree

### Endpoint Protection

```
Public (no auth)? → @Public() decorator
Authenticated user? → Default (JwtAuthGuard global)
Specific role? → @Roles(Role.ADMIN, Role.SUPER_ADMIN)
Own resource only? → Check user.id === resource.userId in service
```

### Response Type

```
Single entity? → Return entity with select
List? → createPaginatedResult(data, total, page, limit)
Create? → Return created entity (201)
Update? → Return updated entity (200)
Delete? → Return void (soft delete, 204)
```

---

## Workflow

### 1. Explore existing patterns

```bash
# Find similar implementations
ls backend/src/modules/
cat backend/src/modules/users/users.controller.ts
cat backend/src/modules/users/users.service.ts
```

### 2. Create module structure

```bash
mkdir -p backend/src/modules/{name}/dto
touch backend/src/modules/{name}/{name}.controller.ts
touch backend/src/modules/{name}/{name}.service.ts
touch backend/src/modules/{name}/{name}.module.ts
touch backend/src/modules/{name}/dto/{name}.dto.ts
```

### 3. Create files in order

1. **DTO** - Define validation schemas
2. **Service** - Business logic with Prisma
3. **Controller** - HTTP routes
4. **Module** - Wire everything together
5. **Register** - Add to `app.module.ts`

### 4. Verify

```bash
npm run lint
npm run start:dev  # Check for errors
```

---

## Code Examples

### DTO Pattern

**File:** `backend/src/modules/users/dto/user.dto.ts`

```typescript
import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';
import { Role } from '@prisma/client';

export const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(72),
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
  role: z.nativeEnum(Role).optional(),
  organizationId: z.string().uuid().optional(),
});

export class CreateUserDto extends createZodDto(createUserSchema) {}

export const updateUserSchema = z.object({
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
  role: z.nativeEnum(Role).optional(),
  isActive: z.boolean().optional(),
});

export class UpdateUserDto extends createZodDto(updateUserSchema) {}
```

### Service Pattern

**File:** `backend/src/modules/users/users.service.ts`

```typescript
@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(pagination: PaginationDto, organizationId?: string) {
    const { page, limit, sortBy, sortOrder } = pagination;
    const skip = (page - 1) * limit;

    const where = {
      deletedAt: null,  // ALWAYS filter soft deleted
      ...(organizationId && { organizationId }),
    };

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: sortBy ? { [sortBy]: sortOrder } : { createdAt: 'desc' },
        select: {  // ALWAYS use select
          id: true,
          email: true,
          firstName: true,
          // password: NEVER include
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    return createPaginatedResult(users, total, page, limit);
  }

  async remove(id: string, deletedBy?: string) {
    // Soft delete - NEVER hard delete
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

### Controller Pattern

**File:** `backend/src/modules/users/users.controller.ts`

```typescript
@ApiTags('Users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Create a new user' })
  @ApiResponse({ status: 201, description: 'User created' })
  create(@Body() dto: CreateUserDto) {
    return this.usersService.create(dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiResponse({ status: 404, description: 'User not found' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.findOne(id);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Delete user (soft delete)' })
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.usersService.remove(id, user.id);
  }
}
```

---

## Commands

```bash
# Generate module with NestJS CLI (optional, then adapt)
nest g module modules/products
nest g service modules/products
nest g controller modules/products

# Lint and format
npm run lint
npm run format

# Start dev server to test
npm run start:dev

# Test specific file
npm run test -- users.service.spec.ts
```

---

## Checklist

- [ ] DTO uses Zod + `createZodDto`
- [ ] Service injects `PrismaService`
- [ ] All queries filter `deletedAt: null`
- [ ] `select` used (no password leak)
- [ ] Controller has Swagger decorators
- [ ] `ParseUUIDPipe` on ID params
- [ ] Module registered in `app.module.ts`
- [ ] `npm run lint` passes

---

## Resources

- **Canonical Example**: `backend/src/modules/users/`
- **Pagination Helper**: `backend/src/common/dto/pagination.dto.ts`
- **Decorators**: `backend/src/common/decorators/`
