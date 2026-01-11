---
name: execute-backend
description: Use when implementing backend features in NestJS 11 with Prisma 5. Requires deep knowledge of the project's layered architecture, Zod validation, soft delete, and multi-tenancy. For planning, use superpowers:writing-plans instead.
---

# NestJS Senior Developer Skill

## Overview

This skill provides comprehensive guidance for implementing backend features in the project's NestJS 11 application. It documents the established architecture patterns, conventions, and best practices that should be followed for all backend development tasks.

**Key capabilities:**
- Create new modules following the canonical pattern
- Implement endpoints with proper authentication and authorization
- Handle database operations with Prisma 5 (soft deletes, multi-tenancy)
- Validate inputs using Zod DTOs
- Leverage Context7 MCP for up-to-date NestJS documentation

## Purpose & Scope

**This skill is for IMPLEMENTATION only.** It is NOT for writing plans.

| Use Case | Skill to Use |
|----------|--------------|
| Planning a new feature, defining requirements | `superpowers:writing-plans` |
| Exploring ideas and clarifying scope | `superpowers:brainstorming` |
| **Implementing backend features** | **`execute-backend`** |

**When to invoke `execute-backend`:**
- Creating a new endpoint
- Adding a database field to an existing model
- Implementing authentication/authorization
- Optimizing database queries
- Creating a new module
- Any backend coding task

**When NOT to use:**
- Writing implementation plans (use `writing-plans`)
- Exploring requirements (use `brainstorming`)
- Researching new technologies (use `writing-plans` + Context7 MCP)

## Architecture Overview

The backend follows a **layered architecture pattern** with clear separation of concerns:

```
backend/src/
├── core/           # Framework infrastructure (config, database, cache, filters, interceptors)
├── common/         # Shared utilities (DTOs, decorators, utils)
├── shared/         # Cross-cutting services (mail, storage)
└── modules/        # Feature modules (auth, users, etc.)
```

### Directory Responsibilities

**Core (`core/`):** Framework-level configuration and infrastructure
- `config/` - Environment configuration with Zod validation
- `database/` - Prisma service with lifecycle hooks
- `cache/` - Redis cache module
- `filters/` - Global exception handling
- `interceptors/` - Response transformation

**Common (`common/`):** Reusable utilities across modules
- `dto/` - Pagination DTO and helpers
- `decorators/` - Custom decorators (CurrentUser, Roles, Public)
- `utils/` - Helper functions

**Shared (`shared/`):** Cross-cutting services
- `mail/` - Email service (Nodemailer)
- `storage/` - File storage (AWS S3)

**Modules (`modules/`):** Feature-specific code
- `auth/` - Authentication (JWT, refresh tokens)
- `users/` - User management (canonical example)

### Key Files Reference

| File | Purpose |
|------|---------|
| `src/main.ts` | Application bootstrap, CORS, ValidationPipe, Swagger |
| `src/app.module.ts` | Root module with all imports |
| `src/core/config/` | Configuration system with Zod validation |
| `src/core/database/prisma.service.ts` | PrismaClient wrapper |
| `src/core/filters/all-exceptions.filter.ts` | Global error handling with Prisma mapping |
| `src/core/interceptors/transform.interceptor.ts` | Response wrapper |
| `prisma/schema.prisma` | Database schema with models |

## Key Patterns Implemented

### Zod DTOs
All request/response validation uses `nestjs-zod` to generate DTO classes from Zod schemas. ValidationPipe is configured globally with `whitelist: true`, `forbidNonWhitelisted: true`, and `transform: true`.

### Soft Delete
All models include a `deletedAt` field. Every query must filter `deletedAt: null` to exclude soft-deleted records. The `remove()` method updates `deletedAt` instead of deleting.

### Multi-tenancy
The system supports organization-based multi-tenancy through the `organizationId` field. Relevant queries should filter by this field when applicable.

### JWT + Refresh Token Authentication
- Access tokens expire in 15 minutes
- Refresh tokens are stored in the database with revocation tracking
- Old refresh tokens are revoked when refreshed (token rotation)
- JWT validation includes checking user existence, active status, and soft delete

### Pagination
All list endpoints use standard pagination with `page`, `limit`, `sortBy`, and `sortOrder` parameters. Results are wrapped with metadata using `createPaginatedResult()`.

### Global Response Wrapper
All API responses are wrapped in the format:
```typescript
{
  success: true,
  data: <response>,
  timestamp: "2026-01-11T..."
}
```

## Core Infrastructure

This section documents the core infrastructure components that power the application.

### Configuration System

The configuration system uses `registerAs()` pattern with Zod validation:

**File:** `src/core/config/env.schema.ts`
```typescript
import { z } from 'zod';

export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default('15m'),
  // ... more variables
});
```

**File:** `src/core/config/config.namespaces.ts`
```typescript
export const configNamespaces = {
  app: registerAs('app', () => ({
    port: process.env.PORT || 3000,
    env: process.env.NODE_ENV,
  })),
  jwt: registerAs('jwt', () => ({
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN,
  })),
  redis: registerAs('redis', () => ({
    host: process.env.REDIS_HOST,
    port: parseInt(process.env.REDIS_PORT, 10),
  })),
};
```

**Usage in services:**
```typescript
constructor(private configService: ConfigService) {
  const jwtSecret = this.configService.get<string>('jwt.secret');
}
```

### Prisma Service

The PrismaService extends PrismaClient with lifecycle hooks:

**File:** `src/core/database/prisma.service.ts`
```typescript
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  async cleanDatabase() {
    if (process.env.NODE_ENV === 'production') return;
    // Delete all data for testing
  }
}
```

**Using transactions:**
```typescript
async createUserWithOrganization(data: CreateUserDto) {
  return this.prisma.$transaction(async (prisma) => {
    const user = await prisma.user.create({ data });
    await prisma.refreshToken.create({
      data: { userId: user.id, token: uuidv4() },
    });
    return user;
  });
}
```

**Logging:**
```typescript
// Enable query logging in development
prisma: {
  log: process.env.NODE_ENV === 'development' ? ['query'] : [],
}
```

### Cache Module

Redis cache integration using `cache-manager-ioredis-yet`:

**File:** `src/core/cache/cache.module.ts`
```typescript
CacheModule.registerAsync({
  imports: [ConfigModule],
  inject: [ConfigService],
  useFactory: async (configService: ConfigService) => ({
    store: await redisStore({
      host: configService.get('redis.host'),
      port: configService.get('redis.port'),
      ttl: configService.get('cache.ttl') || 3600,
    }),
  }),
})
```

**Usage in services:**
```typescript
constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

async getCachedUser(id: string) {
  const cacheKey = `user:${id}`;
  const cached = await this.cacheManager.get(cacheKey);
  if (cached) return cached;

  const user = await this.prisma.user.findUnique({ where: { id } });
  await this.cacheManager.set(cacheKey, user, 3600);
  return user;
}
```

### Exception Filter

Global error handling with Prisma error code mapping:

**File:** `src/core/filters/all-exceptions.filter.ts`
```typescript
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';

    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      switch (exception.code) {
        case 'P2002': // Unique constraint violation
          status = HttpStatus.CONFLICT;
          message = 'Record already exists';
          break;
        case 'P2025': // Record not found
          status = HttpStatus.NOT_FOUND;
          message = 'Record not found';
          break;
        case 'P2003': // Foreign key constraint
          status = HttpStatus.BAD_REQUEST;
          message = 'Invalid reference';
          break;
      }
    }

    response.status(status).json({
      success: false,
      statusCode: status,
      message,
      timestamp: new Date().toISOString(),
    });
  }
}
```

### Transform Interceptor

Wraps all responses in the standard format:

**File:** `src/core/interceptors/transform.interceptor.ts`
```typescript
@Injectable()
export class TransformInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map((data) => ({
        success: true,
        data,
        timestamp: new Date().toISOString(),
      })),
    );
  }
}
```

**Registration in main.ts:**
```typescript
app.useGlobalInterceptors(new TransformInterceptor());
app.useGlobalFilters(new AllExceptionsFilter());
```

### ValidationPipe Configuration

**File:** `src/main.ts`
```typescript
app.useGlobalPipes(
  new ValidationPipe({
    whitelist: true,        // Strip unknown properties
    forbidNonWhitelisted: true,  // Throw error on unknown props
    transform: true,        // Transform payloads to DTO instances
    transformOptions: {
      enableImplicitConversion: true,
    },
  }),
);
```

## Common Utilities

This section documents the shared utilities, DTOs, and decorators available for all modules.

### Pagination DTO

All list endpoints must implement pagination using the standard pattern:

**File:** `src/common/dto/pagination.dto.ts`
```typescript
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type PaginationDto = z.infer<typeof paginationSchema>;
```

**Helper function:**
```typescript
export function createPaginatedResult<T>(
  data: T[],
  total: number,
  page: number,
  limit: number,
): PaginatedResult<T> {
  const totalPages = Math.ceil(total / limit);
  return {
    data,
    meta: {
      total,
      page,
      limit,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
  };
}
```

**Implementation in service:**
```typescript
async findAll(pagination: PaginationDto) {
  const { page, limit, sortBy, sortOrder } = pagination;
  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    this.prisma.user.findMany({
      where: { deletedAt: null },
      skip,
      take: limit,
      orderBy: sortBy ? { [sortBy]: sortOrder } : { createdAt: 'desc' },
    }),
    this.prisma.user.count({ where: { deletedAt: null } }),
  ]);

  return createPaginatedResult(items, total, page, limit);
}
```

### Custom Decorators

#### @CurrentUser()

Extracts the authenticated user from the JWT payload:

```typescript
@Get('me')
getMe(@CurrentUser() user: { id: string; email: string }) {
  return this.usersService.findOne(user.id);
}

// Extract specific field
@Get('profile')
getProfile(@CurrentUser('email') email: string) {
  return this.usersService.findByEmail(email);
}
```

**Returns:** The user object from JWT validation (id, email, role, organizationId)

#### @Roles()

Enforces role-based access control:

```typescript
@Post()
@Roles(Role.ADMIN, Role.SUPER_ADMIN)
create(@Body() dto: CreateUserDto) {
  return this.usersService.create(dto);
}
```

**Available roles:** USER, ADMIN, SUPER_ADMIN

**Requires:** RolesGuard to be configured in the application

#### @Public()

Marks routes as accessible without authentication:

```typescript
@Post('login')
@Public()
login(@Body() dto: LoginDto) {
  return this.authService.login(dto);
}

@Post('register')
@Public()
register(@Body() dto: RegisterDto) {
  return this.authService.register(dto);
}
```

**Note:** The JwtAuthGuard checks for this decorator and skips token validation if present.

### Creating New Decorators

To create a custom decorator, follow this pattern:

```typescript
// common/decorators/custom.decorator.ts
import { createParamDecorator, SetMetadata } from '@nestjs/common';

// Parameter decorator
export const IpAddress = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.ip;
  },
);

// Route decorator with metadata
export const THROTTLE_LIMIT = 'throttleLimit';
export const ThrottleLimit = (limit: number) =>
  SetMetadata(THROTTLE_LIMIT, limit);
```

### Utilities

**File:** `src/common/utils/`

Available utilities:
- `date.utils.ts` - Date formatting helpers
- `string.utils.ts` - String manipulation helpers
- `async.utils.ts` - Async operation helpers

**Usage:**
```typescript
import { formatDate, slugify, delay } from '@/common/utils';
```

## Module Creation Pattern

This section documents the canonical pattern for creating new feature modules in the application. All new modules should follow this structure to maintain consistency.

### Module Template Structure

```
modules/{name}/
├── {name}.controller.ts      # HTTP routes + Swagger decorators
├── {name}.service.ts         # Business logic + Prisma operations
├── {name}.module.ts          # Module definition
└── dto/
    └── {name}.d.ts          # Zod schemas + DTO classes
```

### Step-by-Step Implementation Checklist

1. **Define Prisma model** in `prisma/schema.prisma`
   - Include audit fields: `createdAt`, `updatedAt`, `deletedAt`, `createdBy`, `updatedBy`
   - Add multi-tenancy field if applicable: `organizationId`
   - Include soft delete index

2. **Create migration**
   ```bash
   cd backend
   npx prisma migrate dev --name add_{model_name}
   ```

3. **Create DTO file** in `modules/{name}/dto/{name}.d.ts`
   - Define Zod schema for create/update operations
   - Create DTO classes using `createZodDto()`
   - Export all schemas and DTOs

4. **Implement Service** in `modules/{name}/{name}.service.ts`
   - Inject `PrismaService`
   - Implement CRUD operations
   - Always filter `deletedAt: null` in queries
   - Use `select()` to exclude sensitive fields
   - Use `createPaginatedResult()` for list endpoints

5. **Implement Controller** in `modules/{name}/{name}.controller.ts`
   - Add `@Controller('{name}')`
   - Add Swagger decorators: `@ApiTags`, `@ApiOperation`, `@ApiBearerAuth`
   - Use `@CurrentUser()` to access authenticated user
   - Use `@Roles()` for authorization
   - Apply `@Public()` if route doesn't require auth

6. **Create Module** in `modules/{name}/{name}.module.ts`
   - Declare controller and service in providers
   - Import required modules (PrismaModule)

7. **Register Module** in `app.module.ts`
   ```typescript
   @Module({
     imports: [
       // ... existing imports
       NewModule,
     ],
   })
   export class AppModule {}
   ```

8. **Write unit tests** following the pattern in `modules/users/users.service.spec.ts`

### Complete Example: Products Module

**Prisma Model:**
```prisma
model Product {
  id          String   @id @default(uuid())
  name        String
  description String?
  price       Float
  stock       Int      @default(0)
  isActive    Boolean  @default(true)

  organizationId String? @map("organization_id")
  organization   Organization? @relation(fields: [organizationId], references: [id])

  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")
  deletedAt   DateTime? @map("deleted_at")
  createdBy   String?  @map("created_by")
  updatedBy   String?  @map("updated_by")

  @@index([organizationId])
  @@map("products")
}
```

**DTO File:** `modules/products/dto/product.dto.ts`
```typescript
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const createProductSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  price: z.number().positive(),
  stock: z.number().int().min(0).default(0),
  organizationId: z.string().uuid().optional(),
});

export const updateProductSchema = createProductSchema.partial();

export class CreateProductDto extends createZodDto(createProductSchema) {}
export class UpdateProductDto extends createZodDto(updateProductSchema) {}
```

**Service:** `modules/products/products.service.ts`
```typescript
@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateProductDto, userId?: string) {
    return this.prisma.product.create({
      data: {
        ...dto,
        createdBy: userId,
      },
      select: {
        id: true,
        name: true,
        description: true,
        price: true,
        stock: true,
        isActive: true,
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

    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy: sortBy ? { [sortBy]: sortOrder } : { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          description: true,
          price: true,
          stock: true,
          isActive: true,
          createdAt: true,
        },
      }),
      this.prisma.product.count({ where }),
    ]);

    return createPaginatedResult(products, total, page, limit);
  }

  async findOne(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id, deletedAt: null },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return product;
  }

  async update(id: string, dto: UpdateProductDto, userId?: string) {
    await this.findOne(id); // Verify exists

    return this.prisma.product.update({
      where: { id },
      data: {
        ...dto,
        updatedBy: userId,
      },
    });
  }

  async remove(id: string, userId?: string) {
    await this.findOne(id);

    return this.prisma.product.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        updatedBy: userId,
      },
    });
  }
}
```

**Controller:** `modules/products/products.controller.ts`
```typescript
@ApiTags('Products')
@ApiBearerAuth()
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Create a new product' })
  create(@Body() dto: CreateProductDto, @CurrentUser() user: { id: string }) {
    return this.productsService.create(dto, user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Get all products (paginated)' })
  findAll(@Query() query: Record<string, string>, @CurrentUser() user: { organizationId?: string }) {
    const pagination = paginationSchema.parse(query);
    return this.productsService.findAll(pagination, user.organizationId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get product by ID' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.productsService.findOne(id);
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Update product' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateProductDto,
    @CurrentUser() user: { id: string },
  ) {
    return this.productsService.update(id, dto, user.id);
  }

  @Delete(':id')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Delete product (soft delete)' })
  remove(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: { id: string }) {
    return this.productsService.remove(id, user.id);
  }
}
```

**Module:** `modules/products/products.module.ts`
```typescript
@Module({
  imports: [PrismaModule],
  controllers: [ProductsController],
  providers: [ProductsService],
  exports: [ProductsService],
})
export class ProductsModule {}
```

### Key Patterns to Follow

- **Always use soft delete** - Never hard delete records
- **Filter deletedAt: null** - Every find query must include this
- **Use select()** - Never return sensitive fields like passwords
- **Include audit fields** - Track createdBy and updatedBy
- **Use pagination** - All list endpoints must be paginated
- **Handle Prisma errors** - Map error codes to HTTP exceptions
- **Use TypeScript types** - Don't use `any`

## Authentication and Authorization

This section documents the authentication and authorization patterns implemented in the application.

### JWT Authentication Flow

The application uses JWT (JSON Web Tokens) for stateless authentication with refresh token rotation:

1. User provides credentials (email + password)
2. Server validates credentials and checks user status
3. Server generates short-lived access token (15 minutes)
4. Server generates UUID refresh token and stores in database
5. Client stores both tokens
6. Client uses access token for API requests
7. When access token expires, client uses refresh token to get new pair
8. Old refresh token is revoked (token rotation)

### JWT Strategy

**File:** `modules/auth/strategies/jwt.strategy.ts`
```typescript
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  async validate(payload: JwtPayload) {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub, deletedAt: null },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        organizationId: true,
        isActive: true,
      },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('User not found or inactive');
    }

    return user;
  }
}
```

**JWT Payload structure:**
```typescript
{
  sub: string;           // User ID
  email: string;
  role: string;
  organizationId?: string;
  iat: number;           // Issued at
  exp: number;           // Expiration
}
```

### Refresh Token Rotation

**Security mechanism:** Every time a refresh token is used, it is revoked and a new pair of tokens is issued.

**Flow:**
```typescript
async refreshTokens(refreshToken: string) {
  // Validate token exists and is not expired/revoked
  const storedToken = await this.prisma.refreshToken.findUnique({
    where: { token: refreshToken },
    include: { user: true },
  });

  // Revoke old token
  await this.prisma.refreshToken.update({
    where: { id: storedToken.id },
    data: { revokedAt: new Date() },
  });

  // Generate new tokens
  const tokens = await this.generateTokens(user.id, user.email, user.role);
  return tokens;
}
```

**Token storage in database:**
- `id` - Primary key (UUID)
- `token` - Unique refresh token (UUID)
- `userId` - Reference to user
- `organizationId` - For multi-tenancy
- `expiresAt` - Expiration timestamp
- `revokedAt` - Null if active, timestamp if revoked

### Guards

#### JwtAuthGuard

Protects routes by validating JWT tokens. Skips validation for routes decorated with `@Public()`.

**File:** `modules/auth/guards/jwt-auth.guard.ts`
```typescript
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    return super.canActivate(context);
  }
}
```

#### RolesGuard

Enforces role-based access control:

**File:** `modules/auth/guards/roles.guard.ts`
```typescript
@Injectable()
export class RolesGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) {
      return true; // No roles required
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    const hasRole = requiredRoles.some((role) => user.role === role);

    if (!hasRole) {
      throw new ForbiddenException('Insufficient permissions');
    }

    return true;
  }
}
```

### Role System

**Available roles:**
- `USER` - Standard user
- `ADMIN` - Organization administrator
- `SUPER_ADMIN` - System-wide administrator

**Usage:**
```typescript
@Post()
@Roles(Role.ADMIN, Role.SUPER_ADMIN)
create(@Body() dto: CreateUserDto) {
  return this.usersService.create(dto);
}
```

### Password Security

**Hashing:** Uses bcrypt with 12 salt rounds

```typescript
const hashedPassword = await bcrypt.hash(password, 12);

// Verification
const isValid = await bcrypt.compare(plainPassword, hashedPassword);
```

### Adding Protected Routes

To add a new protected endpoint:

```typescript
@ApiTags('Resource')
@ApiBearerAuth()
@Controller('resource')
export class ResourceController {
  constructor(private readonly service: ResourceService) {}

  @Get()
  findAll(@CurrentUser() user: { id: string; organizationId?: string }) {
    return this.service.findAll(user.organizationId);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  create(@Body() dto: CreateDto, @CurrentUser() user: { id: string }) {
    return this.service.create(dto, user.id);
  }
}
```

### Adding Public Routes

To make a route publicly accessible:

```typescript
@Post('login')
@Public()
login(@Body() dto: LoginDto) {
  return this.authService.login(dto);
}
```

### Logout Implementation

```typescript
// Logout from current device
@Post('logout')
@Public() // Optional: require auth for logout
logout(@Body('refreshToken') refreshToken: string) {
  return this.authService.logout(refreshToken);
}

// Logout from all devices
@Post('logout-all')
logoutAll(@CurrentUser() user: { id: string }) {
  return this.authService.logoutAll(user.id);
}
```

### Auth DTOs

**File:** `modules/auth/dto/auth.dto.ts`
```typescript
export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(72),
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export class RegisterDto extends createZodDto(registerSchema) {}
export class LoginDto extends createZodDto(loginSchema) {}
```

### Security Best Practices

- **Never return passwords** in any response
- **Use generic error messages** for authentication failures
- **Implement rate limiting** on auth endpoints
- **Use HTTPS** in production
- **Set short expiration** on access tokens (15 minutes)
- **Rotate refresh tokens** on every use
- **Validate user existence** on every request (in JWT strategy)

## Database Operations

This section documents the database patterns and best practices for Prisma operations.

### Soft Delete Pattern

All models include a `deletedAt` field for soft deletion. Every query MUST filter `deletedAt: null`:

**Correct:**
```typescript
const user = await this.prisma.user.findUnique({
  where: { id, deletedAt: null },
});

await this.prisma.user.findMany({
  where: { deletedAt: null, organizationId },
});
```

**Incorrect:**
```typescript
// Forgets soft delete filter
const user = await this.prisma.user.findUnique({
  where: { id },
});
```

**Soft delete implementation:**
```typescript
async remove(id: string, userId?: string) {
  await this.prisma.user.update({
    where: { id },
    data: {
      deletedAt: new Date(),
      updatedBy: userId,
    },
  });
}
```

### Multi-tenancy Filtering

When the application is used in multi-tenant mode, filter by `organizationId`:

```typescript
async findAll(pagination: PaginationDto, organizationId?: string) {
  const where = {
    deletedAt: null,
    ...(organizationId && { organizationId }),
  };

  return this.prisma.resource.findMany({ where });
}
```

### Selective Field Selection

Always use `select()` to exclude sensitive fields and control the response shape:

```typescript
// Returns only needed fields, excludes password
const user = await this.prisma.user.findUnique({
  where: { id, deletedAt: null },
  select: {
    id: true,
    email: true,
    firstName: true,
    lastName: true,
    role: true,
    isActive: true,
    organizationId: true,
    createdAt: true,
    // password: NEVER included
  },
});
```

### Transactions

Use `prisma.$transaction()` for atomic operations:

```typescript
async createOrderWithItems(data: CreateOrderDto, userId: string) {
  return this.prisma.$transaction(async (prisma) => {
    const order = await prisma.order.create({
      data: {
        userId,
        items: {
          create: data.items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.price,
          })),
        },
      },
    });

    await prisma.user.update({
      where: { id: userId },
      data: { lastOrderAt: new Date() },
    });

    return order;
  });
}
```

### Pagination Implementation

**Correct implementation:**
```typescript
async findAll(pagination: PaginationDto, organizationId?: string) {
  const { page, limit, sortBy, sortOrder } = pagination;
  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    this.prisma.resource.findMany({
      where: { deletedAt: null, organizationId },
      skip,
      take: limit,
      orderBy: sortBy ? { [sortBy]: sortOrder } : { createdAt: 'desc' },
      select: { /* fields */ },
    }),
    this.prisma.resource.count({
      where: { deletedAt: null, organizationId },
    }),
  ]);

  return createPaginatedResult(items, total, page, limit);
}
```

### Relations and Include

Use `include()` for related data, but be mindful of N+1 queries:

```typescript
// Simple include
const user = await this.prisma.user.findUnique({
  where: { id },
  include: {
    organization: {
      select: { id: true, name: true, slug: true },
    },
  },
});

// Conditional include
const posts = await this.prisma.post.findMany({
  where: { deletedAt: null },
  include: author ? { author: true } : false,
});
```

### Prisma Error Handling

**Map Prisma error codes to HTTP exceptions:**

```typescript
switch (exception.code) {
  case 'P2002': // Unique constraint violation
    throw new ConflictException('Record already exists');
  case 'P2025': // Record not found
    throw new NotFoundException('Record not found');
  case 'P2003': // Foreign key constraint failed
    throw new BadRequestException('Invalid reference');
  case 'P2014': // Relation violation
    throw new BadRequestException('Invalid relation');
}
```

### Anti-Patterns to Avoid

```markdown
## Anti-Patterns

- ❌ Returning passwords or sensitive data in responses
- ❌ Forgetting soft delete filter (`deletedAt: null`)
- ❌ N+1 queries without proper `include()`
- ❌ Not handling Prisma errors (P2002, P2025, etc.)
- ❌ Missing pagination metadata in list endpoints
- ❌ Using raw queries when Prisma can handle it
- ❌ Not using transactions for related operations
- ❌ Hardcoding values instead of using environment config
```

## DTO and Validation Patterns

This section documents the DTO patterns using Zod for validation.

### Zod Schema Pattern

All DTOs are created using Zod schemas with `nestjs-zod`:

**File:** `modules/users/dto/user.dto.ts`
```typescript
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const createUserSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(72, 'Password must be less than 72 characters'),
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
  role: z.enum(['USER', 'ADMIN', 'SUPER_ADMIN']).optional(),
  organizationId: z.string().uuid().optional(),
});

export const updateUserSchema = createUserSchema.partial();

export class CreateUserDto extends createZodDto(createUserSchema) {}
export class UpdateUserDto extends createZodDto(updateUserSchema) {}
```

### Common Validation Patterns

**Email validation:**
```typescript
email: z.string().email('Invalid email address')
```

**Password requirements:**
```typescript
password: z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(72, 'Password must be less than 72 characters')
```

**UUID validation:**
```typescript
id: z.string().uuid('Invalid UUID format')
organizationId: z.string().uuid().optional()
```

**Enum validation:**
```typescript
role: z.enum(['USER', 'ADMIN', 'SUPER_ADMIN'])
```

**Optional fields:**
```typescript
firstName: z.string().optional()
firstName: z.string().nullable().optional()
```

**Number validation:**
```typescript
price: z.number().positive('Price must be positive')
quantity: z.coerce.number().int().min(0, 'Quantity must be non-negative')
```

**String length:**
```typescript
name: z.string().min(1).max(100, 'Name must be 1-100 characters')
```

**Custom refinements:**
```typescript
const schema = z.object({
  password: z.string().min(8),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});
```

### Using DTOs in Controllers

```typescript
@Post()
create(@Body() dto: CreateUserDto) {
  return this.usersService.create(dto);
}

@Patch(':id')
update(
  @Param('id', ParseUUIDPipe) id: string,
  @Body() dto: UpdateUserDto,
) {
  return this.usersService.update(id, dto);
}
```

### ValidationPipe Configuration

The global ValidationPipe is configured to:
- **Whitelist:** Strip unknown properties
- **Forbid non-whitelisted:** Throw error on unknown properties
- **Transform:** Automatically convert types

This means DTO classes automatically validate and transform incoming requests.

### Pagination DTO in Queries

```typescript
@Get()
findAll(@Query() query: Record<string, string>) {
  const pagination = paginationSchema.parse(query);
  return this.usersService.findAll(pagination);
}
```

### Array Validation

```typescript
// Array of strings
tags: z.array(z.string()).min(1, 'At least one tag required')

// Array of objects
items: z.array(
  z.object({
    productId: z.string().uuid(),
    quantity: z.coerce.number().int().min(1),
  })
).min(1, 'At least one item required')
```

### Nested Objects

```typescript
const addressSchema = z.object({
  street: z.string(),
  city: z.string(),
  zipCode: z.string(),
});

const userSchema = z.object({
  email: z.string().email(),
  address: addressSchema,
});
```

### Date Handling

```typescript
// Parse date strings to Date objects
birthDate: z.coerce.date(),

// Date validation
startDate: z.date(),
endDate: z.date().min(startDate, 'End date must be after start date'),
```

## Using Context7 MCP

Context7 MCP provides access to up-to-date documentation for NestJS, Prisma, and other libraries. Use it when you need the latest information not covered in this skill or when best practices have changed.

### Query Pattern

To query Context7 documentation, use the following format:

```markdown
Context7: [Library] [Topic] [Specific Question]

# Examples:
Context7: NestJS 11 guards interceptors filters
Context7: Prisma 5 transactions concurrency
Context7: NestJS 11 modules providers dependency injection
Context7: Prisma 5 raw queries performance
```

### Available Libraries

- `/nestjs/docs` - NestJS core framework documentation
- `/prisma/docs` - Prisma ORM documentation

### When to Use Context7

**Use Context7 when:**

- Implementing features not covered in this skill
- Needing the latest NestJS 11 patterns
- Looking up Prisma 5 specific functionality
- Verifying API changes between versions
- Implementing advanced patterns (CQRS, event sourcing)
- Optimizing database queries with latest Prisma features
- Understanding new NestJS decorators or guards

**Don't use Context7 when:**

- Following the established patterns in this skill
- Simple CRUD operations
- The pattern is clearly documented in the module examples

### Example Queries

**For NestJS guards:**
```
Context7: NestJS 11 custom guards execution order
```

**For Prisma transactions:**
```
Context7: Prisma 5 transaction isolation levels interactive transactions
```

**For NestJS modules:**
```
Context7: NestJS 11 dynamic modules global modules registration
```

**For Prisma performance:**
```
Context7: Prisma 5 query optimization batch operations include where
```

### Integration with This Skill

This skill documents the established patterns for the project. Context7 provides complementary information for:

1. **Advanced features** not yet covered in the skill
2. **Updates** in library versions
3. **Alternative approaches** to consider
4. **Edge cases** not addressed in the skill

When using Context7, compare the information with the project's patterns and adapt accordingly.

## Quick Reference

This section provides fast-lookup guides for common tasks.

### Creating a New Endpoint

1. Add route to controller with decorators
   ```typescript
   @Get(':id')
   @ApiOperation({ summary: 'Get resource by ID' })
   findOne(@Param('id', ParseUUIDPipe) id: string) {
     return this.service.findOne(id);
   }
   ```

2. Create/update Zod schema in dto/
3. Implement service method
4. Add unit tests

### Adding a Field to Table

1. Edit Prisma schema (`prisma/schema.prisma`)
   ```prisma
   fieldName FieldType @map("field_name")
   ```

2. Run migration
   ```bash
   cd backend
   npx prisma migrate dev --name add_field_name
   ```

3. Update Zod schema in dto/
4. Update DTO classes
5. Update service if needed
6. Update tests

### Creating a New Module

1. Create module directory structure
2. Define Prisma model with audit fields
3. Run migration
4. Implement controller, service, module
5. Register in AppModule
6. Write unit tests

### Adding Authentication to Endpoint

```typescript
@ApiBearerAuth()
@Controller('resource')
export class ResourceController {
  @Get()
  findAll(@CurrentUser() user: { id: string }) {
    return this.service.findAll(user.id);
  }
}
```

### Adding Role-Based Authorization

```typescript
@Post()
@Roles(Role.ADMIN, Role.SUPER_ADMIN)
create(@Body() dto: CreateDto) {
  return this.service.create(dto);
}
```

### Implementing Pagination

```typescript
@Get()
findAll(@Query() query: Record<string string>) {
  const pagination = paginationSchema.parse(query);
  return this.service.findAll(pagination);
}
```

### Soft Deleting a Record

```typescript
@Delete(':id')
@Roles(Role.ADMIN)
remove(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: { id: string }) {
  return this.service.remove(id, user.id);
}

// In service
async remove(id: string, userId?: string) {
  await this.findOne(id); // Verify exists
  return this.prisma.resource.update({
    where: { id },
    data: {
      deletedAt: new Date(),
      updatedBy: userId,
    },
  });
}
```

### Making a Route Public

```typescript
@Post('public-endpoint')
@Public()
publicEndpoint(@Body() dto: Dto) {
  return this.service.publicOperation(dto);
}
```

### Using Transactions

```typescript
async complexOperation(data: Dto) {
  return this.prisma.$transaction(async (prisma) => {
    const created = await prisma.entity.create({ data });
    await prisma.auditLog.create({
      data: { action: 'CREATE', entityId: created.id },
    });
    return created;
  });
}
```

## Decision Trees

### Which Exception to Throw?

```
┌─────────────────────────────────────────────────────────────┐
│ What type of error?                                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Record not found?          →  throw new NotFoundException()│
│                                                             │
│  Invalid input data?        →  throw new BadRequestException│
│                                                             │
│  Authentication failed?     →  throw new UnauthorizedException
│                                                             │
│  Authorization failed?      →  throw new ForbiddenException │
│                                                             │
│  Duplicate resource?        →  throw new ConflictException  │
│                                                             │
│  Business rule violation?   →  throw new BadRequestException│
│                                                             │
│  External service failed?   →  throw new ServiceUnavailable │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### When to Use Pagination vs Single Item?

```
┌─────────────────────────────────────────────────────────────┐
│ Is this a list/collection endpoint?                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  YES → Always use pagination                                │
│        - Use page, limit, sortBy, sortOrder                 │
│        - Return createPaginatedResult()                     │
│                                                             │
│  NO  → Single item retrieval                               │
│        - Use findById with ParseUUIDPipe                    │
│        - Throw NotFoundException if not found               │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### When to Use Include vs Separate Queries?

```
┌─────────────────────────────────────────────────────────────┐
│ Do you need related data?                                   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  YES, always with main entity?  →  Use include              │
│        const user = await prisma.user.findUnique({          │
│          where: { id },                                     │
│          include: { organization: true },                   │
│        });                                                  │
│                                                             │
│  YES, conditionally?           →  Use conditional include  │
│        include: condition ? { relation: true } : false,     │
│                                                             │
│  NO, need separate processing?  →  Use separate queries     │
│        const user = await prisma.user.findUnique({...});    │
│        const posts = await prisma.post.findMany({...});     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Soft Delete Handling Decisions

```
┌─────────────────────────────────────────────────────────────┐
│ Query Type                                                  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  findById/findUnique?   →  where: { id, deletedAt: null }  │
│                                                             │
│  findMany (list)?      →  where: { deletedAt: null, ... }  │
│                                                             │
│  create?               →  No deletedAt filter needed       │
│                                                             │
│  update?               →  Verify record exists first        │
│                         (findOne with deletedAt: null)      │
│                                                             │
│  delete?               →  Use soft delete (update deletedAt)│
│                         NEVER use prisma.delete()           │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### JWT Token Decisions

```
┌─────────────────────────────────────────────────────────────┐
│ Token Type                    │  Expiration  │  Storage     │
├───────────────────────────────┼───────────────┼─────────────┤
│  Access Token                 │  15 minutes  │  Client      │
│                               │               │  (memory)    │
├───────────────────────────────┼───────────────┼─────────────┤
│  Refresh Token                │  7 days      │  Database    │
│                               │               │  (with       │
│                               │               │  revocation) │
└───────────────────────────────┴───────────────┴─────────────┘
```

## Testing Guidelines

This section documents the testing patterns and best practices for the NestJS backend.

### Unit Tests (Services)

Test services with mocked PrismaService:

**File:** `modules/users/users.service.spec.ts`
```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { PrismaService } from '../../core/database/prisma.service';

describe('UsersService', () => {
  let service: UsersService;
  let prisma: PrismaService;

  const mockPrisma = {
    user: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should create a user', async () => {
    const dto = {
      email: 'test@example.com',
      password: 'password123',
      firstName: 'Test',
      lastName: 'User',
    };

    const mockUser = {
      id: 'uuid',
      email: dto.email,
      firstName: dto.firstName,
      lastName: dto.lastName,
      role: 'USER',
      isActive: true,
      organizationId: null,
      createdAt: new Date(),
    };

    mockPrisma.user.create.mockResolvedValue(mockUser);

    const result = await service.create(dto);

    expect(result).toEqual(mockUser);
    expect(mockPrisma.user.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        email: dto.email,
        firstName: dto.firstName,
      }),
      select: expect.any(Object),
    });
  });

  it('should find all users with pagination', async () => {
    const pagination = { page: 1, limit: 10 };
    const mockUsers = [
      { id: '1', email: 'user1@example.com' },
      { id: '2', email: 'user2@example.com' },
    ];

    mockPrisma.user.findMany.mockResolvedValue(mockUsers);
    mockPrisma.user.count.mockResolvedValue(2);

    const result = await service.findAll(pagination);

    expect(result.data).toEqual(mockUsers);
    expect(result.meta.total).toBe(2);
    expect(mockPrisma.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { deletedAt: null },
        skip: 0,
        take: 10,
      }),
    );
  });

  it('should throw NotFoundException when user not found', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null);

    await expect(service.findOne('non-existent-id')).rejects.toThrow(
      'User not found',
    );
  });
});
```

### Unit Tests (Controllers)

Test controllers with mocked services:

```typescript
describe('UsersController', () => {
  let controller: UsersController;
  let service: UsersService;

  const mockUsersService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    service = module.get<UsersService>(mockUsersService);
  });

  it('should create a user', async () => {
    const dto = { email: 'test@example.com', password: 'password123' };
    const mockUser = { id: 'uuid', ...dto };

    mockUsersService.create.mockResolvedValue(mockUser);

    const result = await controller.create(dto, { id: 'user-id' });

    expect(result).toEqual(mockUser);
    expect(mockUsersService.create).toHaveBeenCalledWith(dto, 'user-id');
  });
});
```

### Integration Tests

Test with real Prisma using TestDatabaseFactory or SQLite:

```typescript
describe('UsersService (Integration)', () => {
  let service: UsersService;
  let prisma: PrismaService;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      providers: [
        UsersService,
        PrismaService,
        {
          provide: DATABASE_URL,
          useFactory: () => 'file:./test.db',
        },
      ],
    }).compile();

    service = module.get(UsersService);
    prisma = module.get(PrismaService);
  });

  afterAll(async () => {
    await prisma.cleanDatabase();
    await prisma.$disconnect();
  });

  it('should create and retrieve a user', async () => {
    const dto = { email: 'test@example.com', password: 'password123' };

    const created = await service.create(dto);
    const found = await service.findOne(created.id);

    expect(found.email).toBe(dto.email);
  });
});
```

### E2E Tests

Full API testing with supertest:

```typescript
describe('UsersController (E2E)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = module.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();
  });

  it('POST /users should create a user', () => {
    return request(app.getHttpServer())
      .post('/users')
      .send({
        email: 'test@example.com',
        password: 'password123',
        firstName: 'Test',
      })
      .expect(201)
      .expect((res) => {
        expect(res.body.data.email).toBe('test@example.com');
      });
  });

  it('GET /users should return paginated users', () => {
    return request(app.getHttpServer())
      .get('/users?page=1&limit=10')
      .expect(200)
      .expect((res) => {
        expect(res.body.data).toBeInstanceOf(Array);
        expect(res.body.meta).toBeDefined();
      });
  });
});
```

### Testing Best Practices

- **Mock external dependencies** - PrismaService, external APIs
- **Test edge cases** - Not found, invalid input, duplicate entries
- **Test error handling** - Verify correct exceptions are thrown
- **Use meaningful assertions** - Don't just check for truthy values
- **Test business logic** - Focus on service layer where core logic lives
- **Keep tests fast** - Avoid unnecessary database calls in unit tests
- **Use descriptive test names** - Clearly state what is being tested
- **Follow AAA pattern** - Arrange, Act, Assert

## Best Practices and Improvements

This section documents senior-level best practices and opportunities for optimization.

### Performance Optimization

#### Caching Strategies

**Consider adding Redis caching for:**
- Frequently accessed read-only data (configuration, settings)
- Expensive aggregations (counts, statistics)
- Third-party API responses
- User sessions and tokens

**Implementation pattern:**
```typescript
async getCachedData(key: string) {
  const cached = await this.cacheManager.get(key);
  if (cached) return cached;

  const data = await this.expensiveOperation();
  await this.cacheManager.set(key, data, 3600); // 1 hour TTL
  return data;
}

async invalidateCache(pattern: string) {
  const keys = await this.cacheManager.store.keys(pattern);
  await this.cacheManager.store.del(...keys);
}
```

#### Query Optimization

**Avoid N+1 queries:**
```typescript
// BAD: N+1 problem
const users = await prisma.user.findMany();
for (const user of users) {
  const posts = await prisma.post.findMany({ where: { authorId: user.id } });
  user.posts = posts;
}

// GOOD: Use include
const users = await prisma.user.findMany({
  include: {
    posts: true,
  },
});
```

**Use selective fetching:**
```typescript
// BAD: Fetches all fields
const users = await prisma.user.findMany();

// GOOD: Select only needed fields
const users = await prisma.user.findMany({
  select: {
    id: true,
    email: true,
    name: true,
  },
});
```

**Add database indexes for frequently queried fields:**
```prisma
model Product {
  // ...
  
  @@index([organizationId])
  @@index([createdAt])
  @@index([categoryId, isActive])
}
```

### Security Best Practices

#### Input Validation

- Validate all inputs with Zod DTOs
- Sanitize string inputs
- Validate file uploads (type, size)
- Use parameterized queries (Prisma does this automatically)

#### Audit Logging

**Consider implementing audit logging for sensitive operations:**
```typescript
async auditLog(action: string, entity: string, entityId: string, userId: string) {
  await this.prisma.auditLog.create({
    data: {
      action,
      entity,
      entityId,
      userId,
      timestamp: new Date(),
    },
  });
}

// Usage
async deleteUser(id: string, currentUserId: string) {
  const user = await this.findOne(id);
  
  await this.prisma.user.update({
    where: { id },
    data: { deletedAt: new Date() },
  });

  await this.auditLog('DELETE', 'User', id, currentUserId);
}
```

#### Rate Limiting

The application already uses ThrottlerModule. Ensure endpoints with sensitive operations are protected:

```typescript
@Post('login')
@Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 attempts per minute
@Public()
login(@Body() dto: LoginDto) {
  return this.authService.login(dto);
}
```

### Scalability Considerations

#### Database

- Use connection pooling in production
- Implement read replicas for heavy read workloads
- Consider partitioning for large tables
- Use appropriate data types (avoid TEXT for short strings)

#### Application

- Implement horizontal scaling with sticky sessions for WebSocket
- Use Redis for session storage across instances
- Consider message queues (Bull, RabbitMQ) for async processing
- Implement proper health checks and metrics

### Maintainability

#### Code Organization

- Keep modules focused and cohesive
- Extract reusable logic to common utilities
- Use consistent naming conventions
- Limit file size (refactor if > 300 lines)

#### Documentation

- Keep this skill updated with new patterns
- Document architectural decisions
- Use code comments for complex logic
- Maintain API documentation (Swagger)

### Recommended Improvements

**High Priority:**
- Implement comprehensive audit logging
- Add integration tests for critical flows
- Set up monitoring and alerting (Prometheus, Grafana)

**Medium Priority:**
- Implement soft delete cleanup job
- Add request validation middleware
- Set up API versioning strategy
- Implement WebSocket support for real-time features

**Low Priority:**
- GraphQL API alternative for complex queries
- CQRS pattern for complex write operations
- Event sourcing for audit-critical domains
- Multi-language support for error messages

### When to Suggest Improvements

As a senior developer, suggest improvements when:

1. **Performance issues detected** - Slow queries, N+1 problems
2. **Security vulnerabilities** - Missing validation, exposed data
3. **Scalability concerns** - Database bottlenecks, connection limits
4. **Maintainability problems** - Duplicate code, complex logic
5. **Best practice violations** - Not following established patterns

**How to suggest:**
- Identify the issue with evidence
- Propose a solution with trade-offs
- Consider the impact on existing code
- Provide implementation guidance
- Be open to feedback
