# File Structure and Content Templates

Reference for what content to include in each generated file.

## CLAUDE.MD (Project Root)

**Purpose:** Critical context loaded in every Claude Code conversation
**Length:** 300-500 lines
**Format:** Markdown

**Structure:**
```markdown
# [Project Name]

## Project Information
- Type: [SaaS/ecommerce/CRM/etc]
- Status: [Development/Production]
- Description: [from user answers]

## Tech Stack

### Backend
- Framework + version
- Database + ORM
- Key dependencies (auth, cache, etc.)

### Frontend
- Framework + version
- State management
- Key dependencies (UI, forms, etc.)

## Architecture Overview

### Backend Structure
```
src/
├── common/      # Purpose
├── core/        # Purpose
├── modules/     # Purpose
└── shared/      # Purpose
```

### Frontend Structure
```
src/
├── app/         # Purpose
├── features/    # Purpose
├── shared/      # Purpose
└── lib/         # Purpose
```

## Business Model

### Multi-tenancy
[from user answers]

### Roles and Permissions
- ROLE_1: [description]
- ROLE_2: [description]

### Main Features
1. [Feature 1]
2. [Feature 2]
3. [Feature 3]

## Critical Business Rules

1. [Rule from user answers]
2. [Rule from user answers]

## Conventions

### Naming
- Files: kebab-case
- Components: PascalCase
- Functions: camelCase
- Constants: SCREAMING_SNAKE_CASE

### Imports
- Use @/ alias
- Absolute imports only

## Documentation Index

See .claude/rules/ for detailed workflows:
- Backend: backend/api-endpoints.md, backend/database.md
- Frontend: frontend/components.md, frontend/state-management.md
- SOPs: sop/adding-api-endpoint.md, sop/adding-frontend-page.md
```

## .claude/rules/general.md

**Purpose:** Always loaded - common commands, git workflow
**Length:** 200-300 lines

**Structure:**
```markdown
# General Project Information

## Common Commands

### Development
```bash
# Backend
npm run dev           # Start development server
npm run build         # Build for production
npm run test          # Run tests
```

### Database
```bash
npx prisma generate   # Generate Prisma client
npx prisma migrate dev # Run migrations
npx prisma studio     # Open Prisma Studio
```

### Docker
```bash
docker-compose up -d  # Start services
docker-compose down   # Stop services
```

## Git Workflow

### Branching
- main: Production
- develop: Development
- feature/*: New features
- fix/*: Bug fixes

### Commits
Follow conventional commits:
- feat: New feature
- fix: Bug fix
- docs: Documentation
- refactor: Code refactoring

## Environment Variables

### Critical Variables
- DATABASE_URL: PostgreSQL connection
- JWT_SECRET: Auth secret (min 32 chars)
- REDIS_HOST: Redis host

See .env.example for complete list.

## Project Setup

### First Time
1. Clone repository
2. Copy .env.example to .env
3. docker-compose up -d
4. npm install (in backend/ and frontend/)
5. npx prisma generate
6. npx prisma migrate dev

### Daily
1. git pull
2. npm install (if package.json changed)
3. npx prisma generate (if schema changed)
4. docker-compose up -d
```

## .claude/rules/testing.md

**Purpose:** Always loaded - testing strategy and conventions
**Length:** 200-300 lines

**Structure:**
```markdown
# Testing Guidelines

## Testing Strategy

### Backend
- Unit tests: Services and utilities
- Integration tests: Controllers with database
- E2E tests: Complete workflows

### Frontend
- Unit tests: Utilities and hooks
- Component tests: UI components
- Integration tests: Feature flows

## Test Location

### Backend
- Place .spec.ts next to source file
- E2E tests in /test/

### Frontend
- Place .test.tsx next to component
- Integration tests in /e2e/

## Running Tests

### Backend
```bash
npm run test              # All tests
npm run test:watch        # Watch mode
npm run test:cov          # Coverage
```

### Frontend
```bash
npm run test              # All tests
npm run test:ui           # UI mode
npm run test:coverage     # Coverage
```

## Naming Conventions

- Test files: `[name].spec.ts` or `[name].test.tsx`
- Test suites: `describe('[Component/Service name]', ...)`
- Test cases: `it('should [expected behavior]', ...)`

## Test Patterns

[Include examples from detected test files]
```

## .claude/rules/architecture.md

**Purpose:** Always loaded - complete project structure map
**Length:** 400-600 lines

**Content:** See complete architecture.md example from design document
- Monorepo structure
- Backend directory structure with purposes
- Frontend directory structure with purposes
- Path aliases
- Naming conventions
- Cross-cutting concerns

## .claude/rules/backend/api-endpoints.md

**Purpose:** Path-conditional (backend/**) - How to create endpoints
**Length:** 300-500 lines

**Structure:**
```markdown
# API Endpoints Pattern

<!-- AUTO-GENERATED: START -->
<!-- Generated: [DATE] -->
<!-- Source: [canonical module path] -->

## Stack Detected
- [Framework + version]
- [Validation library]
- [API documentation tool]
- [Auth mechanism]

<!-- AUTO-GENERATED: END -->

<!-- AUTO-GENERATED: START -->

## Standard Pattern

Based on: `[canonical module path]`

### 1. Define DTO

```typescript
// [Example from canonical module]
```

### 2. Implement Service

```typescript
// [Example from canonical module]
```

### 3. Create Controller

```typescript
// [Example from canonical module]
```

### 4. Wire Module

```typescript
// [Example from canonical module]
```

<!-- AUTO-GENERATED: END -->

## Common Patterns

### Pagination
[Example from code]

### Error Handling
[Example from code]

### Guards and Decorators
[Example from code]
```

## .claude/rules/sop/adding-api-endpoint.md

**Purpose:** On-demand - Step-by-step procedure
**Length:** 200-300 lines

**Structure:**
```markdown
# SOP: Add New API Endpoint

## Checklist

- [ ] Create DTO in `dto/[feature].dto.ts` with Zod
- [ ] Add method in Service
- [ ] Add endpoint in Controller
- [ ] Add Swagger decorators
- [ ] Add Guards if requires auth
- [ ] Write unit tests
- [ ] Write integration tests
- [ ] Verify in Swagger UI

## Step-by-Step

### Step 1: Create DTO

Based on: `[canonical module path]`

```typescript
// [Actual code from project]
```

### Step 2: Implement Service Method

```typescript
// [Actual code from project]
```

### Step 3: Add Controller Endpoint

```typescript
// [Actual code from project]
```

### Step 4: Wire in Module

```typescript
// [Actual code from project]
```

### Step 5: Test

```bash
# Run tests
npm run test

# Check Swagger UI
# Navigate to http://localhost:3000/api/docs
```

## Verification

- [ ] Endpoint appears in Swagger UI
- [ ] Tests pass
- [ ] Auth works correctly
- [ ] Validation works
- [ ] Error responses are correct
```

## Content Generation Rules

### For All Files

1. **Use section markers:**
   ```markdown
   <!-- AUTO-GENERATED: START -->
   [Content that can be regenerated]
   <!-- AUTO-GENERATED: END -->

   <!-- MANUAL-EDIT -->
   [User can add content here]
   <!-- /MANUAL-EDIT -->
   ```

2. **Add metadata:**
   ```markdown
   <!-- Generated: 2026-01-01 -->
   <!-- Source: src/modules/users/ -->
   ```

3. **Include references:**
   ```markdown
   See: `src/modules/users/users.controller.ts:45-67`
   ```

4. **Extract real code:**
   - Read canonical files
   - Copy actual patterns
   - Include line numbers

5. **Be concise:**
   - Target lengths listed above
   - Link to code for details
   - Use tables for reference

### File-Specific Rules

**CLAUDE.MD:**
- Include business context from user answers
- Keep technical stack current
- Reference .claude/rules/ for details
- ~400 lines ideal

**general.md:**
- Commands actually used in project
- Real environment variables from .env.example
- Actual git workflow from project

**architecture.md:**
- Map actual folder structure
- Describe real purposes (not generic)
- Include actual path aliases from tsconfig.json

**Pattern files (backend/*.md, frontend/*.md):**
- Based on detected patterns
- Examples from canonical code
- Real file references with line numbers

**SOPs (sop/*.md):**
- Step-by-step based on canonical examples
- Actual code snippets
- Verification steps from project

## Token Optimization

**Techniques:**
1. Use tables for reference data
2. Link to code instead of duplicating
3. Concise examples (not exhaustive)
4. Path-conditional loading (not all at once)
5. Auto-generated sections (can be re-read on demand)

**Target distribution:**
- CLAUDE.MD: 400 lines (always loaded)
- Always loaded rules: 3 files × 250 lines = 750 lines
- **Total always loaded: ~1,150 lines**
- Conditional files: Loaded only when needed

**vs. Baseline:**
- Baseline: 4,117 lines always loaded
- With skill: ~1,150 lines always, rest conditional
- **Savings: ~72% reduction in loaded context**
