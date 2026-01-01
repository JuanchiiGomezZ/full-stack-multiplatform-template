# Testing

## Overview

| Type | Framework        | Location           | Command            |
| ---- | ---------------- | ------------------ | ------------------ |
| Unit | Jest             | `src/**/*.spec.ts` | `npm test`         |
| E2E  | Jest + Supertest | `test/`            | `npm run test:e2e` |

## Configuration

Jest config in `package.json`:

```json
{
  "jest": {
    "moduleFileExtensions": ["js", "json", "ts"],
    "rootDir": "src",
    "testRegex": ".*\\.spec\\.ts$",
    "transform": { "^.+\\.(t|j)s$": "ts-jest" },
    "collectCoverageFrom": ["**/*.(t|j)s"],
    "coverageDirectory": "../coverage",
    "testEnvironment": "node"
  }
}
```

## Unit Testing

### Testing Services

```typescript
// users.service.spec.ts
import { Test, TestingModule } from "@nestjs/testing";
import { UsersService } from "./users.service";
import { PrismaService } from "@/core/database";

describe("UsersService", () => {
  let service: UsersService;
  let prisma: PrismaService;

  // Mock PrismaService
  const mockPrisma = {
    user: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    prisma = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  describe("findOne", () => {
    it("should return a user", async () => {
      const user = { id: "1", email: "test@test.com" };
      mockPrisma.user.findUnique.mockResolvedValue(user);

      const result = await service.findOne("1");

      expect(result).toEqual(user);
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: "1", deletedAt: null },
      });
    });

    it("should throw NotFoundException if user not found", async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(service.findOne("1")).rejects.toThrow("User not found");
    });
  });
});
```

### Testing Controllers

```typescript
// users.controller.spec.ts
import { Test, TestingModule } from "@nestjs/testing";
import { UsersController } from "./users.controller";
import { UsersService } from "./users.service";

describe("UsersController", () => {
  let controller: UsersController;
  let service: UsersService;

  const mockUsersService = {
    findAll: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [{ provide: UsersService, useValue: mockUsersService }],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    service = module.get<UsersService>(UsersService);

    jest.clearAllMocks();
  });

  describe("findAll", () => {
    it("should return paginated users", async () => {
      const result = { data: [], meta: { total: 0, page: 1, limit: 10 } };
      mockUsersService.findAll.mockResolvedValue(result);

      expect(await controller.findAll({ page: "1", limit: "10" })).toBe(result);
    });
  });
});
```

## E2E Testing

### Setup

```typescript
// test/app.e2e-spec.ts
import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication } from "@nestjs/common";
import * as request from "supertest";
import { AppModule } from "../src/app.module";
import { PrismaService } from "../src/core/database";

describe("AppController (e2e)", () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    prisma = app.get<PrismaService>(PrismaService);

    // Apply same config as main.ts
    app.setGlobalPrefix("api");

    await app.init();
  });

  afterAll(async () => {
    await prisma.cleanDatabase();
    await app.close();
  });

  describe("/api/auth/register (POST)", () => {
    it("should register a new user", () => {
      return request(app.getHttpServer())
        .post("/api/auth/register")
        .send({
          email: "test@test.com",
          password: "password123",
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data.accessToken).toBeDefined();
        });
    });

    it("should reject duplicate email", () => {
      return request(app.getHttpServer())
        .post("/api/auth/register")
        .send({
          email: "test@test.com",
          password: "password123",
        })
        .expect(409);
    });
  });
});
```

### Testing Protected Routes

```typescript
describe("Protected routes", () => {
  let accessToken: string;

  beforeAll(async () => {
    // Login first
    const res = await request(app.getHttpServer())
      .post("/api/auth/login")
      .send({ email: "test@test.com", password: "password123" });

    accessToken = res.body.data.accessToken;
  });

  it("should access protected route with token", () => {
    return request(app.getHttpServer())
      .get("/api/users/me")
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(200);
  });

  it("should reject without token", () => {
    return request(app.getHttpServer()).get("/api/users/me").expect(401);
  });
});
```

## Mocking

### Mock Factory

```typescript
// test/mocks/prisma.mock.ts
export const createMockPrisma = () => ({
  user: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
  // Add other models as needed
});
```

### Mock Services

```typescript
// test/mocks/mail.mock.ts
export const createMockMailService = () => ({
  send: jest.fn().mockResolvedValue(undefined),
});
```

## Running Tests

```bash
# Unit tests
npm test

# Unit tests with watch
npm run test:watch

# Unit tests with coverage
npm run test:cov

# E2E tests
npm run test:e2e

# Debug tests
npm run test:debug
```

## Coverage

Generate coverage report:

```bash
npm run test:cov
```

Coverage report generated in `coverage/` directory.
