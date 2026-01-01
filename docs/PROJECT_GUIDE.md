# Project Complete Guide

> This comprehensive guide helps Claude Code and developers understand the architecture, patterns, and workflows of this fullstack template project.

## Table of Contents

1. [Project Overview](#project-overview)
2. [Architecture](#architecture)
3. [Tech Stack](#tech-stack)
4. [Project Structure](#project-structure)
5. [Development Workflows](#development-workflows)
6. [Code Patterns & Conventions](#code-patterns--conventions)
7. [Backend Documentation](#backend-documentation)
8. [Frontend Documentation](#frontend-documentation)
9. [Database Schema](#database-schema)
10. [Setup & Configuration](#setup--configuration)

---

## Project Overview

This is a **production-ready fullstack SaaS template** designed for rapid development with best practices, clear patterns, and comprehensive documentation.

**Purpose**: Provide a solid foundation for scalable web applications with authentication, state management, and API integration already configured.

**Key Features**:
- Full authentication system (JWT + Refresh tokens)
- Role-based access control (RBAC)
- Multi-tenancy support
- Type-safe API communication
- Responsive UI with modern components
- Comprehensive error handling
- Rate limiting and caching
- Database migrations and schema management

---

## Architecture

### High-Level System Design

```
┌─────────────────────────────────────────────────────────┐
│                    Client Browser                       │
│              (Next.js 16 + React 19)                    │
└────────────┬──────────────────────────────┬─────────────┘
             │ HTTP/REST                    │
             │                              │
    ┌────────▼──────────┐        ┌──────────▼────────┐
    │   Frontend App    │        │   Static Assets   │
    │  (port 4000)      │        │   (CSS, JS, etc)  │
    └────────┬──────────┘        └───────────────────┘
             │
             │ API Requests
             │ Authorization: Bearer JWT
             │
    ┌────────▼──────────────────────────────────────┐
    │         NestJS Backend API                    │
    │          (port 3000)                          │
    │                                                │
    │  ┌──────────────┐    ┌──────────────┐        │
    │  │  Controllers │    │   Services   │        │
    │  │  (Routing)   │───▶│ (Business)   │        │
    │  └──────────────┘    └──────────────┘        │
    │         ▲                    ▼                │
    │         │              ┌────────────┐        │
    │         │              │ Prisma ORM │        │
    │         │              └────────────┘        │
    │  Guards & Interceptors  │                   │
    │  (Auth, Transform)      │                   │
    └────────┬────────────────┼──────────────────┘
             │                │
      ┌──────▼─────┐   ┌──────▼──────┐
      │ PostgreSQL │   │    Redis    │
      │ (Database) │   │  (Cache)    │
      └────────────┘   └─────────────┘
```

### Request/Response Flow

```
Client Request
    ↓
[Middleware] → CORS, Validation Pipe
    ↓
[Guards] → JWT Authentication, RBAC, Rate Limiting
    ↓
[Controller] → Route handling, parameter extraction
    ↓
[Service] → Business logic, data processing
    ↓
[Prisma] → Database operations
    ↓
[Response Transformer] → Format response, handle errors
    ↓
Client Response
```

---

## Tech Stack

### Frontend

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| **Framework** | Next.js | 16.1.1 | React meta-framework with SSR/SSG |
| **UI Library** | React | 19.2.3 | Component library |
| **Styling** | Tailwind CSS | v4 | Utility-first CSS framework |
| **UI Components** | shadcn/ui | Latest | Pre-built accessible components |
| **State Management** | Zustand | 5.0.9 | Lightweight state library |
| **Data Fetching** | TanStack Query | 5.90.16 | Server state management |
| **HTTP Client** | Axios | 1.13.2 | Promise-based HTTP client |
| **Forms** | React Hook Form | 7.69.0 | Performant form library |
| **Validation** | Zod | 4.3.4 | TypeScript-first schema validation |
| **i18n** | next-intl | 4.7.0 | Internationalization (EN/ES) |
| **Testing** | Vitest | 4.0.16 | Unit/integration test runner |
| **Test Utils** | Testing Library | Latest | React component testing |

### Backend

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| **Framework** | NestJS | 11.0.1 | Enterprise Node.js framework |
| **Language** | TypeScript | 5.7.3 | Type-safe JavaScript |
| **Database** | PostgreSQL | 15+ | Relational database |
| **ORM** | Prisma | 5.22.0 | Type-safe database client |
| **Validation** | Zod + nestjs-zod | Latest | Schema validation |
| **Authentication** | Passport + JWT | Latest | Auth strategy |
| **Caching** | Redis + ioredis | Latest | In-memory data store |
| **Cache Manager** | cache-manager | 7.2.7 | Cache abstraction layer |
| **Email** | Nodemailer | 7.0.12 | Email sending |
| **Storage** | AWS SDK S3 | 3.958.0 | S3/R2 compatible storage |
| **Documentation** | Swagger/OpenAPI | Latest | API documentation |
| **Rate Limiting** | @nestjs/throttler | 6.5.0 | Request throttling |
| **Testing** | Jest | 30.0.0 | Unit/E2E testing |

---

## Project Structure

### Full Directory Tree

```
project-template/
│
├── frontend/                          # Next.js Application
│   ├── src/
│   │   ├── app/                       # Next.js App Router
│   │   │   ├── layout.tsx             # Root layout
│   │   │   ├── providers.tsx          # Global providers (Query, Zustand, etc)
│   │   │   ├── [locale]/              # i18n routes
│   │   │   │   ├── layout.tsx         # Locale layout
│   │   │   │   ├── loading.tsx        # Global loading state
│   │   │   │   ├── error.tsx          # Error boundary
│   │   │   │   ├── not-found.tsx      # 404 page
│   │   │   │   ├── (marketing)/       # Public pages (SSR)
│   │   │   │   │   ├── layout.tsx
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── (auth)/            # Auth pages
│   │   │   │   │   ├── login/
│   │   │   │   │   └── register/
│   │   │   │   └── (tool)/            # Protected app (CSR)
│   │   │   │       ├── layout.tsx
│   │   │   │       └── dashboard/
│   │   │
│   │   ├── features/                  # Feature modules
│   │   │   └── auth/
│   │   │       ├── types/             # Auth types
│   │   │       ├── stores/            # Zustand auth store
│   │   │       ├── services/          # API calls
│   │   │       ├── hooks/             # Auth hooks
│   │   │       └── index.ts           # Public API
│   │   │
│   │   ├── shared/                    # Shared across features
│   │   │   ├── components/            # Reusable components
│   │   │   │   └── ui/                # shadcn/ui components
│   │   │   ├── hooks/                 # Reusable hooks
│   │   │   ├── lib/                   # Utilities
│   │   │   │   ├── api.ts             # Axios instance
│   │   │   │   ├── query.ts           # TanStack Query setup
│   │   │   │   ├── utils.ts           # Helper functions
│   │   │   │   └── zod.ts             # Zod helpers
│   │   │   ├── config/                # Configuration
│   │   │   └── test/                  # Test utilities
│   │   │
│   │   ├── i18n/                      # Internationalization
│   │   │   ├── request.ts             # i18n request handler
│   │   │   ├── routing.ts             # i18n routing
│   │   │   └── navigation.ts          # i18n navigation
│   │   │
│   │   └── messages/                  # Translation files
│   │       ├── en.json
│   │       └── es.json
│   │
│   ├── next.config.ts                 # Next.js configuration
│   ├── tsconfig.json                  # TypeScript config
│   ├── tailwind.config.ts             # Tailwind config
│   ├── package.json
│   └── node_modules/
│
├── backend/                           # NestJS Application
│   ├── src/
│   │   ├── core/                      # Core infrastructure
│   │   │   ├── config/                # Environment configuration
│   │   │   │   ├── config.module.ts
│   │   │   │   ├── config.namespaces.ts
│   │   │   │   └── env.schema.ts      # Zod environment schema
│   │   │   ├── database/              # Prisma integration
│   │   │   │   ├── database.module.ts
│   │   │   │   └── prisma.service.ts
│   │   │   ├── cache/                 # Redis caching
│   │   │   │   ├── cache.module.ts
│   │   │   │   └── index.ts
│   │   │   ├── filters/               # Exception handling
│   │   │   │   ├── all-exceptions.filter.ts
│   │   │   │   └── index.ts
│   │   │   ├── interceptors/          # Response transformation
│   │   │   │   ├── transform.interceptor.ts
│   │   │   │   └── index.ts
│   │   │   └── throttler/             # Rate limiting
│   │   │       ├── throttler.module.ts
│   │   │       └── index.ts
│   │   │
│   │   ├── common/                    # Shared utilities
│   │   │   ├── decorators/            # Custom decorators
│   │   │   │   ├── current-user.decorator.ts
│   │   │   │   ├── public.decorator.ts
│   │   │   │   └── roles.decorator.ts
│   │   │   ├── dto/                   # Base DTOs
│   │   │   │   └── pagination.dto.ts
│   │   │   ├── utils/                 # Utility functions
│   │   │   │   ├── async.utils.ts
│   │   │   │   ├── date.utils.ts
│   │   │   │   └── string.utils.ts
│   │   │   └── index.ts               # Public exports
│   │   │
│   │   ├── shared/                    # Cross-cutting services
│   │   │   ├── mail/                  # Email service
│   │   │   │   ├── mail.module.ts
│   │   │   │   ├── mail.service.ts
│   │   │   │   └── index.ts
│   │   │   └── storage/               # S3/R2 storage
│   │   │       ├── storage.module.ts
│   │   │       ├── storage.service.ts
│   │   │       └── index.ts
│   │   │
│   │   ├── modules/                   # Feature modules
│   │   │   ├── auth/
│   │   │   │   ├── auth.module.ts
│   │   │   │   ├── auth.controller.ts
│   │   │   │   ├── auth.service.ts
│   │   │   │   ├── guards/            # Auth guards
│   │   │   │   │   ├── jwt-auth.guard.ts
│   │   │   │   │   └── roles.guard.ts
│   │   │   │   ├── strategies/        # Passport strategies
│   │   │   │   │   └── jwt.strategy.ts
│   │   │   │   ├── dto/
│   │   │   │   │   └── auth.dto.ts
│   │   │   │   └── index.ts
│   │   │   │
│   │   │   └── users/
│   │   │       ├── users.module.ts
│   │   │       ├── users.controller.ts
│   │   │       ├── users.service.ts
│   │   │       ├── dto/
│   │   │       │   └── user.dto.ts
│   │   │       └── index.ts
│   │   │
│   │   ├── app.module.ts              # Root module
│   │   └── main.ts                    # Bootstrap
│   │
│   ├── prisma/
│   │   ├── schema.prisma              # Database schema
│   │   └── migrations/                # Migration files
│   │
│   ├── test/
│   │   └── app.e2e-spec.ts            # E2E tests
│   │
│   ├── docker-compose.yml             # Local dev services
│   ├── nest-cli.json                  # NestJS CLI config
│   ├── tsconfig.json                  # TypeScript config
│   ├── package.json
│   └── node_modules/
│
├── docs/                              # Documentation
│   ├── PROJECT_GUIDE.md               # This file
│   ├── backend/
│   │   ├── README.md
│   │   ├── architecture.md
│   │   ├── modules.md
│   │   ├── database.md
│   │   ├── authentication.md
│   │   ├── validation.md
│   │   ├── error-handling.md
│   │   ├── services.md
│   │   └── testing.md
│   ├── frontend/
│   │   ├── README.md
│   │   ├── architecture.md
│   │   ├── components.md
│   │   ├── features.md
│   │   ├── api-patterns.md
│   │   ├── state-management.md
│   │   ├── forms.md
│   │   ├── i18n.md
│   │   ├── styling.md
│   │   └── testing.md
│   ├── plans/                        # Implementation plans
│   ├── references/                   # Reference material
│   └── sop/                          # Standard Operating Procedures
│
├── .claude/
│   └── settings.json                  # Claude Code configuration
│
├── .github/
│   └── workflows/                     # CI/CD pipelines
│
├── .git/                              # Git repository
├── README.md                          # Project README
└── .gitignore
```

---

## Development Workflows

### 1. Adding a New Feature Module (Backend)

**Steps**:

1. **Create module structure**:
   ```bash
   mkdir -p src/modules/your-feature
   cd src/modules/your-feature
   ```

2. **Create files** (following the pattern):
   ```
   your-feature/
   ├── your-feature.module.ts
   ├── your-feature.controller.ts
   ├── your-feature.service.ts
   ├── dto/
   │   ├── create-your-feature.dto.ts
   │   ├── update-your-feature.dto.ts
   │   └── index.ts
   └── index.ts
   ```

3. **Define DTOs** with Zod schemas:
   ```typescript
   import { z } from 'zod';
   import { createZodDto } from 'nestjs-zod/dto';

   export const CreateYourFeatureSchema = z.object({
     name: z.string().min(1).max(255),
     description: z.string().optional(),
   });

   export class CreateYourFeatureDto extends createZodDto(CreateYourFeatureSchema) {}
   ```

4. **Create service** with business logic:
   ```typescript
   @Injectable()
   export class YourFeatureService {
     constructor(private prisma: PrismaService) {}

     async create(dto: CreateYourFeatureDto) {
       return this.prisma.yourFeature.create({ data: dto });
     }
   }
   ```

5. **Create controller** with routes:
   ```typescript
   @Controller('your-features')
   @UseGuards(JwtAuthGuard)
   export class YourFeatureController {
     constructor(private service: YourFeatureService) {}

     @Post()
     create(@Body() dto: CreateYourFeatureDto) {
       return this.service.create(dto);
     }
   }
   ```

6. **Register module** in `app.module.ts`:
   ```typescript
   import { YourFeatureModule } from './modules/your-feature';

   @Module({
     imports: [YourFeatureModule, /* ... */],
   })
   export class AppModule {}
   ```

### 2. Adding API Endpoints (Frontend)

**Steps**:

1. **Define types** in `features/your-feature/types/`:
   ```typescript
   export interface YourFeature {
     id: string;
     name: string;
     createdAt: Date;
   }

   export interface CreateYourFeatureRequest {
     name: string;
     description?: string;
   }
   ```

2. **Create service** in `features/your-feature/services/`:
   ```typescript
   import { apiClient } from '@/shared/lib/api';
   import type { YourFeature, CreateYourFeatureRequest } from '../types';

   const ENDPOINTS = {
     list: '/your-features',
     create: '/your-features',
     update: (id: string) => `/your-features/${id}`,
     delete: (id: string) => `/your-features/${id}`,
   };

   export const yourFeatureService = {
     async list() {
       return apiClient.get<YourFeature[]>(ENDPOINTS.list);
     },
     async create(data: CreateYourFeatureRequest) {
       return apiClient.post<YourFeature>(ENDPOINTS.create, data);
     },
   };
   ```

3. **Create custom hooks** in `features/your-feature/hooks/`:
   ```typescript
   import { useMutation, useQuery } from '@tanstack/react-query';
   import { yourFeatureService } from '../services';

   export function useYourFeatures() {
     return useQuery({
       queryKey: ['your-features'],
       queryFn: () => yourFeatureService.list(),
     });
   }

   export function useCreateYourFeature() {
     return useMutation({
       mutationFn: yourFeatureService.create,
     });
   }
   ```

4. **Use in components**:
   ```typescript
   export function YourFeatureList() {
     const { data, isLoading } = useYourFeatures();

     if (isLoading) return <Skeleton />;
     return <div>{/* render features */}</div>;
   }
   ```

### 3. Database Schema Changes

**Steps**:

1. **Modify Prisma schema**:
   ```prisma
   model YourEntity {
     id        String   @id @default(uuid())
     name      String
     createdAt DateTime @default(now()) @map("created_at")
     @@map("your_entities")
   }
   ```

2. **Create migration**:
   ```bash
   npx prisma migrate dev --name add_your_entity
   ```

3. **Review and test migration**:
   ```bash
   npx prisma studio  # View database
   npm run test       # Run tests
   ```

4. **Deploy migration** to production:
   ```bash
   npx prisma migrate deploy
   ```

---

## Code Patterns & Conventions

### Backend Patterns

#### 1. Module Structure
```typescript
// Module definition
@Module({
  controllers: [YourFeatureController],
  providers: [YourFeatureService],
  exports: [YourFeatureService], // For other modules
})
export class YourFeatureModule {}
```

#### 2. Service Pattern
```typescript
@Injectable()
export class YourFeatureService {
  constructor(
    private prisma: PrismaService,
    private cache: CacheService,
    private logger: Logger,
  ) {}

  async findAll(pagination: PaginationDto) {
    // Implement business logic
    // Use try-catch for error handling
    // Use cache when appropriate
  }
}
```

#### 3. Controller Pattern
```typescript
@Controller('your-features')
@UseGuards(JwtAuthGuard, RolesGuard)
export class YourFeatureController {
  constructor(private service: YourFeatureService) {}

  @Get()
  @Roles('USER', 'ADMIN')
  findAll(@Query() pagination: PaginationDto) {
    return this.service.findAll(pagination);
  }

  @Post()
  @Roles('ADMIN')
  create(@Body() dto: CreateYourFeatureDto) {
    return this.service.create(dto);
  }
}
```

#### 4. DTO Pattern (with Zod)
```typescript
import { z } from 'zod';
import { createZodDto } from 'nestjs-zod/dto';

const CreateSchema = z.object({
  name: z.string().min(1).max(255),
  email: z.string().email(),
});

export class CreateDto extends createZodDto(CreateSchema) {}
```

### Frontend Patterns

#### 1. Feature Module Structure
```typescript
// features/your-feature/index.ts - Public API
export * from './hooks/useYourFeature';
export * from './stores/your-feature.store';
export type * from './types/your-feature.types';
```

#### 2. Zustand Store Pattern
```typescript
interface YourFeatureState {
  items: Item[];
  isLoading: boolean;
}

interface YourFeatureActions {
  setItems: (items: Item[]) => void;
  setLoading: (isLoading: boolean) => void;
}

type YourFeatureStore = YourFeatureState & YourFeatureActions;

export const useYourFeatureStore = create<YourFeatureStore>()((set) => ({
  items: [],
  isLoading: false,
  setItems: (items) => set({ items }),
  setLoading: (isLoading) => set({ isLoading }),
}));
```

#### 3. React Query Hook Pattern
```typescript
export function useYourFeatures() {
  return useQuery({
    queryKey: ['your-features'],
    queryFn: async () => {
      const response = await yourFeatureService.list();
      return response.data;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useCreateYourFeature() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: yourFeatureService.create,
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ['your-features'] });
    },
  });
}
```

#### 4. Component Pattern
```typescript
'use client'; // Client component marker

import { YourFeatureList } from '@/features/your-feature';

export function YourFeaturePage() {
  const { data, isLoading, error } = useYourFeatures();

  if (error) return <ErrorBoundary error={error} />;
  if (isLoading) return <Skeleton />;

  return <YourFeatureList items={data} />;
}
```

### Naming Conventions

| Item | Convention | Example |
|------|-----------|---------|
| **Files** | `kebab-case` | `user-service.ts`, `login-form.tsx` |
| **Classes** | `PascalCase` | `UserService`, `LoginForm` |
| **Functions** | `camelCase` | `getUserById()`, `handleSubmit()` |
| **Directories** | `kebab-case` | `src/modules/user-management/` |
| **Constants** | `UPPER_SNAKE_CASE` | `DEFAULT_PAGE_SIZE`, `API_TIMEOUT` |
| **Types/Interfaces** | `PascalCase` | `UserDto`, `AuthResponse` |
| **Enums** | `PascalCase` | `UserRole`, `RequestStatus` |
| **Routes** | `kebab-case` | `/api/users`, `/dashboard/settings` |
| **Database tables** | `snake_case` (plural) | `users`, `refresh_tokens` |
| **Database columns** | `snake_case` | `first_name`, `created_at` |

---

## Backend Documentation

### Key Modules

#### 1. Authentication Module
- **Path**: `src/modules/auth/`
- **Responsibility**: Handles user login, registration, and token management
- **Key Files**:
  - `auth.service.ts`: JWT token generation and validation
  - `auth.controller.ts`: Auth endpoints (login, register, refresh)
  - `jwt.strategy.ts`: Passport JWT strategy
  - `jwt-auth.guard.ts`: Route protection

**Workflow**:
1. User sends credentials to `/auth/login`
2. Service validates credentials against database
3. Service generates JWT accessToken and refresh token
4. Client stores tokens (accessToken in memory, refreshToken in httpOnly cookie)
5. Client includes accessToken in Authorization header for protected routes

#### 2. Users Module
- **Path**: `src/modules/users/`
- **Responsibility**: User management, CRUD operations
- **Key Features**:
  - Pagination with sorting
  - Soft deletion
  - Audit tracking (createdBy, updatedBy)

#### 3. Core Infrastructure
- **Database**: Prisma ORM with PostgreSQL
- **Cache**: Redis via cache-manager
- **Configuration**: Environment-based with Zod validation
- **Filters**: Global exception handling
- **Interceptors**: Response transformation
- **Throttler**: Rate limiting per endpoint

### Key Services

#### 1. PrismaService
Extends PrismaClient with lifecycle management and helper methods.

```typescript
// Usage in any service
constructor(private prisma: PrismaService) {}

async getUser(id: string) {
  return this.prisma.user.findUnique({
    where: { id },
  });
}
```

#### 2. MailService
Sends emails via Nodemailer.

```typescript
constructor(private mail: MailService) {}

await this.mail.send({
  to: user.email,
  subject: 'Welcome',
  template: 'welcome', // or html: '<p>...</p>'
  context: { name: user.firstName },
});
```

#### 3. StorageService
Handles S3/R2 compatible file uploads.

```typescript
constructor(private storage: StorageService) {}

// Upload file
const url = await this.storage.upload(buffer, 'path/to/file.txt', {
  ContentType: 'text/plain',
});

// Get presigned URL
const presignedUrl = await this.storage.getPresignedUrl('path/to/file.txt');
```

### Error Handling

Backend uses a global exception filter that transforms NestJS exceptions:

```typescript
// Inside services, throw appropriate NestJS exceptions
throw new BadRequestException('Invalid input');
throw new UnauthorizedException('Invalid credentials');
throw new ForbiddenException('Access denied');
throw new NotFoundException('Resource not found');
throw new ConflictException('Email already exists');
throw new InternalServerErrorException('Database error');
```

**Response Format**:
```json
{
  "statusCode": 400,
  "message": "Invalid input",
  "errors": {
    "email": ["Email is required", "Email must be valid"]
  }
}
```

### Database Schema Overview

**Key Tables**:

1. **users**: User accounts with role-based access
   - Fields: id, email, password, firstName, lastName, role, isActive, etc.
   - Relations: refreshTokens, organization

2. **refresh_tokens**: JWT refresh tokens
   - Fields: id, token, userId, organizationId, expiresAt, revokedAt
   - Purpose: Long-lived tokens for token refresh

3. **organizations**: Multi-tenant support
   - Fields: id, name, slug, createdAt, updatedAt, deletedAt
   - Relations: users, refreshTokens

4. **enums**: Role (USER, ADMIN, SUPER_ADMIN)

---

## Frontend Documentation

### Key Features

#### 1. Authentication Flow
- **Location**: `src/features/auth/`
- **State Management**: Zustand store with localStorage persistence
- **Key Flow**:
  1. User submits credentials at `/login`
  2. Frontend calls `authService.login()`
  3. Backend returns `{ user, accessToken, refreshToken }`
  4. Frontend stores in auth store
  5. Subsequent requests include token in headers

#### 2. i18n (Internationalization)
- **Supported Languages**: English (en), Spanish (es)
- **Library**: next-intl
- **Dynamic Routes**: All routes prefixed with `[locale]`
- **Usage**:
  ```typescript
  import { useTranslations } from 'next-intl';

  export function MyComponent() {
    const t = useTranslations('pages.home');
    return <h1>{t('title')}</h1>;
  }
  ```

#### 3. Form Handling
- **Library**: React Hook Form + Zod
- **Pattern**:
  ```typescript
  const form = useForm<FormData>({
    resolver: zodResolver(FormSchema),
  });

  async function onSubmit(data: FormData) {
    try {
      await apiService.submit(data);
      toast.success('Success');
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  }
  ```

#### 4. Data Fetching
- **Library**: TanStack Query (React Query)
- **Features**:
  - Automatic caching and background refetching
  - Optimistic updates
  - Infinite queries for pagination
  - DevTools for debugging

#### 5. UI Components
- **Source**: shadcn/ui (Radix UI + Tailwind)
- **Customization**: Available in `src/shared/components/ui/`
- **Theming**: Via `next-themes` (dark/light mode)

### Directory-Specific Patterns

#### `src/app/[locale]/`
Next.js App Router with i18n segments.

#### `src/app/[locale]/(marketing)/`
Public routes (SSR for SEO).

#### `src/app/[locale]/(auth)/`
Authentication routes (login, register).

#### `src/app/[locale]/(tool)/`
Protected application routes (CSR with auth guard).

#### `src/features/*/`
Feature modules with clear boundaries:
- `types/`: TypeScript types
- `stores/`: Zustand stores
- `services/`: API service layer
- `hooks/`: Custom React hooks
- `index.ts`: Public API

---

## Database Schema

### Full Schema Documentation

**Organizations Table**
```prisma
model Organization {
  id        String   @id @default(uuid())
  name      String   // Company/org name
  slug      String   @unique // URL-friendly identifier
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  deletedAt DateTime? // For soft delete

  // Relations
  users         User[]
  refreshTokens RefreshToken[]
}
```

**Users Table**
```prisma
model User {
  id             String   @id @default(uuid())
  email          String   @unique // Unique identifier
  password       String   // Bcrypt hashed
  firstName      String?
  lastName       String?
  role           Role     @default(USER) // USER, ADMIN, SUPER_ADMIN
  isActive       Boolean  @default(true) // Account status
  emailVerified  Boolean  @default(false) // Email verification flag

  organizationId String?  // Multi-tenancy support
  organization   Organization? @relation(...)

  // Audit fields
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
  deletedAt      DateTime? // Soft delete
  createdBy      String?   // User ID who created
  updatedBy      String?   // User ID who updated

  // Relations
  refreshTokens  RefreshToken[]

  @@index([email])
  @@index([organizationId])
}
```

**RefreshToken Table**
```prisma
model RefreshToken {
  id             String   @id @default(uuid())
  token          String   @unique // UUID token
  userId         String   // Foreign key to User
  user           User     @relation(...) // Cascade delete

  organizationId String?  // Multi-tenancy support
  organization   Organization?

  expiresAt      DateTime // Token expiration time
  revokedAt      DateTime? // Revocation time (logout)
  createdAt      DateTime @default(now())

  @@index([userId])
  @@index([token])
}
```

### Relationships

```
Organization (1) ──────────────── (many) User
    ↑                                    ↓
    |                                    |
    +─────── (many) RefreshToken ────────+
```

---

## Setup & Configuration

### Environment Variables

#### Backend (`.env`)
```bash
# Application
NODE_ENV=development
PORT=3000
API_PREFIX=api

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/projectdb

# JWT
JWT_SECRET=your-secret-key-min-32-chars-long
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=your-refresh-secret-min-32-chars-long
JWT_REFRESH_EXPIRES_IN=7d

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# Rate Limiting
THROTTLE_TTL=60000      # milliseconds
THROTTLE_LIMIT=100      # requests per TTL

# Storage (S3/R2)
STORAGE_ENDPOINT=https://your-s3-endpoint
STORAGE_BUCKET=your-bucket-name
STORAGE_ACCESS_KEY=your-access-key
STORAGE_SECRET_KEY=your-secret-key
STORAGE_REGION=auto

# Email
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your-email@example.com
SMTP_PASS=your-password
SMTP_FROM=noreply@example.com
```

#### Frontend (`.env.local`)
```bash
NEXT_PUBLIC_API_URL=http://localhost:3000/api
NEXT_PUBLIC_APP_URL=http://localhost:4000
```

### Installation & Development

**Backend**:
```bash
cd backend

# Install dependencies
npm install

# Start PostgreSQL and Redis (Docker)
docker-compose up -d

# Setup database
npx prisma migrate dev

# Start development server
npm run start:dev

# Open Swagger docs
# http://localhost:3000/api/docs
```

**Frontend**:
```bash
cd frontend

# Install dependencies
npm install

# Start dev server
npm run dev

# Open browser
# http://localhost:4000
```

### Docker Deployment

**Backend Production Build**:
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist ./dist
EXPOSE 3000
CMD ["node", "dist/main.js"]
```

**Database Migrations**:
```bash
# In production, run migrations before starting the app
npx prisma migrate deploy
```

---

## Common Tasks & Solutions

### Task: Add Authentication to a New Route

1. Use the `@UseGuards(JwtAuthGuard)` decorator on controller or method
2. Access current user via `@CurrentUser() user: TokenPayload` parameter
3. Optional: Restrict by role using `@Roles('ADMIN')`

### Task: Create a Query with Caching

```typescript
async getCachedData() {
  const cacheKey = 'my-data-key';

  // Try cache first
  const cached = await this.cache.get(cacheKey);
  if (cached) return cached;

  // Fetch if not cached
  const data = await this.prisma.myEntity.findMany();

  // Cache for 5 minutes
  await this.cache.set(cacheKey, data, 300);

  return data;
}
```

### Task: Handle File Uploads

```typescript
async uploadFile(@UploadedFile() file: Express.Multer.File) {
  const buffer = file.buffer;
  const url = await this.storage.upload(
    buffer,
    `uploads/${uuidv4()}.${file.originalname}`,
    { ContentType: file.mimetype }
  );
  return { url };
}
```

### Task: Invalidate React Query Cache After Mutation

```typescript
const { mutate } = useMutation({
  mutationFn: api.updateUser,
  onSuccess: () => {
    queryClient.invalidateQueries({
      queryKey: ['users'],
    });
  },
});
```

---

## Additional Resources

- **Backend Documentation**: See `/docs/backend/`
- **Frontend Documentation**: See `/docs/frontend/`
- **NestJS Docs**: https://docs.nestjs.com
- **Next.js Docs**: https://nextjs.org/docs
- **Prisma Docs**: https://www.prisma.io/docs
- **Zod Docs**: https://zod.dev
- **TanStack Query Docs**: https://tanstack.com/query/latest

---

**Last Updated**: 2026-01-01
**Documentation Version**: 1.0
**Target Audience**: Claude Code, AI Assistants, Developers
