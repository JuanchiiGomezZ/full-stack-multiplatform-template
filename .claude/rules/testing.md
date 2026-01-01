# Testing Strategy

<!-- AUTO-GENERATED: START -->

## Overview

- **Backend:** Jest (unit + integration + e2e)
- **Frontend:** Vitest + Testing Library (component + integration)
- **Coverage Goal:** Aim for 80%+ on critical paths
- **Test Location:** Co-located with source files

## Backend Testing (Jest)

### Test File Structure

```
users/
├── users.controller.ts
├── users.controller.spec.ts    # Controller tests
├── users.service.ts
└── users.service.spec.ts        # Service tests
```

### Service Testing Pattern

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { PrismaService } from '../../core/database/prisma.service';

describe('UsersService', () => {
  let service: UsersService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: PrismaService,
          useValue: {
            user: {
              create: jest.fn(),
              findMany: jest.fn(),
              findUnique: jest.fn(),
              update: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should create a user', async () => {
    const dto = {
      email: 'test@example.com',
      password: 'password123',
      firstName: 'Test',
      lastName: 'User',
    };

    const mockUser = {
      id: 'uuid',
      email: dto.email,
      firstName: dto.firstName,
      lastName: dto.lastName,
      role: 'USER',
      isActive: true,
      organizationId: null,
      createdAt: new Date(),
    };

    jest.spyOn(prisma.user, 'create').mockResolvedValue(mockUser as any);

    const result = await service.create(dto);

    expect(result).toEqual(mockUser);
    expect(prisma.user.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        email: dto.email,
        firstName: dto.firstName,
        lastName: dto.lastName,
      }),
      select: expect.any(Object),
    });
  });
});
```

### Controller Testing Pattern

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

describe('UsersController', () => {
  let controller: UsersController;
  let service: UsersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: {
            create: jest.fn(),
            findAll: jest.fn(),
            findOne: jest.fn(),
            update: jest.fn(),
            remove: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    service = module.get<UsersService>(UsersService);
  });

  it('should return paginated users', async () => {
    const mockResult = {
      data: [],
      meta: { page: 1, limit: 10, total: 0, totalPages: 0 },
    };

    jest.spyOn(service, 'findAll').mockResolvedValue(mockResult);

    const result = await controller.findAll({ page: '1', limit: '10' });

    expect(result).toEqual(mockResult);
  });
});
```

### E2E Testing

Location: `backend/test/` directory

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Auth (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('/auth/register (POST)', () => {
    return request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: 'test@example.com',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User',
      })
      .expect(201)
      .expect((res) => {
        expect(res.body).toHaveProperty('user');
        expect(res.body).toHaveProperty('accessToken');
      });
  });
});
```

### Run Backend Tests

```bash
npm run test              # All tests
npm run test:watch        # Watch mode
npm run test:cov          # Coverage
npm run test:e2e          # E2E tests only
```

## Frontend Testing (Vitest)

### Test File Structure

```
features/auth/
├── components/
│   ├── LoginForm.tsx
│   └── LoginForm.test.tsx
├── hooks/
│   ├── useAuth.ts
│   └── useAuth.test.ts
└── services/
    ├── auth.service.ts
    └── auth.service.test.ts
```

### Component Testing Pattern

```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { LoginForm } from './LoginForm';

describe('LoginForm', () => {
  it('renders login form', () => {
    render(<LoginForm />);

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
  });

  it('submits form with valid data', async () => {
    const onSubmit = vi.fn();
    render(<LoginForm onSubmit={onSubmit} />);

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'password123' },
    });

    fireEvent.click(screen.getByRole('button', { name: /login/i }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });
    });
  });

  it('shows validation errors', async () => {
    render(<LoginForm />);

    fireEvent.click(screen.getByRole('button', { name: /login/i }));

    await waitFor(() => {
      expect(screen.getByText(/email is required/i)).toBeInTheDocument();
      expect(screen.getByText(/password is required/i)).toBeInTheDocument();
    });
  });
});
```

### Hook Testing Pattern

```typescript
import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { useAuth } from './useAuth';

describe('useAuth', () => {
  it('should login successfully', async () => {
    const { result } = renderHook(() => useAuth());

    act(() => {
      result.current.login({
        email: 'test@example.com',
        password: 'password123',
      });
    });

    await waitFor(() => {
      expect(result.current.isAuthenticated).toBe(true);
    });
  });
});
```

### Service/API Testing Pattern

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios from 'axios';
import { authService } from './auth.service';

vi.mock('axios');

describe('authService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should call login endpoint', async () => {
    const mockResponse = {
      data: {
        user: { id: '1', email: 'test@example.com' },
        accessToken: 'token',
      },
    };

    vi.mocked(axios.post).mockResolvedValue(mockResponse);

    const result = await authService.login({
      email: 'test@example.com',
      password: 'password123',
    });

    expect(axios.post).toHaveBeenCalledWith('/auth/login', {
      email: 'test@example.com',
      password: 'password123',
    });
    expect(result).toEqual(mockResponse.data);
  });
});
```

### Test Setup File

Location: `frontend/src/test/setup.ts`

```typescript
import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

// Cleanup after each test
afterEach(() => {
  cleanup();
});
```

### Run Frontend Tests

```bash
npm run test              # All tests
npm run test:ui           # Vitest UI
npm run test:coverage     # Coverage report
```

## Testing Best Practices

### General
- **Test behavior, not implementation** - Test what the code does, not how
- **One assertion per test** - When possible, keep tests focused
- **Use descriptive test names** - Clearly state what is being tested
- **Mock external dependencies** - Database, APIs, third-party services

### Backend
- Mock `PrismaService` in unit tests
- Use test database for E2E tests
- Test error handling paths
- Verify authorization guards work
- Test validation logic

### Frontend
- Mock API calls with `vi.mock()`
- Test user interactions (clicks, form submissions)
- Verify loading and error states
- Test accessibility (screen readers)
- Use `data-testid` sparingly - prefer semantic queries

### Example: UI Components

**Good** ✅
```typescript
screen.getByRole('button', { name: /submit/i })
screen.getByLabelText(/email/i)
```

**Bad** ❌
```typescript
screen.getByTestId('submit-button')
screen.getByTestId('email-input')
```

## Coverage Configuration

### Backend (Jest)

Location: `backend/package.json`

```json
{
  "jest": {
    "collectCoverageFrom": [
      "**/*.(t|j)s",
      "!**/*.spec.ts",
      "!**/node_modules/**",
      "!**/dist/**"
    ],
    "coverageDirectory": "../coverage",
    "coverageThreshold": {
      "global": {
        "branches": 70,
        "functions": 70,
        "lines": 70,
        "statements": 70
      }
    }
  }
}
```

### Frontend (Vitest)

Location: `frontend/vitest.config.ts`

```typescript
export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/mockData',
      ],
    },
  },
});
```

## Common Testing Patterns

### Testing with Multi-tenancy

```typescript
// Backend
it('should filter by organization', async () => {
  const orgId = 'org-123';
  jest.spyOn(prisma.user, 'findMany').mockResolvedValue([]);

  await service.findAll({ page: 1, limit: 10 }, orgId);

  expect(prisma.user.findMany).toHaveBeenCalledWith({
    where: expect.objectContaining({
      organizationId: orgId,
    }),
    // ...
  });
});
```

### Testing Protected Routes

```typescript
// Frontend
it('redirects to login when not authenticated', async () => {
  const { result } = renderHook(() => useAuth());

  // Simulate unauthenticated state
  act(() => {
    result.current.logout();
  });

  render(<ProtectedRoute><Dashboard /></ProtectedRoute>);

  await waitFor(() => {
    expect(mockRouter.push).toHaveBeenCalledWith('/login');
  });
});
```

<!-- AUTO-GENERATED: END -->
