# Code Standards & Best Practices

Guide for writing consistent, maintainable code across this fullstack project.

## Table of Contents

1. [TypeScript Standards](#typescript-standards)
2. [Backend Code Standards](#backend-code-standards)
3. [Frontend Code Standards](#frontend-code-standards)
4. [File Organization](#file-organization)
5. [Testing Standards](#testing-standards)
6. [Error Handling](#error-handling)
7. [Documentation Standards](#documentation-standards)

---

## TypeScript Standards

### Type Definitions

**Good**: Export types from public API
```typescript
// features/auth/types/auth.types.ts
export interface User {
  id: string;
  email: string;
  role: Role;
}

export type LoginCredentials = {
  email: string;
  password: string;
};
```

**Bad**: Inline types without exporting
```typescript
const loginUser = async (data: { email: string; password: string }) => {};
```

### Interface vs Type

| Use Case | Choice | Reason |
|----------|--------|--------|
| Object shapes | `interface` | Can merge, extends readable |
| Function signatures | `type` | More flexible |
| Simple objects | `type` | Shorter syntax |
| Class contracts | `interface` | Convention |
| Union types | `type` | Only option |

```typescript
// Object shapes
interface UserProfile {
  name: string;
  email: string;
}

// Function signatures
type ApiResponse<T> = {
  data: T;
  error?: string;
};

// Union types
type AuthState = 'idle' | 'loading' | 'authenticated' | 'error';
```

### Generic Types

**Good**:
```typescript
interface ApiResponse<T> {
  data: T;
  total: number;
}

interface PaginatedResult<T> {
  items: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
  };
}
```

**Bad**:
```typescript
interface ApiResponse {
  data: any;
}
```

### Enum Usage

**Good**: String enums for clarity
```typescript
enum UserRole {
  USER = 'USER',
  ADMIN = 'ADMIN',
  SUPER_ADMIN = 'SUPER_ADMIN',
}
```

**Bad**: Numeric enums (confusing)
```typescript
enum UserRole {
  USER = 0,
  ADMIN = 1,
}
```

---

## Backend Code Standards

### NestJS Module Structure

**Standard Module Pattern**:
```typescript
// feature.module.ts
import { Module } from '@nestjs/common';

@Module({
  controllers: [FeatureController],
  providers: [FeatureService],
  exports: [FeatureService], // If used by other modules
})
export class FeatureModule {}
```

### Controller Best Practices

```typescript
@Controller('features')
@UseGuards(JwtAuthGuard)
@ApiTags('Features')
export class FeatureController {
  constructor(private service: FeatureService) {}

  // List with pagination
  @Get()
  @ApiOperation({ summary: 'Get all features' })
  @ApiResponse({ status: 200, description: 'Success' })
  async findAll(
    @Query() pagination: PaginationDto,
    @CurrentUser() user: TokenPayload,
  ) {
    return this.service.findAll(pagination, user.organizationId);
  }

  // Get single
  @Get(':id')
  @ApiParam({ name: 'id', type: String })
  async findOne(
    @Param('id') id: string,
    @CurrentUser() user: TokenPayload,
  ) {
    return this.service.findOne(id, user.organizationId);
  }

  // Create with DTO validation
  @Post()
  @Roles('ADMIN')
  @ApiBody({ type: CreateFeatureDto })
  async create(
    @Body() dto: CreateFeatureDto,
    @CurrentUser() user: TokenPayload,
  ) {
    return this.service.create(dto, user.id);
  }

  // Update
  @Patch(':id')
  @Roles('ADMIN')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateFeatureDto,
    @CurrentUser() user: TokenPayload,
  ) {
    return this.service.update(id, dto, user.id);
  }

  // Delete (soft delete)
  @Delete(':id')
  @Roles('ADMIN')
  async remove(
    @Param('id') id: string,
    @CurrentUser() user: TokenPayload,
  ) {
    return this.service.remove(id, user.id);
  }
}
```

### Service Best Practices

```typescript
@Injectable()
export class FeatureService {
  private readonly logger = new Logger(FeatureService.name);

  constructor(
    private prisma: PrismaService,
    private cache: CacheService,
  ) {}

  async findAll(
    pagination: PaginationDto,
    organizationId: string,
  ) {
    try {
      const { page, limit, sortBy, sortOrder } = pagination;
      const skip = (page - 1) * limit;

      // Use cache when appropriate
      const cacheKey = `features:org:${organizationId}:page:${page}`;
      const cached = await this.cache.get(cacheKey);
      if (cached) return cached;

      const [features, total] = await Promise.all([
        this.prisma.feature.findMany({
          where: {
            organizationId,
            deletedAt: null,
          },
          skip,
          take: limit,
          orderBy: sortBy ? { [sortBy]: sortOrder } : { createdAt: 'desc' },
        }),
        this.prisma.feature.count({
          where: { organizationId, deletedAt: null },
        }),
      ]);

      const result = createPaginatedResult(features, total, page, limit);

      // Cache for 5 minutes
      await this.cache.set(cacheKey, result, 300);

      return result;
    } catch (error) {
      this.logger.error(`Failed to find features: ${error.message}`);
      throw new InternalServerErrorException('Failed to fetch features');
    }
  }

  async findOne(id: string, organizationId: string) {
    const feature = await this.prisma.feature.findUnique({
      where: { id, organizationId, deletedAt: null },
    });

    if (!feature) {
      throw new NotFoundException('Feature not found');
    }

    return feature;
  }

  async create(dto: CreateFeatureDto, userId: string) {
    // Check for duplicates if needed
    const existing = await this.prisma.feature.findUnique({
      where: { slug: dto.slug },
    });

    if (existing) {
      throw new ConflictException('Feature with this slug already exists');
    }

    return this.prisma.feature.create({
      data: {
        ...dto,
        createdBy: userId,
      },
    });
  }

  async update(
    id: string,
    dto: UpdateFeatureDto,
    userId: string,
  ) {
    await this.findOne(id, undefined); // Verify exists

    return this.prisma.feature.update({
      where: { id },
      data: {
        ...dto,
        updatedBy: userId,
      },
    });
  }

  async remove(id: string, userId: string) {
    await this.findOne(id, undefined); // Verify exists

    // Soft delete
    return this.prisma.feature.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        updatedBy: userId,
      },
    });
  }
}
```

### DTO Patterns

```typescript
// feature.dto.ts
import { z } from 'zod';
import { createZodDto } from 'nestjs-zod/dto';

// Validation schemas
const CreateFeatureSchema = z.object({
  name: z.string().min(1).max(255),
  slug: z.string().min(1).max(255).toLowerCase(),
  description: z.string().max(1000).optional(),
  isActive: z.boolean().default(true),
});

const UpdateFeatureSchema = CreateFeatureSchema.partial();

// DTOs for NestJS
export class CreateFeatureDto extends createZodDto(CreateFeatureSchema) {}
export class UpdateFeatureDto extends createZodDto(UpdateFeatureSchema) {}
```

### Error Handling

```typescript
// Throw appropriate NestJS exceptions
throw new BadRequestException('Invalid input'); // 400
throw new UnauthorizedException('Not authenticated'); // 401
throw new ForbiddenException('Access denied'); // 403
throw new NotFoundException('Resource not found'); // 404
throw new ConflictException('Resource already exists'); // 409
throw new InternalServerErrorException('Server error'); // 500

// Custom exception with validation errors
throw new BadRequestException({
  message: 'Validation failed',
  errors: {
    email: ['Must be valid email'],
    password: ['Must be at least 8 characters'],
  },
});
```

---

## Frontend Code Standards

### Component Structure

**Functional Component Pattern**:
```typescript
'use client'; // Mark as client component if needed

import { ReactNode } from 'react';
import { cn } from '@/shared/lib/utils';

interface ComponentProps {
  children: ReactNode;
  className?: string;
  variant?: 'primary' | 'secondary';
}

/**
 * MyComponent - Brief description
 *
 * @param props - Component props
 * @example
 * <MyComponent variant="primary">Content</MyComponent>
 */
export function MyComponent({
  children,
  className,
  variant = 'primary',
}: ComponentProps) {
  return (
    <div
      className={cn(
        'base-styles',
        variant === 'primary' && 'primary-styles',
        className
      )}
    >
      {children}
    </div>
  );
}
```

### Custom Hook Patterns

```typescript
/**
 * useMyHook - Description of what hook does
 *
 * @returns Object with state and methods
 * @example
 * const { data, isLoading } = useMyHook();
 */
export function useMyHook() {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Hook logic
  }, []);

  return { data, isLoading };
}
```

### Service Layer Pattern

```typescript
// services/my-service.ts
import { apiClient } from '@/shared/lib/api';
import type { MyData, CreateRequest } from '../types';

const ENDPOINTS = {
  list: '/my-data',
  create: '/my-data',
  get: (id: string) => `/my-data/${id}`,
  update: (id: string) => `/my-data/${id}`,
  delete: (id: string) => `/my-data/${id}`,
} as const;

/**
 * Service for my-data API endpoints
 */
export const myService = {
  async list(params?: Record<string, any>) {
    const response = await apiClient.get<MyData[]>(ENDPOINTS.list, { params });
    return response.data;
  },

  async get(id: string) {
    const response = await apiClient.get<MyData>(ENDPOINTS.get(id));
    return response.data;
  },

  async create(data: CreateRequest) {
    const response = await apiClient.post<MyData>(ENDPOINTS.create, data);
    return response.data;
  },

  async update(id: string, data: Partial<CreateRequest>) {
    const response = await apiClient.patch<MyData>(ENDPOINTS.update(id), data);
    return response.data;
  },

  async delete(id: string) {
    await apiClient.delete(ENDPOINTS.delete(id));
  },
};
```

### React Query Hook Pattern

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { myService } from '../services';
import type { MyData } from '../types';

// Query keys for invalidation
export const myKeys = {
  all: ['my-data'] as const,
  list: () => [...myKeys.all, 'list'] as const,
  get: (id: string) => [...myKeys.all, 'get', id] as const,
};

/**
 * Fetch all data
 */
export function useMyDataList() {
  return useQuery({
    queryKey: myKeys.list(),
    queryFn: () => myService.list(),
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes (formerly cacheTime)
  });
}

/**
 * Fetch single item
 */
export function useMyData(id: string) {
  return useQuery({
    queryKey: myKeys.get(id),
    queryFn: () => myService.get(id),
    enabled: !!id, // Don't run if id is falsy
  });
}

/**
 * Create new item
 */
export function useCreateMyData() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: myService.create,
    onSuccess: (newData) => {
      // Invalidate list query
      queryClient.invalidateQueries({ queryKey: myKeys.list() });

      // Optionally add to cache
      queryClient.setQueryData(myKeys.get(newData.id), newData);
    },
  });
}

/**
 * Update item
 */
export function useUpdateMyData(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data) => myService.update(id, data),
    onSuccess: (updatedData) => {
      // Update specific item in cache
      queryClient.setQueryData(myKeys.get(id), updatedData);

      // Invalidate list (will refetch)
      queryClient.invalidateQueries({ queryKey: myKeys.list() });
    },
  });
}

/**
 * Delete item
 */
export function useDeleteMyData(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => myService.delete(id),
    onSuccess: () => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: myKeys.get(id) });

      // Refetch list
      queryClient.invalidateQueries({ queryKey: myKeys.list() });
    },
  });
}
```

### Zustand Store Pattern

```typescript
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// State interface
interface MyState {
  items: Item[];
  selectedId: string | null;
  isLoading: boolean;
}

// Actions interface
interface MyActions {
  setItems: (items: Item[]) => void;
  setSelectedId: (id: string | null) => void;
  setLoading: (isLoading: boolean) => void;
  addItem: (item: Item) => void;
  removeItem: (id: string) => void;
  reset: () => void;
}

type MyStore = MyState & MyActions;

const initialState: MyState = {
  items: [],
  selectedId: null,
  isLoading: false,
};

/**
 * Store for my data
 * Persists to localStorage
 */
export const useMyStore = create<MyStore>()(
  persist(
    (set) => ({
      ...initialState,

      setItems: (items) => set({ items }),

      setSelectedId: (selectedId) => set({ selectedId }),

      setLoading: (isLoading) => set({ isLoading }),

      addItem: (item) =>
        set((state) => ({
          items: [...state.items, item],
        })),

      removeItem: (id) =>
        set((state) => ({
          items: state.items.filter((item) => item.id !== id),
        })),

      reset: () => set(initialState),
    }),
    {
      name: 'my-store', // localStorage key
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        // Only persist these fields
        items: state.items,
        selectedId: state.selectedId,
      }),
    }
  )
);
```

### Form Pattern with React Hook Form + Zod

```typescript
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
import { toast } from 'sonner';

// Validation schema
const FormSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'At least 8 characters'),
  name: z.string().min(1, 'Name is required'),
});

type FormData = z.infer<typeof FormSchema>;

interface MyFormProps {
  onSubmit: (data: FormData) => Promise<void>;
  isLoading?: boolean;
}

/**
 * MyForm - Description
 */
export function MyForm({ onSubmit, isLoading = false }: MyFormProps) {
  const form = useForm<FormData>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      email: '',
      password: '',
      name: '',
    },
  });

  async function handleSubmit(data: FormData) {
    try {
      await onSubmit(data);
      toast.success('Success!');
      form.reset();
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input placeholder="you@example.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input placeholder="John Doe" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <Input type="password" placeholder="••••••••" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isLoading} className="w-full">
          {isLoading ? 'Submitting...' : 'Submit'}
        </Button>
      </form>
    </Form>
  );
}
```

---

## File Organization

### Backend File Locations

```
src/
├── modules/feature/
│   ├── feature.module.ts          # Module definition
│   ├── feature.controller.ts      # Endpoints
│   ├── feature.service.ts         # Business logic
│   ├── dto/
│   │   ├── create-feature.dto.ts
│   │   ├── update-feature.dto.ts
│   │   └── index.ts               # Barrel export
│   ├── entities/
│   │   └── feature.entity.ts      # Response shapes
│   └── index.ts                   # Public API
```

### Frontend File Locations

```
src/
├── features/feature/
│   ├── types/
│   │   └── feature.types.ts
│   ├── stores/
│   │   └── feature.store.ts
│   ├── services/
│   │   └── feature.service.ts
│   ├── hooks/
│   │   ├── useFeature.ts
│   │   └── useCreateFeature.ts
│   ├── components/
│   │   ├── FeatureList.tsx
│   │   └── FeatureForm.tsx
│   └── index.ts                   # Public API
```

---

## Testing Standards

### Backend Testing

```typescript
// feature.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { FeatureService } from './feature.service';
import { PrismaService } from '../../core/database/prisma.service';

describe('FeatureService', () => {
  let service: FeatureService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FeatureService,
        {
          provide: PrismaService,
          useValue: {
            feature: {
              findMany: jest.fn(),
              findUnique: jest.fn(),
              create: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<FeatureService>(FeatureService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  describe('findAll', () => {
    it('should return paginated features', async () => {
      const mockFeatures = [{ id: '1', name: 'Feature 1' }];
      jest.spyOn(prisma.feature, 'findMany').mockResolvedValue(mockFeatures);

      const result = await service.findAll(
        { page: 1, limit: 10 },
        'org-1'
      );

      expect(result).toBeDefined();
      expect(prisma.feature.findMany).toHaveBeenCalled();
    });
  });
});
```

### Frontend Testing

```typescript
// MyComponent.test.tsx
import { render, screen } from '@testing-library/react';
import { MyComponent } from './MyComponent';

describe('MyComponent', () => {
  it('renders correctly', () => {
    render(<MyComponent variant="primary">Test</MyComponent>);
    expect(screen.getByText('Test')).toBeInTheDocument();
  });

  it('applies correct classes for variant', () => {
    const { container } = render(
      <MyComponent variant="primary">Test</MyComponent>
    );
    const element = container.firstChild;
    expect(element).toHaveClass('primary-styles');
  });
});
```

---

## Error Handling

### Frontend Error Handling

```typescript
// Consistent error messages
import { getApiErrorMessage } from '@/shared/lib/api';

try {
  await apiService.submit(data);
  toast.success('Operation successful');
} catch (error) {
  const message = getApiErrorMessage(error);
  toast.error(message);
}
```

### Backend Error Handling

```typescript
// Always throw appropriate HTTP exceptions
import {
  BadRequestException,
  UnauthorizedException,
  NotFoundException,
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';

// 400 - Bad input
throw new BadRequestException('Invalid input data');

// 401 - Not authenticated
throw new UnauthorizedException('Please login first');

// 404 - Not found
throw new NotFoundException('Resource not found');

// 409 - Conflict
throw new ConflictException('Email already registered');

// 500 - Server error
throw new InternalServerErrorException('Database error');
```

---

## Documentation Standards

### Code Comments

```typescript
/**
 * ServiceName - Brief description of responsibility
 *
 * Handles business logic for feature X, including:
 * - Creating items
 * - Updating items
 * - Caching results
 */
@Injectable()
export class ServiceName {
  /**
   * Find all items with pagination
   *
   * @param pagination - Page, limit, sorting
   * @param organizationId - Multi-tenant filter
   * @returns Paginated results
   * @throws InternalServerErrorException if database fails
   */
  async findAll(
    pagination: PaginationDto,
    organizationId: string
  ) {
    // Implementation
  }
}
```

### JSDoc Comments (Frontend)

```typescript
/**
 * Component that displays a list of items
 *
 * @param items - Array of items to display
 * @param isLoading - Loading state
 * @param onSelect - Callback when item is selected
 *
 * @example
 * <ItemList
 *   items={items}
 *   isLoading={false}
 *   onSelect={(item) => console.log(item)}
 * />
 */
export function ItemList({
  items,
  isLoading,
  onSelect,
}: ItemListProps) {
  // Implementation
}
```

---

## Summary Checklist

Before submitting code:

- [ ] TypeScript: No `any` types, proper interfaces
- [ ] Naming: Follow camelCase/PascalCase conventions
- [ ] Files: Properly organized in directories
- [ ] Comments: JSDoc for public APIs
- [ ] Error Handling: Appropriate exceptions/try-catch
- [ ] Testing: Unit tests for critical logic
- [ ] Performance: Caching where appropriate
- [ ] Security: No hardcoded secrets, proper auth
- [ ] Accessibility: Components are keyboard/screen reader accessible
- [ ] Mobile: Responsive design, touch-friendly
