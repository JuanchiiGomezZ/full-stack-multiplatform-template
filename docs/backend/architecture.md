# Architecture

## Project Structure

```
backend/
└── src/
    ├── core/                          # Framework infrastructure
    │   ├── config/                    # Environment configuration
    │   │   ├── app.config.ts          # App settings (port, prefix)
    │   │   ├── config.module.ts       # ConfigModule setup
    │   │   └── index.ts               # Barrel export
    │   ├── database/                  # Database layer
    │   │   ├── prisma.service.ts      # PrismaClient wrapper
    │   │   ├── database.module.ts     # Global database module
    │   │   └── index.ts
    │   ├── cache/                     # Redis caching
    │   │   ├── cache.module.ts        # Cache configuration
    │   │   └── index.ts
    │   ├── filters/                   # Exception handlers
    │   │   ├── all-exceptions.filter.ts
    │   │   └── index.ts
    │   ├── interceptors/              # Response transformers
    │   │   ├── transform.interceptor.ts
    │   │   └── index.ts
    │   └── throttler/                 # Rate limiting
    │       ├── throttler.module.ts
    │       └── index.ts
    │
    ├── common/                        # Shared utilities
    │   ├── decorators/                # Custom decorators
    │   │   ├── current-user.decorator.ts
    │   │   ├── public.decorator.ts
    │   │   ├── roles.decorator.ts
    │   │   └── index.ts
    │   ├── dto/                       # Base DTOs
    │   │   ├── pagination.dto.ts
    │   │   └── index.ts
    │   └── utils/                     # Utility functions
    │       ├── string.utils.ts
    │       ├── date.utils.ts
    │       ├── async.utils.ts
    │       └── index.ts
    │
    ├── shared/                        # Shared business services
    │   ├── mail/                      # Email service
    │   │   ├── mail.service.ts
    │   │   ├── mail.module.ts
    │   │   └── index.ts
    │   └── storage/                   # File storage (S3/R2)
    │       ├── storage.service.ts
    │       ├── storage.module.ts
    │       └── index.ts
    │
    ├── modules/                       # Feature modules
    │   ├── auth/                      # Authentication module
    │   │   ├── auth.controller.ts
    │   │   ├── auth.service.ts
    │   │   ├── auth.module.ts
    │   │   ├── dto/
    │   │   ├── guards/
    │   │   ├── strategies/
    │   │   └── index.ts
    │   └── users/                     # Users module
    │       ├── users.controller.ts
    │       ├── users.service.ts
    │       ├── users.module.ts
    │       ├── dto/
    │       └── index.ts
    │
    ├── app.module.ts                  # Root application module
    └── main.ts                        # Application bootstrap
```

## Layer Responsibilities

### Core (`src/core/`)

Framework-level infrastructure that all modules depend on:

- **config**: Environment variables and application settings
- **database**: Prisma ORM integration
- **cache**: Redis caching with cache-manager
- **filters**: Global exception handling
- **interceptors**: Response transformation
- **throttler**: Rate limiting

### Common (`src/common/`)

Shared code without business logic:

- **decorators**: Custom parameter/method decorators
- **dto**: Base DTOs like pagination
- **utils**: Pure utility functions

### Shared (`src/shared/`)

Shared business services used by multiple modules:

- **mail**: Email sending via Nodemailer
- **storage**: File upload/download to S3/R2

### Modules (`src/modules/`)

Feature-based business modules:

- Each module is self-contained
- Has its own controller, service, DTOs
- Exports only what's needed via `index.ts`

## Path Aliases

```typescript
// tsconfig.json paths
"@/*": ["src/*"]
```

Usage:

```typescript
import { PrismaService } from "@/core/database";
import { CurrentUser } from "@/common/decorators";
import { MailService } from "@/shared/mail";
import { AuthService } from "@/modules/auth";
```

## Conventions

### File Naming

| Type        | Pattern                  | Example                    |
| ----------- | ------------------------ | -------------------------- |
| Module      | `feature.module.ts`      | `users.module.ts`          |
| Controller  | `feature.controller.ts`  | `users.controller.ts`      |
| Service     | `feature.service.ts`     | `users.service.ts`         |
| DTO         | `feature.dto.ts`         | `user.dto.ts`              |
| Guard       | `feature.guard.ts`       | `jwt-auth.guard.ts`        |
| Filter      | `feature.filter.ts`      | `all-exceptions.filter.ts` |
| Interceptor | `feature.interceptor.ts` | `transform.interceptor.ts` |
| Strategy    | `feature.strategy.ts`    | `jwt.strategy.ts`          |
| Utility     | `feature.utils.ts`       | `string.utils.ts`          |

### Import Order

1. NestJS packages (`@nestjs/*`)
2. External packages
3. `@/core/*` imports
4. `@/common/*` imports
5. `@/shared/*` imports
6. Relative imports
7. Types (last)

### Module Isolation

- Modules should only import from:
  - `@/core/*` (global infrastructure)
  - `@/common/*` (shared utilities)
  - `@/shared/*` (shared services)
- Cross-module imports only via public API (`index.ts`)
- Never import internal files from other modules

## Global Providers

Defined in `app.module.ts`:

```typescript
providers: [
  // Exception filter - catches all errors
  { provide: APP_FILTER, useClass: AllExceptionsFilter },

  // Response transformer - wraps responses
  { provide: APP_INTERCEPTOR, useClass: TransformInterceptor },

  // Rate limiting
  { provide: APP_GUARD, useClass: ThrottlerGuard },

  // JWT authentication (all routes protected by default)
  { provide: APP_GUARD, useClass: JwtAuthGuard },

  // Role-based access control
  { provide: APP_GUARD, useClass: RolesGuard },
];
```

**Important**: All routes are protected by default. Use `@Public()` decorator for public routes.
