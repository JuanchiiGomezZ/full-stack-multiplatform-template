# Pattern Detection Logic

Complete reference for detecting technologies and patterns from code analysis.

## Backend Detection

### Framework Identification

```javascript
// Read package.json dependencies
"@nestjs/core" → NestJS
"express" (without NestJS) → Express
"fastify" → Fastify
```

### Pattern Detection Table

| Pattern | Detection Signals | File to Generate | Complexity Threshold |
|---------|------------------|------------------|---------------------|
| **Database** | `prisma`, `@prisma/client`, `typeorm`, `sequelize` | `backend/database.md` | Always if found |
| **Authentication** | `@nestjs/jwt`, `passport`, folders `auth/`, `guards/`, `strategies/` | `backend/security.md` | 3+ related files |
| **Caching** | `redis`, `@nestjs/cache-manager`, `ioredis` | `backend/caching.md` | If used for >rate limiting |
| **Queue/Jobs** | `@nestjs/bull`, `bullmq`, `agenda` | `backend/jobs.md` | If queue folder exists |
| **File Storage** | `@aws-sdk/client-s3`, `multer`, folder `storage/` | `backend/file-storage.md` | If storage service exists |
| **Email** | `nodemailer`, `@sendgrid/mail`, folder `mail/` | `backend/email.md` | If mail service exists |
| **Validation** | `zod`, `class-validator`, `joi` | Include in `backend/api-endpoints.md` | N/A |
| **API Docs** | `@nestjs/swagger` | Include in `backend/api-endpoints.md` | N/A |
| **Testing** | `jest`, `vitest`, `.spec.ts` files | Update `testing.md` | Always |

### Module Structure Analysis

```typescript
// Scan src/modules/
1. List all directories in src/modules/
2. For each module, check:
   - Has .controller.ts?
   - Has .service.ts?
   - Has .module.ts?
   - Has dto/ folder?
   - Has tests?
3. Find most complete module (highest score)
4. Use as canonical example for:
   - backend/api-endpoints.md
   - sop/adding-api-endpoint.md
```

### Prisma Schema Analysis

```prisma
// If prisma/schema.prisma exists:
1. List all models
2. Identify enums (Role, Status, etc.)
3. Check for soft delete: deletedAt field?
4. Check for audit: createdBy, updatedBy?
5. Map relationships (1-to-many, many-to-many)
6. Include in backend/database.md
```

## Frontend Detection

### Framework Identification

```javascript
// Read package.json
"next": "16.x" + src/app/ exists → Next.js 16 App Router
"next": "13.x-15.x" → Check for app/ vs pages/
"react" (without next) → React SPA
```

### Pattern Detection Table

| Pattern | Detection Signals | File to Generate | Complexity Threshold |
|---------|------------------|------------------|---------------------|
| **State Management** | `zustand`, `@tanstack/react-query`, `redux`, `jotai` | `frontend/state-management.md` | Always if found |
| **API Client** | `axios`, fetch wrappers, folder `services/` | `frontend/api-integration.md` | 5+ service files |
| **Forms** | `react-hook-form`, `@hookform/resolvers` | `frontend/forms.md` | If consistently used |
| **UI Components** | `shadcn/ui`, `@radix-ui`, folder `components/ui/` | `frontend/components.md` | Always |
| **Styling** | `tailwindcss`, `styled-components`, `emotion` | Include in `frontend/components.md` | N/A |
| **i18n** | `next-intl`, `react-i18next`, folder `messages/` | `frontend/i18n.md` | If i18n setup exists |
| **Animations** | `framer-motion`, `motion`, `@react-spring` | `frontend/animations.md` | If consistently used |
| **Testing** | `vitest`, `@testing-library/react`, `.test.tsx` | Update `testing.md` | Always |

### Feature Structure Analysis

```typescript
// If src/features/ exists:
1. List all feature directories
2. For each feature, check:
   - Has components/?
   - Has hooks/?
   - Has services/?
   - Has stores/?
   - Has types/?
3. Find most complete feature
4. Use as canonical example for:
   - frontend/components.md
   - sop/adding-frontend-page.md
```

### Component Analysis

```typescript
// Detect installed shadcn/ui components
1. List files in src/shared/components/ui/
2. Common components:
   - button, input, label
   - dialog, sheet, dropdown-menu
   - card, table, form

// Detect custom shared components
1. Check src/shared/components/common/
2. Identify reusable patterns

// Include in frontend/components.md
```

## Complexity Thresholds

**Decision Algorithm:**
```
For each detected pattern:
  count_files = number of files using pattern

  IF pattern is "always generate" (database, state, components):
    generate dedicated file
  ELSE IF count_files >= THRESHOLD:
    generate dedicated file
  ELSE:
    include in related file

Thresholds:
- Low: 1-2 files → Include in related file
- Medium: 3-5 files → Consider dedicated file
- High: 6+ files → Always dedicated file
```

## Canonical Example Extraction

### Backend Example

```typescript
// Find best module for examples:

function findCanonicalModule(modules) {
  let bestScore = 0;
  let bestModule = null;

  for (const module of modules) {
    let score = 0;
    if (hasController) score += 2;
    if (hasService) score += 2;
    if (hasDTO) score += 2;
    if (hasModule) score += 1;
    if (hasGuards) score += 1;
    if (hasTests) score += 2;
    if (isCRUD) score += 3;

    if (score > bestScore) {
      bestScore = score;
      bestModule = module;
    }
  }

  return bestModule;
}

// Use in:
// - backend/api-endpoints.md (examples)
// - sop/adding-api-endpoint.md (step-by-step)
```

### Frontend Example

```typescript
// Find best feature for examples:

function findCanonicalFeature(features) {
  let bestScore = 0;
  let bestFeature = null;

  for (const feature of features) {
    let score = 0;
    if (hasComponents) score += 2;
    if (hasHooks) score += 1;
    if (hasServices) score += 2;
    if (hasStores) score += 1;
    if (hasTests) score += 2;
    if (usesFormValidation) score += 2;
    if (integratesAPI) score += 2;

    if (score > bestScore) {
      bestScore = score;
      bestFeature = feature;
    }
  }

  return bestFeature;
}

// Use in:
// - frontend/components.md (examples)
// - sop/adding-frontend-page.md (step-by-step)
```

## File Reference Generation

**Always include specific references to real code:**

```markdown
## Example from Project

See implementation:
- Controller: `src/modules/users/users.controller.ts:45-67`
- Service: `src/modules/users/users.service.ts:23-45`
- DTO: `src/modules/users/dto/create-user.dto.ts:5-15`

This pattern is followed across all modules.
```

**How to generate:**
1. Read the canonical file
2. Find the relevant section
3. Note line numbers
4. Add to generated documentation

## Detection Checklist

When analyzing a project:

- [ ] Read backend/package.json
- [ ] Read frontend/package.json
- [ ] Scan backend folder structure
- [ ] Scan frontend folder structure
- [ ] Identify backend framework
- [ ] Identify frontend framework
- [ ] List backend patterns (database, auth, cache, etc.)
- [ ] List frontend patterns (state, forms, UI, etc.)
- [ ] Find canonical backend module
- [ ] Find canonical frontend feature
- [ ] Map Prisma schema (if exists)
- [ ] List shadcn/ui components (if exists)
- [ ] Determine which files to generate
- [ ] Extract code examples with line numbers
