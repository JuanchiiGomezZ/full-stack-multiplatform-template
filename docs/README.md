# Project Documentation Hub

Welcome to the comprehensive documentation for this fullstack template project. This hub contains everything Claude Code and developers need to understand and work with the codebase.

## Quick Navigation

### Getting Started (5 minutes)

1. **New to the project?** Start here: [Project Overview](./PROJECT_GUIDE.md#project-overview)
2. **Setting up locally?** Follow: [Setup & Configuration](./PROJECT_GUIDE.md#setup--configuration)
3. **Starting development?** Read: [Development Workflow](./DEVELOPMENT_WORKFLOW.md)

### Core Documentation

| Document | Purpose |
|----------|---------|
| **[PROJECT_GUIDE.md](./PROJECT_GUIDE.md)** | Complete architecture, tech stack, and project structure. The master reference. |
| **[CODE_STANDARDS.md](./CODE_STANDARDS.md)** | Code conventions, patterns, and best practices for consistent development. |
| **[DEVELOPMENT_WORKFLOW.md](./DEVELOPMENT_WORKFLOW.md)** | Step-by-step workflows for features, testing, and deployment. |

### Backend Documentation

All backend-specific guides:

| Document | Focus |
|----------|-------|
| [backend/README.md](./backend/README.md) | Backend overview and quick start |
| [backend/architecture.md](./backend/architecture.md) | NestJS structure and design patterns |
| [backend/modules.md](./backend/modules.md) | Creating new feature modules |
| [backend/database.md](./backend/database.md) | Prisma, schema design, migrations |
| [backend/authentication.md](./backend/authentication.md) | JWT, guards, roles, auth flow |
| [backend/validation.md](./backend/validation.md) | Zod DTOs and validation patterns |
| [backend/error-handling.md](./backend/error-handling.md) | Exception filters and error responses |
| [backend/services.md](./backend/services.md) | Mail, Storage, Cache services |
| [backend/testing.md](./backend/testing.md) | Jest, unit tests, E2E tests |

### Frontend Documentation

All frontend-specific guides:

| Document | Focus |
|----------|-------|
| [frontend/README.md](./frontend/README.md) | Frontend overview and quick start |
| [frontend/architecture.md](./frontend/architecture.md) | Next.js structure and conventions |
| [frontend/components.md](./frontend/components.md) | shadcn/ui, component patterns |
| [frontend/features.md](./frontend/features.md) | Feature modules and organization |
| [frontend/api-patterns.md](./frontend/api-patterns.md) | Axios, TanStack Query patterns |
| [frontend/state-management.md](./frontend/state-management.md) | Zustand stores and patterns |
| [frontend/forms.md](./frontend/forms.md) | React Hook Form + Zod validation |
| [frontend/i18n.md](./frontend/i18n.md) | Internationalization setup |
| [frontend/styling.md](./frontend/styling.md) | Tailwind CSS, theming |
| [frontend/testing.md](./frontend/testing.md) | Vitest, Testing Library |

---

## For Different Roles

### For Claude Code (AI Assistant)

You're reading the right place! To effectively work on this codebase:

1. **Start**: Read [PROJECT_GUIDE.md](./PROJECT_GUIDE.md) (15 min) for overall architecture
2. **Patterns**: Review [CODE_STANDARDS.md](./CODE_STANDARDS.md) (10 min) for coding conventions
3. **Workflow**: Check [DEVELOPMENT_WORKFLOW.md](./DEVELOPMENT_WORKFLOW.md) for specific tasks
4. **Implementation**: Use specific backend/frontend docs when implementing features

**Most useful sections**:
- [Code Patterns & Conventions](./PROJECT_GUIDE.md#code-patterns--conventions)
- [Backend Code Standards](./CODE_STANDARDS.md#backend-code-standards)
- [Frontend Code Standards](./CODE_STANDARDS.md#frontend-code-standards)
- All workflow sections in [DEVELOPMENT_WORKFLOW.md](./DEVELOPMENT_WORKFLOW.md)

### For New Developers

Start with:

1. **[PROJECT_GUIDE.md](./PROJECT_GUIDE.md)** - Understand what you're working with
2. **[DEVELOPMENT_WORKFLOW.md](./DEVELOPMENT_WORKFLOW.md)** - Learn the development process
3. **Specific docs** - Based on what you're building (backend or frontend)

**Key sections**:
- [Tech Stack](./PROJECT_GUIDE.md#tech-stack)
- [Project Structure](./PROJECT_GUIDE.md#project-structure)
- [Environment Setup](./DEVELOPMENT_WORKFLOW.md#environment-setup)

### For Senior Developers/Architects

Deep dives into:

- [Backend Architecture](./backend/architecture.md) - Design decisions
- [Database Schema](./PROJECT_GUIDE.md#database-schema) - Data model and relationships
- [Authentication Flow](./backend/authentication.md) - Security implementation
- [State Management](./frontend/state-management.md) - Client-side architecture

---

## Quick Reference

### Common Tasks

**Backend**:
- [Add new feature module](./DEVELOPMENT_WORKFLOW.md#backend-feature-implementation)
- [Create API endpoint](./backend/modules.md)
- [Add database table](./backend/database.md)
- [Handle errors properly](./backend/error-handling.md)
- [Add validation](./backend/validation.md)
- [Write tests](./backend/testing.md)

**Frontend**:
- [Add new page](./DEVELOPMENT_WORKFLOW.md#frontend-feature-implementation)
- [Create API service](./CODE_STANDARDS.md#service-layer-pattern)
- [Add React Query hook](./frontend/api-patterns.md)
- [Create Zustand store](./CODE_STANDARDS.md#zustand-store-pattern)
- [Build form with validation](./frontend/forms.md)
- [Test components](./frontend/testing.md)

**Database**:
- [Modify schema](./backend/database.md)
- [Create migration](./DEVELOPMENT_WORKFLOW.md#database-changes)
- [Add relationship](./backend/database.md)
- [Seed data](./backend/database.md)

### File Locations

```
docs/
├── README.md                      # This file
├── PROJECT_GUIDE.md               # Master reference (MOST IMPORTANT)
├── CODE_STANDARDS.md              # Code conventions
├── DEVELOPMENT_WORKFLOW.md        # How to develop
│
├── backend/
│   ├── README.md
│   ├── architecture.md
│   ├── modules.md
│   ├── database.md
│   ├── authentication.md
│   ├── validation.md
│   ├── error-handling.md
│   ├── services.md
│   └── testing.md
│
├── frontend/
│   ├── README.md
│   ├── architecture.md
│   ├── components.md
│   ├── features.md
│   ├── api-patterns.md
│   ├── state-management.md
│   ├── forms.md
│   ├── i18n.md
│   ├── styling.md
│   └── testing.md
│
├── plans/                         # Implementation plans
├── references/                    # Reference material
└── sop/                          # Standard operating procedures
```

---

## Key Information at a Glance

### Tech Stack Summary

**Backend**:
- Framework: NestJS 11
- Database: PostgreSQL + Prisma ORM
- Cache: Redis
- Auth: JWT (Passport)
- Validation: Zod

**Frontend**:
- Framework: Next.js 16
- UI: React 19 + Tailwind CSS 4
- State: Zustand
- Data: TanStack Query + Axios
- Forms: React Hook Form + Zod
- i18n: next-intl (EN/ES)

### Default Ports

- Backend API: `http://localhost:3000/api`
- Backend Swagger: `http://localhost:3000/api/docs`
- Frontend: `http://localhost:4000`
- PostgreSQL: `localhost:5432`
- Redis: `localhost:6379`

### Important Conventions

- **Files**: `kebab-case` (e.g., `user-service.ts`)
- **Classes/Types**: `PascalCase` (e.g., `UserService`)
- **Functions/Variables**: `camelCase` (e.g., `getUserById()`)
- **Database Tables**: `snake_case` plural (e.g., `users`)
- **Routes**: `kebab-case` (e.g., `/api/users`)
- **Branches**: `feature/name`, `fix/name`, `docs/name`
- **Commits**: Conventional commits (`feat:`, `fix:`, `docs:`)

### Directory Structure

```
project-template/
├── backend/              # NestJS application
│   ├── src/
│   │   ├── core/        # Infrastructure (config, db, cache)
│   │   ├── common/      # Shared code (decorators, DTOs, utils)
│   │   ├── shared/      # Services (mail, storage)
│   │   └── modules/     # Feature modules (auth, users)
│   ├── prisma/          # Database schema & migrations
│   └── test/            # E2E tests
│
├── frontend/             # Next.js application
│   └── src/
│       ├── app/         # Next.js App Router with i18n
│       ├── features/    # Feature modules (auth, etc)
│       └── shared/      # UI components, hooks, utilities
│
├── docs/                # Documentation (you are here)
└── .claude/            # Claude Code settings
```

---

## Common Patterns

### Backend Pattern

```typescript
// 1. Define DTO with Zod validation
// 2. Create Service (business logic)
// 3. Create Controller (HTTP routes)
// 4. Create Module (NestJS registration)
// 5. Register in app.module.ts
```

### Frontend Pattern

```typescript
// 1. Define Types
// 2. Create Service (API calls)
// 3. Create React Query Hooks
// 4. Create Components
// 5. Use in Pages
```

---

## Development Essentials

### Before Starting

1. **Environment setup**: [DEVELOPMENT_WORKFLOW.md#environment-setup](./DEVELOPMENT_WORKFLOW.md#environment-setup)
2. **Code standards**: Read [CODE_STANDARDS.md](./CODE_STANDARDS.md) (15 min)
3. **Your first feature**: Follow [DEVELOPMENT_WORKFLOW.md](./DEVELOPMENT_WORKFLOW.md)

### Daily Development

```bash
# Start services
cd backend && docker-compose up -d && npm run start:dev

# In another terminal
cd frontend && npm run dev

# Browser
# Backend: http://localhost:3000/api/docs
# Frontend: http://localhost:4000
```

### Testing Before Commit

```bash
# Backend
npm run lint && npm run test

# Frontend
npm run lint && npm run test

# Commit with conventional message
git commit -m "feat: your feature description"
```

---

## Documentation Maintenance

**Last Updated**: 2026-01-01
**Version**: 1.0
**Maintainer**: Development Team

**To Update Documentation**:
1. Make changes to relevant `.md` file
2. Update this README if adding new documents
3. Commit with `docs:` prefix
4. Examples: `docs: update backend guide`, `docs: add new pattern`

---

## Getting Help

### Common Questions

- **How do I add a new API endpoint?** → [Backend Feature Implementation](./DEVELOPMENT_WORKFLOW.md#backend-feature-implementation)
- **How do I create a new page?** → [Frontend Feature Implementation](./DEVELOPMENT_WORKFLOW.md#frontend-feature-implementation)
- **How do I handle errors?** → [Error Handling](./backend/error-handling.md)
- **How do I validate input?** → [Validation](./backend/validation.md)
- **How do I fetch data?** → [API Patterns](./frontend/api-patterns.md)
- **How do I manage state?** → [State Management](./frontend/state-management.md)

### External Resources

- [NestJS Documentation](https://docs.nestjs.com)
- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Zod Documentation](https://zod.dev)
- [TanStack Query Documentation](https://tanstack.com/query/latest)
- [Zustand Documentation](https://github.com/pmndrs/zustand)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

---

## Summary

This documentation is designed to help you:

1. **Understand** - How the project is structured and organized
2. **Learn** - Patterns and conventions used throughout
3. **Develop** - Step-by-step workflows for common tasks
4. **Maintain** - Standards for code quality and consistency
5. **Reference** - Quick lookup for specific information

**Start with [PROJECT_GUIDE.md](./PROJECT_GUIDE.md)** if you're new to the project.

**Ready to contribute?** Follow [DEVELOPMENT_WORKFLOW.md](./DEVELOPMENT_WORKFLOW.md).

Happy coding!
