# Project Template

A scalable, well-documented full-stack template for rapid SaaS development with best practices, clear patterns, and comprehensive AI-friendly documentation.

## 📚 Documentation (Start Here!)

**Complete documentation for Claude Code and developers:**

- **[📖 Documentation Hub](./docs/README.md)** - Central hub for all documentation
- **[🎯 PROJECT_GUIDE.md](./docs/PROJECT_GUIDE.md)** - Master reference (architecture, tech stack, patterns)
- **[⚙️ CODE_STANDARDS.md](./docs/CODE_STANDARDS.md)** - Code conventions and best practices
- **[🔄 DEVELOPMENT_WORKFLOW.md](./docs/DEVELOPMENT_WORKFLOW.md)** - Step-by-step workflows
- **[⚡ QUICK_REFERENCE.md](./docs/QUICK_REFERENCE.md)** - Fast lookup and cheat sheets

**Specific guides:**
- [Backend Documentation](./docs/backend/README.md)
- [Frontend Documentation](./docs/frontend/README.md)

## 📁 Project Structure

```
project-template/
├── backend/            # NestJS application
│   ├── src/
│   │   ├── core/      # Infrastructure (config, DB, cache)
│   │   ├── common/    # Shared utilities (decorators, DTOs)
│   │   ├── shared/    # Services (mail, storage)
│   │   └── modules/   # Feature modules (auth, users)
│   └── prisma/        # Database schema & migrations
│
├── frontend/          # Next.js 16 application
│   └── src/
│       ├── app/       # Next.js App Router
│       ├── features/  # Feature modules (auth, etc)
│       └── shared/    # UI components, hooks, utils
│
├── docs/              # Complete documentation
│   ├── README.md                    # Documentation hub
│   ├── PROJECT_GUIDE.md             # Master reference
│   ├── CODE_STANDARDS.md            # Code patterns
│   ├── DEVELOPMENT_WORKFLOW.md      # How to develop
│   ├── QUICK_REFERENCE.md           # Cheat sheets
│   ├── backend/                     # Backend docs
│   └── frontend/                    # Frontend docs
│
└── .claude/           # Claude Code configuration
```

## 🚀 Quick Start

### First Time Setup

```bash
# Clone and setup backend
git clone https://github.com/yourorg/project-template.git
cd project-template/backend
npm install
cp .env.example .env

# Start services
docker-compose up -d

# Setup database
npx prisma migrate dev
npm run start:dev

# In another terminal, setup frontend
cd ../frontend
npm install
npm run dev
```

**Access**:
- Backend API: http://localhost:3000/api
- Swagger Docs: http://localhost:3000/api/docs
- Frontend: http://localhost:4000

### Daily Development

```bash
# Start backend
cd backend && docker-compose up -d && npm run start:dev

# In another terminal, start frontend
cd frontend && npm run dev
```

## 🛠️ Tech Stack

### Backend
- **Framework**: NestJS 11
- **Language**: TypeScript
- **Database**: PostgreSQL + Prisma ORM
- **Caching**: Redis
- **Auth**: JWT (Passport)
- **Validation**: Zod
- **API Docs**: Swagger/OpenAPI
- **Testing**: Jest

### Frontend
- **Framework**: Next.js 16 (App Router)
- **UI**: React 19 + Tailwind CSS v4
- **Components**: shadcn/ui
- **State**: Zustand
- **Data Fetching**: TanStack Query + Axios
- **Forms**: React Hook Form + Zod
- **i18n**: next-intl (EN/ES)
- **Testing**: Vitest + Testing Library

## 🎯 For Different Users

### For Claude Code (AI Assistant)
Start with **[PROJECT_GUIDE.md](./docs/PROJECT_GUIDE.md)** for architecture overview, then check **[CODE_STANDARDS.md](./docs/CODE_STANDARDS.md)** for patterns.

### For Developers
1. **[Setup](./docs/DEVELOPMENT_WORKFLOW.md#environment-setup)** your environment
2. **[Learn](./docs/CODE_STANDARDS.md)** the code standards
3. **[Pick a workflow](./docs/DEVELOPMENT_WORKFLOW.md)** for what you're building

### For Architects/Leads
Deep dive into:
- [Backend Architecture](./docs/backend/architecture.md)
- [Database Schema](./docs/PROJECT_GUIDE.md#database-schema)
- [Authentication](./docs/backend/authentication.md)

## 📝 Key Features

✅ Full authentication system (JWT + Refresh tokens)
✅ Role-based access control (RBAC)
✅ Multi-tenancy support
✅ Type-safe API communication
✅ Responsive UI with modern components
✅ Comprehensive error handling
✅ Rate limiting and caching
✅ Database migrations management
✅ Comprehensive documentation
✅ Code standards and conventions

## 🔧 Common Tasks

### Adding Backend Feature
See [Backend Feature Implementation](./docs/DEVELOPMENT_WORKFLOW.md#backend-feature-implementation)

### Adding Frontend Page
See [Frontend Feature Implementation](./docs/DEVELOPMENT_WORKFLOW.md#frontend-feature-implementation)

### Database Changes
See [Database Changes](./docs/DEVELOPMENT_WORKFLOW.md#database-changes)

### Testing
See [Testing Workflow](./docs/DEVELOPMENT_WORKFLOW.md#testing-workflow)

## 📞 Need Help?

- **How to develop?** → [DEVELOPMENT_WORKFLOW.md](./docs/DEVELOPMENT_WORKFLOW.md)
- **Code patterns?** → [CODE_STANDARDS.md](./docs/CODE_STANDARDS.md)
- **Quick lookup?** → [QUICK_REFERENCE.md](./docs/QUICK_REFERENCE.md)
- **Specific topic?** → [Documentation Hub](./docs/README.md)

## 📝 License

MIT
