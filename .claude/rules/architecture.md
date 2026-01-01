# Architecture

<!-- AUTO-GENERATED: START -->

## System Overview

This template follows a **monorepo** structure with separate backend and frontend applications that communicate via REST API.

```
┌─────────────────────────────────────────────────────────────┐
│                         CLIENT                              │
│  ┌───────────────────────────────────────────────────────┐ │
│  │  Next.js 16 Frontend (Port 4000)                      │ │
│  │  - React 19 UI                                        │ │
│  │  - Zustand + React Query state                        │ │
│  │  - Axios API client                                   │ │
│  └───────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ HTTP/REST
                            │
┌─────────────────────────────────────────────────────────────┐
│                        BACKEND                              │
│  ┌───────────────────────────────────────────────────────┐ │
│  │  NestJS API (Port 3000)                               │ │
│  │  - JWT Authentication                                 │ │
│  │  - Role-based access control                          │ │
│  │  - Swagger docs                                       │ │
│  └───────────────────────────────────────────────────────┘ │
│                            │                                │
│           ┌────────────────┼────────────────┐               │
│           │                │                │               │
│     ┌─────▼─────┐   ┌─────▼─────┐   ┌─────▼─────┐         │
│     │PostgreSQL │   │   Redis   │   │  AWS S3   │         │
│     │  Prisma   │   │   Cache   │   │  Storage  │         │
│     └───────────┘   └───────────┘   └───────────┘         │
└─────────────────────────────────────────────────────────────┘
```

## Backend Architecture

### Layer Structure

```
┌──────────────────────────────────────────────────────┐
│                  HTTP Layer                          │
│  Controllers (routes, validation, serialization)     │
└──────────────────┬───────────────────────────────────┘
                   │
┌──────────────────▼───────────────────────────────────┐
│               Business Logic Layer                   │
│  Services (business rules, orchestration)            │
└──────────────────┬───────────────────────────────────┘
                   │
┌──────────────────▼───────────────────────────────────┐
│               Data Access Layer                      │
│  Prisma ORM (database operations)                    │
└──────────────────┬───────────────────────────────────┘
                   │
┌──────────────────▼───────────────────────────────────┐
│                   Database                           │
│  PostgreSQL (data persistence)                       │
└──────────────────────────────────────────────────────┘
```

### Directory Structure

```
backend/
├── src/
│   ├── main.ts                    # Application entry point
│   ├── app.module.ts              # Root module
│   │
│   ├── core/                      # Core infrastructure
│   │   ├── database/
│   │   │   └── prisma.service.ts  # Prisma client wrapper
│   │   ├── cache/
│   │   │   └── cache.module.ts    # Redis cache configuration
│   │   ├── config/
│   │   │   ├── config.module.ts   # Environment config
│   │   │   ├── database.config.ts
│   │   │   ├── jwt.config.ts
│   │   │   └── redis.config.ts
│   │   ├── filters/
│   │   │   └── http-exception.filter.ts  # Global error handler
│   │   ├── interceptors/
│   │   │   └── transform.interceptor.ts  # Response transformer
│   │   └── throttler/
│   │       └── throttler.module.ts       # Rate limiting
│   │
│   ├── modules/                   # Feature modules
│   │   ├── auth/                  # Authentication module
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── auth.module.ts
│   │   │   ├── dto/
│   │   │   │   └── auth.dto.ts
│   │   │   ├── strategies/
│   │   │   │   ├── jwt.strategy.ts
│   │   │   │   └── local.strategy.ts
│   │   │   └── guards/
│   │   │       ├── jwt-auth.guard.ts
│   │   │       └── roles.guard.ts
│   │   │
│   │   └── users/                 # Users module
│   │       ├── users.controller.ts
│   │       ├── users.service.ts
│   │       ├── users.module.ts
│   │       └── dto/
│   │           └── user.dto.ts
│   │
│   ├── shared/                    # Shared services
│   │   ├── mail/
│   │   │   ├── mail.service.ts    # Email service
│   │   │   └── mail.module.ts
│   │   └── storage/
│   │       ├── storage.service.ts # S3 file upload
│   │       └── storage.module.ts
│   │
│   └── common/                    # Shared utilities
│       ├── dto/
│       │   └── pagination.dto.ts  # Pagination helpers
│       ├── decorators/
│       │   ├── current-user.decorator.ts
│       │   └── roles.decorator.ts
│       └── utils/
│           └── helpers.ts
│
├── prisma/
│   ├── schema.prisma              # Database schema
│   └── migrations/                # Migration history
│
├── test/                          # E2E tests
│   └── jest-e2e.json
│
├── .env                           # Environment variables
├── .env.example
├── docker-compose.yml             # PostgreSQL + Redis
├── Dockerfile
└── package.json
```

### Module Pattern

Each feature module follows this structure:

```
module-name/
├── module-name.controller.ts      # HTTP routes
├── module-name.service.ts         # Business logic
├── module-name.module.ts          # Module definition
├── dto/                           # Data Transfer Objects
│   ├── create-module.dto.ts
│   └── update-module.dto.ts
├── guards/                        # Route guards (optional)
├── strategies/                    # Auth strategies (optional)
└── module-name.spec.ts            # Tests
```

### Request Flow

```
1. HTTP Request → Controller
   ↓
2. Controller validates DTO (class-validator/zod)
   ↓
3. Guards check authentication & authorization
   ↓
4. Controller calls Service method
   ↓
5. Service executes business logic
   ↓
6. Service calls Prisma for data operations
   ↓
7. Data returned through layers
   ↓
8. Response Interceptor transforms output
   ↓
9. HTTP Response sent to client
```

**Example:** User creation flow

```typescript
// 1. Controller receives request
@Post()
@Roles(Role.ADMIN)
create(@Body() dto: CreateUserDto) {
  return this.usersService.create(dto);
}

// 2. Guards verify JWT and role

// 3. Service handles business logic
async create(dto: CreateUserDto) {
  const hashedPassword = await bcrypt.hash(dto.password, 12);
  return this.prisma.user.create({ data: { ...dto, password: hashedPassword } });
}

// 4. Prisma executes database query

// 5. Result flows back to client
```

## Frontend Architecture

### Directory Structure

```
frontend/
├── src/
│   ├── app/                       # Next.js App Router
│   │   ├── [locale]/              # i18n routing
│   │   │   ├── layout.tsx         # Root layout
│   │   │   ├── page.tsx           # Home page
│   │   │   │
│   │   │   ├── (auth)/            # Auth layout group
│   │   │   │   ├── login/
│   │   │   │   └── register/
│   │   │   │
│   │   │   ├── (marketing)/       # Public pages
│   │   │   │   ├── about/
│   │   │   │   └── pricing/
│   │   │   │
│   │   │   └── (tool)/            # Protected pages
│   │   │       ├── dashboard/
│   │   │       └── settings/
│   │   │
│   │   └── api/                   # API routes (optional)
│   │
│   ├── features/                  # Feature modules
│   │   └── auth/                  # Auth feature
│   │       ├── components/        # Feature-specific components
│   │       │   ├── LoginForm.tsx
│   │       │   └── RegisterForm.tsx
│   │       ├── hooks/             # Feature-specific hooks
│   │       │   └── useAuth.ts
│   │       ├── services/          # API calls
│   │       │   └── auth.service.ts
│   │       ├── stores/            # Zustand stores
│   │       │   └── auth.store.ts
│   │       ├── types/             # TypeScript types
│   │       │   └── auth.types.ts
│   │       ├── utils/             # Helpers
│   │       │   └── auth.utils.ts
│   │       └── index.ts           # Public exports
│   │
│   ├── shared/                    # Shared resources
│   │   ├── components/
│   │   │   ├── ui/                # shadcn/ui components
│   │   │   │   ├── button.tsx
│   │   │   │   ├── dialog.tsx
│   │   │   │   ├── input.tsx
│   │   │   │   └── ...
│   │   │   └── common/            # Shared components
│   │   │       ├── Header.tsx
│   │   │       └── Footer.tsx
│   │   ├── hooks/                 # Shared hooks
│   │   │   └── useMediaQuery.ts
│   │   ├── services/              # Shared API services
│   │   │   └── api.service.ts
│   │   ├── stores/                # Global stores
│   │   │   └── theme.store.ts
│   │   ├── types/                 # Global types
│   │   │   └── common.types.ts
│   │   ├── utils/                 # Helper functions
│   │   │   └── cn.ts
│   │   └── lib/                   # Third-party configs
│   │       └── axios.ts
│   │
│   ├── i18n/                      # Internationalization
│   │   ├── messages/
│   │   │   ├── en.json
│   │   │   └── es.json
│   │   └── request.ts
│   │
│   └── test/                      # Test utilities
│       └── mocks/
│
├── public/                        # Static assets
│   ├── images/
│   └── fonts/
│
├── .env                           # Environment variables
├── .env.example
├── next.config.ts                 # Next.js config
├── tailwind.config.ts             # Tailwind config
├── vitest.config.ts               # Vitest config
└── package.json
```

### Feature Module Pattern

Each feature contains everything related to that feature:

```
feature-name/
├── components/        # UI components
├── hooks/            # Custom hooks
├── services/         # API integration
├── stores/           # State management
├── types/            # TypeScript definitions
├── utils/            # Helper functions
└── index.ts          # Public API
```

**Benefits:**
- Co-location of related code
- Clear boundaries
- Easy to delete/move features
- Avoids circular dependencies

### State Management Strategy

```
┌────────────────────────────────────────────────────┐
│              State Categories                      │
├────────────────────────────────────────────────────┤
│                                                    │
│  Server State (React Query)                        │
│  - User data from API                              │
│  - Lists, collections                              │
│  - Cached API responses                            │
│  - Automatic refetching                            │
│                                                    │
│  Client State (Zustand)                            │
│  - UI state (modals, dropdowns)                    │
│  - Theme preference                                │
│  - User preferences                                │
│  - Auth tokens (persist)                           │
│                                                    │
│  Form State (React Hook Form)                      │
│  - Input values                                    │
│  - Validation errors                               │
│  - Form submission state                           │
│                                                    │
│  URL State (Next.js router)                        │
│  - Current route                                   │
│  - Search params                                   │
│  - Query filters                                   │
│                                                    │
└────────────────────────────────────────────────────┘
```

**Rules:**
1. **Server data** → React Query
2. **Minimal client state** → Zustand
3. **Forms** → React Hook Form
4. **Shareable state** → URL params

### Data Flow

```
User Interaction
      ↓
Component Event Handler
      ↓
┌─────────────────┬──────────────────┐
│                 │                  │
│   Form Submit   │   Button Click   │
│                 │                  │
↓                 ↓                  ↓
React Hook Form   Zustand Store      React Query Mutation
      ↓                 ↓                  ↓
Validation        Update State       API Service Call
      ↓                 ↓                  ↓
Service Call      Re-render          Backend API
      ↓                                    ↓
Backend API                           Update Cache
      ↓                                    ↓
Update Cache                          Re-render
      ↓
UI Update
```

## Database Schema

See `backend/prisma/schema.prisma` for complete schema.

### Entity Relationship Diagram

```
┌─────────────────┐
│  Organization   │
│  ─────────────  │
│  id (PK)        │
│  name           │
│  slug (unique)  │
│  createdAt      │
│  updatedAt      │
│  deletedAt      │
└────────┬────────┘
         │ 1:N
         │
┌────────▼────────┐         ┌─────────────────┐
│      User       │  1:N    │  RefreshToken   │
│  ──────────────│◄────────┤  ──────────────  │
│  id (PK)        │         │  id (PK)        │
│  email (unique) │         │  token (unique) │
│  password       │         │  userId (FK)    │
│  firstName      │         │  organizationId │
│  lastName       │         │  expiresAt      │
│  role           │         │  createdAt      │
│  isActive       │         │  revokedAt      │
│  emailVerified  │         └─────────────────┘
│  organizationId │
│  createdAt      │
│  updatedAt      │
│  deletedAt      │
│  createdBy      │
│  updatedBy      │
└─────────────────┘
```

### Key Patterns

**Soft Delete:**
- All models have `deletedAt` field
- Queries filter `deletedAt: null`
- Preserves data for audit trail

**Audit Trail:**
- `createdAt`, `updatedAt` tracked automatically
- `createdBy`, `updatedBy` for user tracking
- Helps with compliance and debugging

**Multi-tenancy:**
- `organizationId` on relevant models
- Enforced at query level
- JWT contains organization context

## Authentication Flow

```
┌──────────┐                                    ┌──────────┐
│  Client  │                                    │  Server  │
└─────┬────┘                                    └─────┬────┘
      │                                               │
      │  POST /auth/login                             │
      │  { email, password }                          │
      ├──────────────────────────────────────────────>│
      │                                               │
      │                                         Verify credentials
      │                                         Generate JWT
      │                                         Create refresh token
      │                                               │
      │  { user, accessToken, refreshToken }          │
      │<──────────────────────────────────────────────┤
      │                                               │
 Store tokens                                         │
      │                                               │
      │  GET /users (with JWT in header)              │
      ├──────────────────────────────────────────────>│
      │                                               │
      │                                         Verify JWT
      │                                         Extract user info
      │                                         Execute request
      │                                               │
      │  { data }                                     │
      │<──────────────────────────────────────────────┤
      │                                               │
   JWT expires                                        │
      │                                               │
      │  POST /auth/refresh                           │
      │  { refreshToken }                             │
      ├──────────────────────────────────────────────>│
      │                                               │
      │                                         Verify refresh token
      │                                         Revoke old token
      │                                         Generate new tokens
      │                                               │
      │  { accessToken, refreshToken }                │
      │<──────────────────────────────────────────────┤
      │                                               │
```

## API Design

### REST Conventions

```
GET    /users           # List all users (paginated)
GET    /users/:id       # Get single user
GET    /users/me        # Get current user
POST   /users           # Create user
PATCH  /users/:id       # Update user
DELETE /users/:id       # Delete user (soft delete)
```

### Response Format

```typescript
// Success (200/201)
{
  "id": "uuid",
  "email": "user@example.com",
  "firstName": "John",
  // ...
}

// List with pagination
{
  "data": [ /* items */ ],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "totalPages": 10
  }
}

// Error (400/401/404/500)
{
  "statusCode": 404,
  "message": "User not found",
  "error": "Not Found"
}
```

## Deployment Architecture

```
┌─────────────────────────────────────────────────────┐
│                  Production                         │
│                                                     │
│  ┌──────────────┐         ┌──────────────┐         │
│  │   Vercel     │         │   Railway    │         │
│  │  (Frontend)  │ ◄─────► │  (Backend)   │         │
│  └──────────────┘         └───────┬──────┘         │
│                                   │                 │
│                    ┌──────────────┼──────────────┐  │
│                    │              │              │  │
│             ┌──────▼────┐  ┌─────▼─────┐  ┌────▼───┐
│             │PostgreSQL │  │   Redis   │  │AWS S3 │
│             └───────────┘  └───────────┘  └────────┘
│                                                     │
└─────────────────────────────────────────────────────┘
```

<!-- AUTO-GENERATED: END -->
