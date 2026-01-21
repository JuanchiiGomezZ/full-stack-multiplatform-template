# Backend - NestJS API

> **Skills Reference**: For detailed patterns, use these skills:
>
> - [`nestjs-endpoint`](../.claude/skills/nestjs-endpoint/SKILL.md) - Controllers, Services, DTOs, Modules
> - [`prisma-migration`](../.claude/skills/prisma-migration/SKILL.md) - Schema changes, migrations
> - [`jest-backend`](../.claude/skills/jest-backend/SKILL.md) - Unit and E2E testing

### Auto-invoke Skills

When performing these actions, ALWAYS invoke the corresponding skill FIRST:

| Action | Skill |
|--------|-------|
| Creating/modifying endpoints, controllers, services | `nestjs-endpoint` |
| Adding DTOs or validation schemas | `nestjs-endpoint` |
| Creating/modifying Prisma models | `prisma-migration` |
| Running or creating migrations | `prisma-migration` |
| Writing unit tests for services | `jest-backend` |
| Writing controller or E2E tests | `jest-backend` |

---

## CRITICAL RULES - NON-NEGOTIABLE

### Models (Prisma)

- **ALWAYS**: UUIDv4 PKs, `createdAt`/`updatedAt` timestamps, `deletedAt` for soft delete
- **ALWAYS**: `@map("snake_case")` for column names, `@@map("table_name")` for tables
- **ALWAYS**: Add `@@index` for foreign keys and frequently queried fields
- **NEVER**: Auto-increment integer PKs, models without audit fields

### Services

- **ALWAYS**: Inject `PrismaService`, use `select` to control response shape
- **ALWAYS**: Filter `deletedAt: null` in all queries
- **ALWAYS**: Use `Promise.all()` for parallel queries (pagination)
- **NEVER**: Return password fields, skip soft delete filter

### Controllers

- **ALWAYS**: Use `@ApiTags`, `@ApiBearerAuth`, `@ApiOperation` decorators
- **ALWAYS**: Use `ParseUUIDPipe` for ID params, `@Roles()` for protected routes
- **ALWAYS**: Validate with Zod DTOs via `nestjs-zod`
- **NEVER**: Business logic in controllers (delegate to services)

### DTOs (Zod)

- **ALWAYS**: Use `createZodDto` from `nestjs-zod`
- **ALWAYS**: Separate Create/Update DTOs (Update uses `.partial()`)
- **NEVER**: Use class-validator (project uses Zod)

### Multi-tenancy

- **ALWAYS**: Filter by `organizationId` when applicable
- **ALWAYS**: Include `organizationId` in JWT payload
- **NEVER**: Trust client-provided `organizationId`, query across tenants

---

## DECISION TREES

### New Feature

```
Need new data model? → prisma-migration first
Need new endpoint? → nestjs-endpoint
Need tests? → jest-backend
```

### Endpoint Type

```
Public endpoint? → @Public() decorator
Needs auth? → Default (JwtAuthGuard is global)
Needs specific role? → @Roles(Role.ADMIN)
```

### Response Shape

```
Single item? → return entity directly
List with pagination? → createPaginatedResult()
No content? → return void (204)
```

---

## TECH STACK

NestJS 11 | Prisma 5 | PostgreSQL | Redis | JWT + Passport | Zod | Jest

---

## PROJECT STRUCTURE

```
backend/src/
├── core/              # Infrastructure (database, cache, config)
│   ├── database/      # PrismaService
│   ├── cache/         # Redis cache module
│   ├── config/        # Environment config
│   ├── filters/       # Global exception filters
│   └── interceptors/  # Response transformers
├── modules/           # Feature modules
│   ├── auth/          # Authentication (JWT + Passport)
│   └── users/         # User CRUD (canonical example)
├── shared/            # Shared services
│   ├── mail/          # Email service
│   └── storage/       # S3 file upload
└── common/            # Shared utilities
    ├── dto/           # Pagination helpers
    ├── decorators/    # @CurrentUser, @Roles, @Public
    └── utils/         # Helper functions
```

**Canonical examples:**
- Endpoint CRUD: `src/modules/users/`
- Authentication: `src/modules/auth/`

---

## COMMANDS

```bash
# Development
npm run start:dev          # Dev server with watch
npm run build              # Production build

# Database
npx prisma migrate dev --name <name>   # Create migration
npx prisma generate                     # Generate client
npx prisma studio                       # Visual DB browser

# Testing
npm run test               # Run all tests
npm run test:watch         # Watch mode
npm run test:cov           # Coverage report
npm run test:e2e           # E2E tests

# Linting
npm run lint               # ESLint fix
npm run format             # Prettier
```

---

## QA CHECKLIST

- [ ] `npm run lint` passes
- [ ] `npm run test` passes
- [ ] Migrations created if models changed
- [ ] New endpoints have Swagger decorators
- [ ] Soft delete filter applied (`deletedAt: null`)
- [ ] No passwords in response
- [ ] Multi-tenancy respected (organizationId filter)

---

## NAMING CONVENTIONS

| Entity | Pattern | Example |
|--------|---------|---------|
| Controller | `<entity>.controller.ts` | `users.controller.ts` |
| Service | `<entity>.service.ts` | `users.service.ts` |
| Module | `<entity>.module.ts` | `users.module.ts` |
| DTO (create) | `Create<Entity>Dto` | `CreateUserDto` |
| DTO (update) | `Update<Entity>Dto` | `UpdateUserDto` |
| Test | `<entity>.service.spec.ts` | `users.service.spec.ts` |
