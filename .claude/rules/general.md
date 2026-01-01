# General Guidelines

<!-- AUTO-GENERATED: START -->

## Development Commands

### Backend Commands
```bash
# Development
npm run start:dev          # Start dev server with hot reload
npm run start:debug        # Start with debugger
npm run build              # Build for production
npm run start:prod         # Run production build

# Testing
npm run test               # Run all tests
npm run test:watch         # Watch mode
npm run test:cov           # Coverage report
npm run test:e2e           # End-to-end tests

# Code Quality
npm run lint               # Run ESLint
npm run format             # Format with Prettier

# Database
npx prisma migrate dev     # Create and apply migration
npx prisma migrate deploy  # Deploy migrations (production)
npx prisma studio          # Open Prisma Studio
npx prisma generate        # Generate Prisma Client
```

### Frontend Commands
```bash
# Development
npm run dev                # Start dev server (port 4000)
npm run build              # Build for production
npm run start              # Run production build (port 4000)

# Testing
npm run test               # Run Vitest tests
npm run test:ui            # Open Vitest UI
npm run test:coverage      # Generate coverage report

# Code Quality
npm run lint               # Run ESLint
npm run format             # Format with Prettier
npm run format:check       # Check formatting
```

## Git Workflow

### Branch Naming
- `feature/` - New features
- `fix/` - Bug fixes
- `refactor/` - Code refactoring
- `docs/` - Documentation changes

### Commit Message Format
```
type(scope): brief description

- Detailed changes
- More details
```

**Types:** `feat`, `fix`, `refactor`, `docs`, `test`, `chore`

### Example
```
feat(auth): add refresh token rotation

- Implement token rotation on refresh
- Revoke old tokens automatically
- Add logout-all endpoint
```

## Environment Variables

### Backend (.env)

**Required:**
```bash
DATABASE_URL=postgresql://user:password@localhost:5432/dbname
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-jwt-secret-min-32-chars
```

**Optional:**
```bash
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# AWS S3
AWS_S3_BUCKET=your-bucket-name
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_REGION=us-east-1

# Email (SMTP)
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your-email@example.com
SMTP_PASSWORD=your-password
SMTP_FROM=noreply@example.com

# Rate Limiting
THROTTLE_TTL=60
THROTTLE_LIMIT=10

# Cache
CACHE_TTL=3600
```

### Frontend (.env)

```bash
NEXT_PUBLIC_API_URL=http://localhost:3000
```

**Note:** Only variables prefixed with `NEXT_PUBLIC_` are exposed to the browser.

## Docker Services

### Start Services
```bash
cd backend
docker-compose up -d       # Start PostgreSQL + Redis
docker-compose logs -f     # View logs
docker-compose down        # Stop services
```

### Service Ports
- PostgreSQL: `5432`
- Redis: `6379`

## Common Tasks

### Add a New Backend Module
```bash
cd backend
nest g module modules/your-module
nest g service modules/your-module
nest g controller modules/your-module
```

### Add a New Frontend Feature
```bash
cd frontend/src/features
mkdir your-feature
mkdir your-feature/{components,hooks,services,stores,types,utils}
```

### Generate Prisma Migration
```bash
cd backend
# 1. Edit prisma/schema.prisma
# 2. Create migration
npx prisma migrate dev --name add_your_changes
# 3. Migration file created in prisma/migrations/
```

### Add shadcn/ui Component
```bash
cd frontend
npx shadcn@latest add button
npx shadcn@latest add dialog
# Components added to src/shared/components/ui/
```

## Code Style

### TypeScript
- Use TypeScript strict mode
- Define types/interfaces explicitly
- Avoid `any` - use `unknown` if needed
- Use `const` over `let` where possible

### Naming Conventions
- **Files:** kebab-case (`user.service.ts`, `auth.controller.ts`)
- **Classes:** PascalCase (`UserService`, `AuthController`)
- **Variables/Functions:** camelCase (`createUser`, `findAll`)
- **Constants:** UPPER_SNAKE_CASE (`MAX_RETRIES`, `DEFAULT_LIMIT`)
- **Components:** PascalCase (`LoginForm`, `UserCard`)

### Imports Organization
```typescript
// 1. External libraries
import { Injectable } from '@nestjs/common';
import { PrismaService } from '@prisma/client';

// 2. Internal modules
import { CreateUserDto } from './dto/user.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';

// 3. Types
import type { User } from '@prisma/client';
```

## File Organization

### Backend
- Controllers handle HTTP layer only
- Services contain business logic
- DTOs define request/response shapes
- Keep files under 300 lines
- Extract helpers to `common/utils/`

### Frontend
- Components under 200 lines
- Extract logic to custom hooks
- Keep services pure (API calls only)
- Co-locate feature files
- Shared components in `shared/components/`

## Error Handling

### Backend
```typescript
// Use NestJS exceptions
throw new NotFoundException('User not found');
throw new BadRequestException('Invalid email');
throw new UnauthorizedException('Invalid credentials');
throw new ForbiddenException('Insufficient permissions');
```

### Frontend
```typescript
// Use try-catch with error boundaries
try {
  await api.createUser(data);
} catch (error) {
  if (error.response?.status === 401) {
    // Handle unauthorized
  }
  toast.error(error.message);
}
```

## Performance Best Practices

### Backend
- Use database indexes for frequently queried fields
- Implement pagination for list endpoints
- Cache expensive queries with Redis
- Use `select` in Prisma to fetch only needed fields
- Eager load relations when needed

### Frontend
- Use React Query for server state caching
- Implement virtualization for long lists
- Lazy load routes and components
- Optimize images with Next.js Image component
- Use Zustand for minimal client state only

<!-- AUTO-GENERATED: END -->
