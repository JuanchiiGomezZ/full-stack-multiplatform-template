# Development Workflow Guide

This guide outlines the standard development workflow for adding features, fixing bugs, and maintaining the codebase.

## Table of Contents

1. [Environment Setup](#environment-setup)
2. [Feature Development Workflow](#feature-development-workflow)
3. [Backend Feature Implementation](#backend-feature-implementation)
4. [Frontend Feature Implementation](#frontend-feature-implementation)
5. [Database Changes](#database-changes)
6. [Testing Workflow](#testing-workflow)
7. [Code Review Checklist](#code-review-checklist)
8. [Deployment Workflow](#deployment-workflow)

---

## Environment Setup

### Initial Setup (First Time)

```bash
# 1. Clone repository
git clone https://github.com/yourorg/project-template.git
cd project-template

# 2. Setup backend
cd backend
npm install
cp .env.example .env
# Edit .env with your values

# 3. Start services
docker-compose up -d  # PostgreSQL + Redis

# 4. Setup database
npx prisma migrate dev
npm run start:dev

# 5. In another terminal, setup frontend
cd ../frontend
npm install
npm run dev

# 6. Verify setup
# Backend: http://localhost:3000/api/docs
# Frontend: http://localhost:4000
```

### Daily Development

```bash
# Start backend services
cd backend
docker-compose up -d
npm run start:dev

# In another terminal, start frontend
cd frontend
npm run dev

# Monitor changes in both terminals
```

### Environment Files

**Backend** (`.env`):
```bash
NODE_ENV=development
PORT=3000
API_PREFIX=api
DATABASE_URL=postgresql://user:password@localhost:5432/projectdb
JWT_SECRET=your-dev-secret-min-32-characters
JWT_REFRESH_SECRET=your-refresh-secret-min-32-chars
REDIS_HOST=localhost
REDIS_PORT=6379
```

**Frontend** (`.env.local`):
```bash
NEXT_PUBLIC_API_URL=http://localhost:3000/api
NEXT_PUBLIC_APP_URL=http://localhost:4000
```

---

## Feature Development Workflow

### 1. Create Feature Branch

```bash
# Update main branch
git checkout main
git pull origin main

# Create feature branch
git checkout -b feature/your-feature-name
# or
git checkout -b fix/bug-description
# or
git checkout -b docs/documentation-update
```

**Branch Naming Convention**:
- `feature/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation
- `refactor/` - Code refactoring
- `test/` - Test improvements
- `chore/` - Dependencies, build config

### 2. Implement Feature

Follow the appropriate workflow:
- **Backend Only**: [Backend Feature Implementation](#backend-feature-implementation)
- **Frontend Only**: [Frontend Feature Implementation](#frontend-feature-implementation)
- **Full Stack**: Do backend first, then frontend

### 3. Test Locally

```bash
# Backend
cd backend
npm run lint
npm run test
npm run test:e2e

# Frontend
cd frontend
npm run lint
npm run test
```

### 4. Commit Changes

```bash
# Stage changes
git add .

# Commit with conventional commit message
git commit -m "feat: add new feature description"
# or
git commit -m "fix: resolve issue with X"
# or
git commit -m "docs: update development guide"

# Conventional commit format: type(scope): message
# Types: feat, fix, docs, style, refactor, test, chore, perf, ci
```

### 5. Push and Create PR

```bash
# Push to remote
git push origin feature/your-feature-name

# Create pull request on GitHub
# - Add descriptive title
# - Add detailed description
# - Link related issues
# - Request reviewers
```

---

## Backend Feature Implementation

### Step 1: Update Database Schema

```bash
cd backend
```

**1a. Modify Prisma Schema**:
```prisma
// prisma/schema.prisma
model YourEntity {
  id        String   @id @default(uuid())
  name      String
  slug      String   @unique
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")
  deletedAt DateTime? @map("deleted_at")

  @@map("your_entities")
}
```

**1b. Create Migration**:
```bash
npx prisma migrate dev --name add_your_entity
```

**1c. Verify Schema**:
```bash
npx prisma studio  # Browse database
```

### Step 2: Create DTOs

```typescript
// src/modules/your-feature/dto/create-your-feature.dto.ts
import { z } from 'zod';
import { createZodDto } from 'nestjs-zod/dto';

export const CreateYourFeatureSchema = z.object({
  name: z.string().min(1).max(255),
  slug: z.string().min(1).max(255).toLowerCase(),
  description: z.string().max(1000).optional(),
});

export const UpdateYourFeatureSchema =
  CreateYourFeatureSchema.partial();

export class CreateYourFeatureDto extends createZodDto(CreateYourFeatureSchema) {}
export class UpdateYourFeatureDto extends createZodDto(UpdateYourFeatureSchema) {}
```

### Step 3: Create Service

```typescript
// src/modules/your-feature/your-feature.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../core/database/prisma.service';
import { CreateYourFeatureDto, UpdateYourFeatureDto } from './dto';
import { createPaginatedResult, PaginationDto } from '../../common/dto';

@Injectable()
export class YourFeatureService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateYourFeatureDto) {
    return this.prisma.yourEntity.create({
      data: dto,
    });
  }

  async findAll(pagination: PaginationDto) {
    const { page, limit, sortBy, sortOrder } = pagination;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.yourEntity.findMany({
        where: { deletedAt: null },
        skip,
        take: limit,
        orderBy: sortBy ? { [sortBy]: sortOrder } : { createdAt: 'desc' },
      }),
      this.prisma.yourEntity.count({ where: { deletedAt: null } }),
    ]);

    return createPaginatedResult(data, total, page, limit);
  }

  async findOne(id: string) {
    const entity = await this.prisma.yourEntity.findUnique({
      where: { id, deletedAt: null },
    });

    if (!entity) {
      throw new NotFoundException('Entity not found');
    }

    return entity;
  }

  async update(id: string, dto: UpdateYourFeatureDto) {
    await this.findOne(id); // Verify exists

    return this.prisma.yourEntity.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string) {
    await this.findOne(id); // Verify exists

    return this.prisma.yourEntity.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
```

### Step 4: Create Controller

```typescript
// src/modules/your-feature/your-feature.controller.ts
import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard, RolesGuard } from '../../modules/auth';
import { Roles, CurrentUser } from '../../common/decorators';
import { YourFeatureService } from './your-feature.service';
import { CreateYourFeatureDto, UpdateYourFeatureDto } from './dto';
import { PaginationDto } from '../../common/dto';

@ApiTags('Your Feature')
@Controller('your-features')
@UseGuards(JwtAuthGuard, RolesGuard)
export class YourFeatureController {
  constructor(private service: YourFeatureService) {}

  @Post()
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Create new entity' })
  @ApiResponse({ status: 201, description: 'Entity created' })
  create(@Body() dto: CreateYourFeatureDto) {
    return this.service.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List all entities' })
  @ApiResponse({ status: 200, description: 'List returned' })
  findAll(@Query() pagination: PaginationDto) {
    return this.service.findAll(pagination);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get entity by ID' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Update entity' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateYourFeatureDto,
  ) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Delete entity' })
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
```

### Step 5: Create Module

```typescript
// src/modules/your-feature/your-feature.module.ts
import { Module } from '@nestjs/common';
import { YourFeatureService } from './your-feature.service';
import { YourFeatureController } from './your-feature.controller';

@Module({
  controllers: [YourFeatureController],
  providers: [YourFeatureService],
  exports: [YourFeatureService],
})
export class YourFeatureModule {}
```

### Step 6: Register Module

```typescript
// src/app.module.ts
import { YourFeatureModule } from './modules/your-feature';

@Module({
  imports: [
    // ... existing imports
    YourFeatureModule,
  ],
})
export class AppModule {}
```

### Step 7: Test Backend

```bash
# Run unit tests
npm run test

# Run E2E tests
npm run test:e2e

# Check API with Swagger
# http://localhost:3000/api/docs
```

---

## Frontend Feature Implementation

### Step 1: Define Types

```typescript
// src/features/your-feature/types/your-feature.types.ts
export interface YourFeature {
  id: string;
  name: string;
  slug: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateYourFeatureRequest {
  name: string;
  slug: string;
  description?: string;
}

export interface UpdateYourFeatureRequest
  extends Partial<CreateYourFeatureRequest> {}
```

### Step 2: Create API Service

```typescript
// src/features/your-feature/services/your-feature.service.ts
import { apiClient, getApiErrorMessage } from '@/shared/lib/api';
import type {
  YourFeature,
  CreateYourFeatureRequest,
  UpdateYourFeatureRequest,
} from '../types';

const ENDPOINTS = {
  list: '/your-features',
  create: '/your-features',
  get: (id: string) => `/your-features/${id}`,
  update: (id: string) => `/your-features/${id}`,
  delete: (id: string) => `/your-features/${id}`,
} as const;

export const yourFeatureService = {
  async list(params?: Record<string, any>) {
    const response = await apiClient.get<YourFeature[]>(
      ENDPOINTS.list,
      { params }
    );
    return response.data;
  },

  async get(id: string) {
    const response = await apiClient.get<YourFeature>(ENDPOINTS.get(id));
    return response.data;
  },

  async create(data: CreateYourFeatureRequest) {
    const response = await apiClient.post<YourFeature>(
      ENDPOINTS.create,
      data
    );
    return response.data;
  },

  async update(id: string, data: UpdateYourFeatureRequest) {
    const response = await apiClient.patch<YourFeature>(
      ENDPOINTS.update(id),
      data
    );
    return response.data;
  },

  async delete(id: string) {
    await apiClient.delete(ENDPOINTS.delete(id));
  },
};
```

### Step 3: Create React Query Hooks

```typescript
// src/features/your-feature/hooks/useYourFeature.ts
import {
  useQuery,
  useMutation,
  useQueryClient,
  UseQueryResult,
  UseMutationResult,
} from '@tanstack/react-query';
import { yourFeatureService } from '../services';
import type {
  YourFeature,
  CreateYourFeatureRequest,
  UpdateYourFeatureRequest,
} from '../types';
import { getApiErrorMessage } from '@/shared/lib/api';
import { toast } from 'sonner';

// Query keys for invalidation
export const yourFeatureKeys = {
  all: ['your-features'] as const,
  list: () => [...yourFeatureKeys.all, 'list'] as const,
  get: (id: string) => [...yourFeatureKeys.all, 'get', id] as const,
};

/**
 * Hook to fetch all features
 */
export function useYourFeatures(): UseQueryResult<YourFeature[], Error> {
  return useQuery({
    queryKey: yourFeatureKeys.list(),
    queryFn: () => yourFeatureService.list(),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Hook to fetch single feature
 */
export function useYourFeature(
  id: string
): UseQueryResult<YourFeature, Error> {
  return useQuery({
    queryKey: yourFeatureKeys.get(id),
    queryFn: () => yourFeatureService.get(id),
    enabled: !!id,
  });
}

/**
 * Hook to create feature
 */
export function useCreateYourFeature(): UseMutationResult<
  YourFeature,
  Error,
  CreateYourFeatureRequest
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: yourFeatureService.create,
    onSuccess: (newData) => {
      toast.success('Feature created successfully');
      queryClient.invalidateQueries({
        queryKey: yourFeatureKeys.list(),
      });
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error));
    },
  });
}

/**
 * Hook to update feature
 */
export function useUpdateYourFeature(
  id: string
): UseMutationResult<YourFeature, Error, UpdateYourFeatureRequest> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data) => yourFeatureService.update(id, data),
    onSuccess: (updatedData) => {
      toast.success('Feature updated successfully');
      queryClient.setQueryData(yourFeatureKeys.get(id), updatedData);
      queryClient.invalidateQueries({
        queryKey: yourFeatureKeys.list(),
      });
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error));
    },
  });
}

/**
 * Hook to delete feature
 */
export function useDeleteYourFeature(
  id: string
): UseMutationResult<void, Error, void> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => yourFeatureService.delete(id),
    onSuccess: () => {
      toast.success('Feature deleted successfully');
      queryClient.removeQueries({
        queryKey: yourFeatureKeys.get(id),
      });
      queryClient.invalidateQueries({
        queryKey: yourFeatureKeys.list(),
      });
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error));
    },
  });
}
```

### Step 4: Create Feature Components

```typescript
// src/features/your-feature/components/YourFeatureList.tsx
'use client';

import { useYourFeatures } from '../hooks/useYourFeature';
import { Skeleton } from '@/shared/components/ui/skeleton';
import { Button } from '@/shared/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/components/ui/table';

/**
 * YourFeatureList - Displays all features in a table
 */
export function YourFeatureList() {
  const { data: features, isLoading, error } = useYourFeatures();

  if (isLoading) return <Skeleton className="h-96" />;

  if (error) {
    return (
      <div className="rounded-md bg-red-50 p-4 text-sm text-red-700">
        Failed to load features
      </div>
    );
  }

  if (!features || features.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No features found
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Slug</TableHead>
          <TableHead>Description</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {features.map((feature) => (
          <TableRow key={feature.id}>
            <TableCell>{feature.name}</TableCell>
            <TableCell>{feature.slug}</TableCell>
            <TableCell>{feature.description}</TableCell>
            <TableCell>
              <Button variant="outline" size="sm">
                Edit
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
```

### Step 5: Create Feature Form

```typescript
// src/features/your-feature/components/YourFeatureForm.tsx
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@/shared/components/ui/form';
import { Input } from '@/shared/components/ui/input';
import { Button } from '@/shared/components/ui/button';
import { useCreateYourFeature } from '../hooks/useYourFeature';

const FormSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  slug: z.string().min(1, 'Slug is required'),
  description: z.string().optional(),
});

type FormData = z.infer<typeof FormSchema>;

/**
 * YourFeatureForm - Form to create/edit features
 */
export function YourFeatureForm() {
  const { mutate, isPending } = useCreateYourFeature();
  const form = useForm<FormData>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      name: '',
      slug: '',
      description: '',
    },
  });

  async function onSubmit(data: FormData) {
    mutate(data, {
      onSuccess: () => {
        form.reset();
      },
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input placeholder="Feature name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="slug"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Slug</FormLabel>
              <FormControl>
                <Input placeholder="feature-slug" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Input placeholder="Optional description" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isPending} className="w-full">
          {isPending ? 'Submitting...' : 'Create Feature'}
        </Button>
      </form>
    </Form>
  );
}
```

### Step 6: Create Page Component

```typescript
// src/app/[locale]/(tool)/your-features/page.tsx
'use client';

import { YourFeatureList } from '@/features/your-feature/components/YourFeatureList';
import { YourFeatureForm } from '@/features/your-feature/components/YourFeatureForm';

/**
 * Your Features Page
 */
export default function YourFeaturesPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Features</h1>
        <p className="text-gray-600">Manage your features</p>
      </div>

      <div className="grid gap-8 grid-cols-1 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <YourFeatureList />
        </div>
        <div>
          <h2 className="text-xl font-semibold mb-4">Create New</h2>
          <YourFeatureForm />
        </div>
      </div>
    </div>
  );
}
```

### Step 7: Test Frontend

```bash
npm run test
npm run lint
npm run dev
# Verify at http://localhost:4000
```

---

## Database Changes

### Workflow for Schema Changes

1. **Modify schema.prisma**
2. **Create migration**: `npx prisma migrate dev --name description`
3. **Review migration**: Check generated migration file
4. **Test locally**: Verify data integrity
5. **Commit**: Include migration files in git
6. **Deploy**: Run `npx prisma migrate deploy` in production

### Example: Adding New Column

```bash
# 1. Modify schema
# Add field to model in prisma/schema.prisma

# 2. Create migration
npx prisma migrate dev --name add_field_to_table

# 3. Review and test
npx prisma studio

# 4. Commit
git add prisma/
git commit -m "feat: add new field to table"
```

---

## Testing Workflow

### Backend Testing

```bash
cd backend

# Unit tests
npm run test

# Watch mode during development
npm run test:watch

# Coverage report
npm run test:cov

# E2E tests
npm run test:e2e
```

### Frontend Testing

```bash
cd frontend

# Unit tests
npm run test

# Watch mode
npm run test -- --watch

# Coverage
npm run test:coverage

# UI mode
npm run test:ui
```

### Manual Testing Checklist

- [ ] Feature works as expected
- [ ] Error handling works correctly
- [ ] Loading states display properly
- [ ] Form validation works
- [ ] API calls succeed
- [ ] Navigation works
- [ ] Responsive design works on mobile
- [ ] Dark/light mode works

---

## Code Review Checklist

Before submitting a PR, verify:

**General**:
- [ ] Code follows naming conventions
- [ ] No hardcoded secrets or credentials
- [ ] No console.log() left in code
- [ ] Commit messages are clear
- [ ] Branch is up to date with main

**Backend**:
- [ ] New DTOs have Zod validation
- [ ] Services handle errors properly
- [ ] Controllers use appropriate decorators
- [ ] No N+1 queries
- [ ] Database queries use `select` to limit fields
- [ ] Unit tests added
- [ ] Swagger comments added

**Frontend**:
- [ ] Components are properly typed
- [ ] Hooks follow naming conventions
- [ ] Services abstract API calls
- [ ] Error handling is consistent
- [ ] Loading states implemented
- [ ] Tests added
- [ ] No `any` types
- [ ] Components are accessible
- [ ] Mobile responsive

**Database**:
- [ ] Migration file created and tested
- [ ] Schema changes documented
- [ ] Indexes added where needed
- [ ] Foreign key constraints maintained

---

## Deployment Workflow

### Pre-Deployment Checklist

```bash
# Backend
cd backend
npm run lint        # Check for style issues
npm run test        # Run all tests
npm run test:e2e    # Run E2E tests
npm run build       # Verify build succeeds

# Frontend
cd frontend
npm run lint        # Check for style issues
npm run test        # Run tests
npm run build       # Verify build succeeds
```

### Deployment Steps

```bash
# 1. Merge to main
git checkout main
git pull origin main

# 2. Backend
cd backend
npx prisma migrate deploy      # Run migrations
npm run build                  # Build for production
# Deploy dist/ folder

# 3. Frontend
cd frontend
npm run build                  # Build for production
# Deploy .next/ folder
```

### Post-Deployment Verification

- [ ] API endpoints respond correctly
- [ ] Frontend loads without errors
- [ ] Authentication works
- [ ] Database queries execute
- [ ] Logs show no errors
- [ ] Performance is acceptable

---

## Troubleshooting

### Backend Issues

```bash
# Database connection issues
docker-compose ps              # Check container status
docker-compose logs postgres   # Check postgres logs

# Prisma issues
npx prisma db push            # Sync schema with database
npx prisma db seed             # Run seed script

# Clear cache
npx prisma generate           # Regenerate Prisma client
```

### Frontend Issues

```bash
# Clear Next.js cache
rm -rf .next
npm run dev

# Clear node_modules
rm -rf node_modules
npm install

# Clear browser cache
# Use DevTools or hard refresh (Ctrl+Shift+R)
```

### Common Errors

| Error | Solution |
|-------|----------|
| `Cannot find module` | Run `npm install`, clear cache |
| `Database connection refused` | Check docker-compose is running |
| `Port already in use` | Kill process or change port in .env |
| `CORS error` | Check API_URL in frontend .env |
| `401 Unauthorized` | Check JWT token, verify auth guard |

---

## Resources

- Backend: See `/docs/backend/`
- Frontend: See `/docs/frontend/`
- NestJS: https://docs.nestjs.com
- Next.js: https://nextjs.org/docs
- Prisma: https://www.prisma.io/docs
