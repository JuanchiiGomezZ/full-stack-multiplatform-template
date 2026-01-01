# Quick Reference Guide

Fast lookup for common code patterns, commands, and configurations.

## Table of Contents

1. [CLI Commands](#cli-commands)
2. [Code Snippets](#code-snippets)
3. [File Templates](#file-templates)
4. [Common Errors & Solutions](#common-errors--solutions)
5. [Environment Variables](#environment-variables)

---

## CLI Commands

### Backend

```bash
# Development
npm run start:dev          # Start with hot-reload
npm run build             # Build for production
npm run start:prod        # Run production build

# Testing
npm run test              # Run all tests
npm run test:watch        # Watch mode
npm run test:cov          # Coverage report
npm run test:e2e          # E2E tests

# Code Quality
npm run lint              # Lint and fix
npm run format            # Format code

# Database
npx prisma migrate dev    # Create migration
npx prisma migrate deploy # Deploy migration
npx prisma studio        # Database GUI
npx prisma generate      # Regenerate Prisma client

# Docker
docker-compose up -d      # Start services
docker-compose down       # Stop services
docker-compose logs       # View logs
```

### Frontend

```bash
# Development
npm run dev               # Start dev server (port 4000)
npm run build            # Build for production
npm run start            # Start production server

# Testing
npm run test             # Run tests (Vitest)
npm run test:ui          # Test UI
npm run test:coverage    # Coverage report

# Code Quality
npm run lint             # Lint code
npm run format           # Format code
npm run format:check     # Check formatting
```

---

## Code Snippets

### Backend: Create DTO

```typescript
import { z } from 'zod';
import { createZodDto } from 'nestjs-zod/dto';

export const CreateSchema = z.object({
  name: z.string().min(1).max(255),
});

export class CreateDto extends createZodDto(CreateSchema) {}
```

### Backend: Create Service

```typescript
@Injectable()
export class MyService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateDto) {
    return this.prisma.entity.create({ data: dto });
  }

  async findAll(pagination: PaginationDto) {
    const { page, limit } = pagination;
    const skip = (page - 1) * limit;
    return this.prisma.entity.findMany({ skip, take: limit });
  }
}
```

### Backend: Create Controller

```typescript
@Controller('items')
@UseGuards(JwtAuthGuard)
export class MyController {
  constructor(private service: MyService) {}

  @Get()
  findAll(@Query() pagination: PaginationDto) {
    return this.service.findAll(pagination);
  }

  @Post()
  @Roles('ADMIN')
  create(@Body() dto: CreateDto) {
    return this.service.create(dto);
  }
}
```

### Backend: Create Module

```typescript
@Module({
  controllers: [MyController],
  providers: [MyService],
  exports: [MyService],
})
export class MyModule {}
```

### Backend: Exception Handling

```typescript
throw new BadRequestException('Invalid input');
throw new UnauthorizedException('Not authenticated');
throw new ForbiddenException('Access denied');
throw new NotFoundException('Not found');
throw new ConflictException('Already exists');
throw new InternalServerErrorException('Server error');
```

### Frontend: API Service

```typescript
const ENDPOINTS = {
  list: '/items',
  create: '/items',
  get: (id: string) => `/items/${id}`,
  update: (id: string) => `/items/${id}`,
  delete: (id: string) => `/items/${id}`,
} as const;

export const itemService = {
  async list() {
    const response = await apiClient.get<Item[]>(ENDPOINTS.list);
    return response.data;
  },
  async create(data: CreateRequest) {
    const response = await apiClient.post<Item>(ENDPOINTS.create, data);
    return response.data;
  },
};
```

### Frontend: React Query Hook

```typescript
export const itemKeys = {
  all: ['items'] as const,
  list: () => [...itemKeys.all, 'list'] as const,
  get: (id: string) => [...itemKeys.all, 'get', id] as const,
};

export function useItems() {
  return useQuery({
    queryKey: itemKeys.list(),
    queryFn: () => itemService.list(),
    staleTime: 1000 * 60 * 5,
  });
}

export function useCreateItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: itemService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: itemKeys.list() });
    },
  });
}
```

### Frontend: Zustand Store

```typescript
interface MyState {
  items: Item[];
  isLoading: boolean;
}

interface MyActions {
  setItems: (items: Item[]) => void;
  setLoading: (isLoading: boolean) => void;
}

export const useMyStore = create<MyState & MyActions>()((set) => ({
  items: [],
  isLoading: false,
  setItems: (items) => set({ items }),
  setLoading: (isLoading) => set({ isLoading }),
}));
```

### Frontend: React Hook Form

```typescript
const schema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
});

export function MyForm() {
  const form = useForm({
    resolver: zodResolver(schema),
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </form>
    </Form>
  );
}
```

### Frontend: Component

```typescript
'use client';

interface MyComponentProps {
  title: string;
  onClick?: () => void;
}

/**
 * MyComponent - Description
 */
export function MyComponent({ title, onClick }: MyComponentProps) {
  return <div onClick={onClick}>{title}</div>;
}
```

---

## File Templates

### Backend Module File Structure

**Step 1: Create directory**
```bash
mkdir -p src/modules/my-feature/dto
touch src/modules/my-feature/{my-feature.module.ts,my-feature.controller.ts,my-feature.service.ts,index.ts}
touch src/modules/my-feature/dto/{create-my-feature.dto.ts,index.ts}
```

**Step 2: Edit files in this order**
1. `dto/create-my-feature.dto.ts` - Validation schema
2. `my-feature.service.ts` - Business logic
3. `my-feature.controller.ts` - HTTP routes
4. `my-feature.module.ts` - Module definition
5. `index.ts` - Public exports
6. `src/app.module.ts` - Register module

### Frontend Feature File Structure

**Step 1: Create directory**
```bash
mkdir -p src/features/my-feature/{types,services,hooks,components}
touch src/features/my-feature/types/my-feature.types.ts
touch src/features/my-feature/services/my-feature.service.ts
touch src/features/my-feature/hooks/useMyFeature.ts
touch src/features/my-feature/index.ts
```

**Step 2: Edit files in this order**
1. `types/my-feature.types.ts` - Type definitions
2. `services/my-feature.service.ts` - API calls
3. `hooks/useMyFeature.ts` - React Query hooks
4. `components/MyFeature*.tsx` - React components
5. `index.ts` - Public exports

---

## Common Errors & Solutions

### Backend

| Error | Cause | Solution |
|-------|-------|----------|
| `Cannot find module` | Missing import | Check import path, run `npm install` |
| `Database connection refused` | PostgreSQL not running | `docker-compose up -d` |
| `Port 3000 already in use` | Process running on port | Change PORT in .env or kill process |
| `JWT verification failed` | Invalid token | Check JWT_SECRET in .env |
| `Validation failed` | DTO validation error | Check Zod schema and input data |
| `Entity not found` | findOne throws error | Verify ID exists in database |

**Quick fix**:
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Reset database
npx prisma migrate reset

# Regenerate Prisma
npx prisma generate
```

### Frontend

| Error | Cause | Solution |
|-------|-------|----------|
| `Cannot find module` | Import path wrong | Check file location, spelling |
| `API 404` | Wrong endpoint | Check NEXT_PUBLIC_API_URL |
| `Hydration mismatch` | Client/server rendering difference | Use `useHasHydrated()` hook |
| `Query data not updated` | Cache not invalidated | Call `queryClient.invalidateQueries()` |
| `Form not submitting` | Validation failed | Check Zod schema errors |

**Quick fix**:
```bash
# Clear Next.js cache
rm -rf .next

# Clear node_modules
rm -rf node_modules && npm install

# Check env variables
cat .env.local
```

---

## Environment Variables

### Backend (.env)

```bash
# Required
NODE_ENV=development
DATABASE_URL=postgresql://user:pass@localhost:5432/db
JWT_SECRET=your-secret-32-chars-minimum
JWT_REFRESH_SECRET=your-refresh-secret-32-chars

# Optional (defaults shown)
PORT=3000
API_PREFIX=api
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
REDIS_HOST=localhost
REDIS_PORT=6379
THROTTLE_TTL=60000
THROTTLE_LIMIT=100
SMTP_HOST=localhost
SMTP_PORT=587
SMTP_FROM=noreply@example.com
```

### Frontend (.env.local)

```bash
# Required
NEXT_PUBLIC_API_URL=http://localhost:3000/api
NEXT_PUBLIC_APP_URL=http://localhost:4000
```

---

## Useful Git Commands

```bash
# Create feature branch
git checkout -b feature/my-feature

# Check what changed
git status
git diff

# Stage and commit
git add .
git commit -m "feat: add my feature"

# Push to remote
git push origin feature/my-feature

# Update from main
git fetch origin
git rebase origin/main

# Clean up after merge
git branch -d feature/my-feature
```

---

## Database Queries

### Common Prisma Patterns

```typescript
// Find many with filter
await prisma.user.findMany({
  where: { role: 'ADMIN', deletedAt: null },
  skip: 10,
  take: 20,
  orderBy: { createdAt: 'desc' },
  select: { id: true, email: true }, // Limit fields
});

// Find one
await prisma.user.findUnique({
  where: { email: user.email },
});

// Create
await prisma.user.create({
  data: { email, password, role: 'USER' },
});

// Update
await prisma.user.update({
  where: { id },
  data: { email, isActive: true },
});

// Soft delete
await prisma.user.update({
  where: { id },
  data: { deletedAt: new Date() },
});

// Delete (hard)
await prisma.user.delete({ where: { id } });

// Count
await prisma.user.count({ where: { role: 'ADMIN' } });
```

---

## API Routes Structure

### Authentication Routes

```
POST   /auth/register      # Register user
POST   /auth/login         # Login user
POST   /auth/logout        # Logout user
POST   /auth/refresh       # Refresh token
GET    /auth/me            # Get current user
```

### Users Routes

```
GET    /users              # List users
GET    /users/:id          # Get user
POST   /users              # Create user (ADMIN)
PATCH  /users/:id          # Update user (ADMIN)
DELETE /users/:id          # Delete user (ADMIN)
```

---

## Useful Extensions

### For VS Code

```json
{
  "recommendations": [
    "ms-vscode.makefile-tools",
    "charliermarsh.ruff",
    "prisma.prisma",
    "esbenp.prettier-vscode",
    "dbaeumer.vscode-eslint",
    "bradlc.vscode-tailwindcss",
    "ngryman.dark-plus-material"
  ]
}
```

---

## Performance Tips

### Backend

```typescript
// Use select to limit fields
const user = await prisma.user.findUnique({
  where: { id },
  select: { id: true, email: true }, // NOT password!
});

// Use include only when needed
const user = await prisma.user.findUnique({
  where: { id },
  include: { posts: { take: 5 } }, // Limit relations
});

// Cache frequently accessed data
const cached = await cache.get('users:all');
if (!cached) {
  const data = await fetchUsers();
  await cache.set('users:all', data, 300); // 5 min
}
```

### Frontend

```typescript
// Set appropriate staleTime
useQuery({
  queryKey: ['users'],
  queryFn: fetchUsers,
  staleTime: 1000 * 60 * 5, // 5 minutes
});

// Use select to transform data
useQuery({
  queryKey: ['user', id],
  queryFn: fetchUser,
  select: (data) => ({
    ...data,
    fullName: `${data.firstName} ${data.lastName}`,
  }),
});

// Implement pagination, not infinite scroll
const [page, setPage] = useState(1);
const { data } = useQuery({
  queryKey: ['users', page],
  queryFn: () => fetchUsers({ page }),
});
```

---

## Testing Quick Start

### Backend Test

```typescript
describe('UserService', () => {
  let service: UserService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        UserService,
        { provide: PrismaService, useValue: { user: { findMany: jest.fn() } } },
      ],
    }).compile();

    service = module.get(UserService);
    prisma = module.get(PrismaService);
  });

  it('should find all users', async () => {
    jest.spyOn(prisma.user, 'findMany').mockResolvedValue([]);
    const result = await service.findAll({});
    expect(result).toBeDefined();
  });
});
```

### Frontend Test

```typescript
describe('MyComponent', () => {
  it('renders correctly', () => {
    render(<MyComponent title="Test" />);
    expect(screen.getByText('Test')).toBeInTheDocument();
  });

  it('calls onClick handler', async () => {
    const onClick = vi.fn();
    render(<MyComponent title="Test" onClick={onClick} />);
    await userEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalled();
  });
});
```

---

## Summary

**Most used commands**:
```bash
npm run start:dev      # Backend
npm run dev            # Frontend
npm run test           # Test
npm run lint           # Lint
git commit -m "feat:..." # Commit
```

**Most used files**:
- Backend: `src/modules/*/` (feature modules)
- Frontend: `src/features/*/` (feature modules)
- Types: `*.types.ts`, DTOs in `/dto`
- Database: `prisma/schema.prisma`

For more details, see [PROJECT_GUIDE.md](./PROJECT_GUIDE.md) or specific documentation files.
