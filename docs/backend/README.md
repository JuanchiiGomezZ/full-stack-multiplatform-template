# Backend Documentation

This documentation serves as context for AI coding assistants and developers working on this codebase.

## 📚 Documentation Index

| Document                              | Description                                  |
| ------------------------------------- | -------------------------------------------- |
| [Architecture](./architecture.md)     | Project structure, conventions, organization |
| [Modules](./modules.md)               | Creating new endpoints, module pattern       |
| [Database](./database.md)             | Prisma patterns, migrations, relationships   |
| [Authentication](./authentication.md) | JWT, guards, roles, public routes            |
| [Validation](./validation.md)         | Zod DTOs, validation patterns                |
| [Error Handling](./error-handling.md) | Exception filters, response format           |
| [Services](./services.md)             | Mail, Storage, Cache shared services         |
| [Testing](./testing.md)               | Jest setup, mocking, E2E tests               |

## 🛠️ Tech Stack

- **Framework**: NestJS 11
- **Language**: TypeScript
- **Database**: PostgreSQL + Prisma ORM
- **Validation**: Zod + nestjs-zod
- **Authentication**: JWT (Passport)
- **Caching**: Redis (ioredis)
- **Storage**: S3/R2 compatible
- **Email**: Nodemailer
- **API Docs**: Swagger/OpenAPI
- **Testing**: Jest + Supertest

## 🚀 Quick Start

```bash
# 1. Start Docker services (PostgreSQL + Redis)
cd backend
docker-compose up -d

# 2. Install dependencies
npm install

# 3. Configure environment
cp .env.example .env
# Edit .env with your values

# 4. Run database migrations
npx prisma migrate dev

# 5. Start development server
npm run start:dev
```

Open [http://localhost:3000/api/docs](http://localhost:3000/api/docs) for Swagger documentation.

## 📁 Project Structure Overview

```
backend/
├── prisma/
│   ├── schema.prisma        # Database schema
│   └── migrations/          # Migration files
├── src/
│   ├── core/                # Framework infrastructure
│   │   ├── config/          # Environment configuration
│   │   ├── database/        # Prisma service
│   │   ├── cache/           # Redis cache module
│   │   ├── filters/         # Exception filters
│   │   ├── interceptors/    # Response transformers
│   │   └── throttler/       # Rate limiting
│   ├── common/              # Shared code
│   │   ├── decorators/      # Custom decorators
│   │   ├── dto/             # Base DTOs (pagination)
│   │   └── utils/           # Utility functions
│   ├── shared/              # Shared services
│   │   ├── mail/            # Email service
│   │   └── storage/         # S3/R2 storage
│   ├── modules/             # Feature modules
│   │   ├── auth/            # Authentication
│   │   └── users/           # User management
│   ├── app.module.ts        # Root module
│   └── main.ts              # Application entry
├── test/                    # E2E tests
└── docker-compose.yml       # Local development services
```

## 🔧 Available Scripts

| Command              | Description                  |
| -------------------- | ---------------------------- |
| `npm run start:dev`  | Start with hot-reload        |
| `npm run build`      | Build for production         |
| `npm run start:prod` | Run production build         |
| `npm run lint`       | Lint and fix code            |
| `npm run test`       | Run unit tests               |
| `npm run test:e2e`   | Run E2E tests                |
| `npx prisma studio`  | Open Prisma database browser |
