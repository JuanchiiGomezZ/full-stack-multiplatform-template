# Project Template

<!-- AUTO-GENERATED: START -->
**Last updated:** 2026-01-01
**Template version:** 1.0.0

This is a full-stack template for building modern web applications with multi-tenancy support.

## Tech Stack

### Backend
- **Framework:** NestJS 11
- **Database:** PostgreSQL with Prisma ORM
- **Authentication:** JWT + Passport
- **Caching:** Redis + Cache Manager
- **Storage:** AWS S3
- **Email:** Nodemailer
- **API Docs:** Swagger
- **Testing:** Jest

### Frontend
- **Framework:** Next.js 16 (App Router)
- **UI Library:** React 19
- **State Management:** Zustand + React Query
- **Forms:** React Hook Form + Zod validation
- **API Client:** Axios
- **Styling:** Tailwind CSS + Radix UI components
- **Animations:** motion (framer-motion)
- **i18n:** next-intl
- **Testing:** Vitest + Testing Library

## Architecture Overview

**Multi-tenancy Model:** Organization-based (users belong to organizations)

**Monorepo Structure:**
```
project-template/
├── backend/          # NestJS API
├── frontend/         # Next.js application
├── .claude/          # Claude Code configuration & rules
└── docs/             # Project documentation
```

## Key Features

1. **Multi-tenant Authentication** - JWT-based auth with organization context
2. **User Management** - CRUD operations with role-based access control
3. **File Upload** - AWS S3 integration for file storage
4. **Email Notifications** - Nodemailer setup for transactional emails

## Critical Business Rules

**This is a generic template** - designed for reuse across future projects. Focus on technical patterns and structure rather than specific business logic.

**Multi-tenancy:**
- Users can belong to one organization (optional)
- Organization context flows through auth tokens
- All data access respects organization boundaries

**Role System:**
- `USER` - Standard user role
- `ADMIN` - Organization admin
- `SUPER_ADMIN` - System-wide admin

**Soft Delete Pattern:**
- All models use `deletedAt` for soft deletion
- Queries filter `deletedAt: null` by default
- Audit trail preserved via `createdBy`/`updatedBy`

## Project Structure

### Backend Structure
```
backend/src/
├── core/              # Framework configuration
│   ├── database/      # Prisma service
│   ├── cache/         # Redis cache module
│   ├── config/        # Environment config
│   ├── filters/       # Global exception filters
│   ├── interceptors/  # Response transformers
│   └── throttler/     # Rate limiting
├── modules/           # Feature modules
│   ├── auth/          # Authentication (JWT + Passport)
│   └── users/         # User CRUD operations
├── shared/            # Shared services
│   ├── mail/          # Email service
│   └── storage/       # S3 file upload
└── common/            # Shared utilities
    ├── dto/           # Common DTOs (pagination)
    ├── decorators/    # Custom decorators
    └── utils/         # Helper functions
```

See `backend/src/modules/users/` for canonical CRUD example
See `backend/src/modules/auth/` for authentication pattern

### Frontend Structure
```
frontend/src/
├── app/               # Next.js App Router
│   └── [locale]/      # i18n routing
│       ├── (auth)/    # Auth pages
│       ├── (marketing)/ # Public pages
│       └── (tool)/    # Authenticated pages
├── features/          # Feature modules
│   └── auth/          # Auth feature
│       ├── components/
│       ├── hooks/
│       ├── services/
│       ├── stores/
│       ├── types/
│       └── utils/
├── shared/            # Shared resources
│   ├── components/
│   │   ├── ui/        # shadcn/ui components
│   │   └── common/    # Shared components
│   ├── hooks/         # Shared hooks
│   ├── services/      # API services
│   ├── stores/        # Global stores
│   ├── types/         # TypeScript types
│   └── utils/         # Helper functions
└── i18n/              # Internationalization
    └── messages/      # Translation files
```

See `frontend/src/features/auth/` for canonical feature structure

## Development Commands

### Backend
```bash
cd backend
npm run start:dev      # Dev server with watch mode
npm run build          # Production build
npm run test           # Run Jest tests
npm run test:watch     # Watch mode
npm run lint           # ESLint
```

### Frontend
```bash
cd frontend
npm run dev            # Dev server (port 4000)
npm run build          # Production build
npm run test           # Run Vitest tests
npm run test:ui        # Vitest UI
npm run lint           # ESLint
```

## Environment Variables

**Backend** (.env):
```
DATABASE_URL=postgresql://...
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-secret
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
AWS_S3_BUCKET=your-bucket
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
SMTP_HOST=...
SMTP_PORT=587
```

**Frontend** (.env):
```
NEXT_PUBLIC_API_URL=http://localhost:3000
```

## Quick Start

1. **Backend setup:**
   ```bash
   cd backend
   npm install
   cp .env.example .env
   # Edit .env with your values
   npx prisma migrate dev
   npm run start:dev
   ```

2. **Frontend setup:**
   ```bash
   cd frontend
   npm install
   cp .env.example .env
   # Edit .env with your values
   npm run dev
   ```

3. **Optional - Docker services:**
   ```bash
   cd backend
   docker-compose up -d  # Starts PostgreSQL + Redis
   ```

## Testing Strategy

- **Backend:** Jest for unit/integration tests
- **Frontend:** Vitest + Testing Library for component tests
- Test files located next to source files (`.spec.ts`, `.test.tsx`)
- See `.claude/rules/testing.md` for detailed patterns

## Documentation Structure

Additional documentation in `.claude/rules/`:
- `general.md` - Commands, git workflow, env vars
- `testing.md` - Testing patterns and examples
- `architecture.md` - Detailed architecture map
- `backend/` - Backend-specific patterns
- `frontend/` - Frontend-specific patterns
- `sop/` - Step-by-step procedures

<!-- AUTO-GENERATED: END -->

<!-- MANUAL-EDIT -->
## Custom Notes

Add your project-specific notes here. This section is preserved during documentation regeneration.

<!-- /MANUAL-EDIT -->
