# Backend Template

Production-ready NestJS backend template with PostgreSQL, Prisma, and Redis.

## Tech Stack

- **NestJS** - Progressive Node.js framework
- **Prisma** - Type-safe ORM
- **PostgreSQL** - Database
- **Redis** - Caching & rate limiting
- **Zod** - Schema validation
- **JWT** - Authentication
- **Swagger** - API documentation

## Quick Start

```bash
# Start PostgreSQL and Redis
docker-compose up -d

# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev

# Start development server
npm run dev
```

API docs: http://localhost:3000/api/docs

## Project Structure

```
src/
├── common/           # Shared decorators, DTOs, utilities
├── core/             # Core modules (config, database, cache, throttler)
├── modules/          # Feature modules (auth, users)
├── shared/           # Shared services (mail, storage)
└── main.ts
```

## Environment Variables

Copy `.env.example` to `.env` and configure:

| Variable             | Description                       |
| -------------------- | --------------------------------- |
| `DATABASE_URL`       | PostgreSQL connection string      |
| `JWT_SECRET`         | JWT signing secret (min 32 chars) |
| `JWT_REFRESH_SECRET` | Refresh token secret              |
| `REDIS_HOST`         | Redis host                        |
| `REDIS_PORT`         | Redis port                        |

## Available Scripts

| Command              | Description              |
| -------------------- | ------------------------ |
| `npm run start:dev`  | Start development server |
| `npm run build`      | Build for production     |
| `npm run start:prod` | Start production server  |
| `npm run test`       | Run unit tests           |
| `npm run lint`       | Run ESLint               |

## Features

- ✅ JWT Authentication (access + refresh tokens)
- ✅ Role-based access control (RBAC)
- ✅ Multi-tenancy ready (Organization model)
- ✅ Soft delete & audit fields
- ✅ Redis caching
- ✅ Rate limiting
- ✅ S3/R2 file storage
- ✅ Email service (Nodemailer)
- ✅ Swagger documentation
- ✅ Docker & Docker Compose
- ✅ GitHub Actions CI
