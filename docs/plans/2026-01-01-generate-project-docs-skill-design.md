# Generate Project Docs Skill - Design Document

**Date**: 2026-01-01
**Status**: Approved
**Skill Name**: `generate-project-docs`

## Overview

### Purpose

Generate and maintain AI-optimized documentation for Claude Code that enables effective development by following the project's architectural patterns and business context.

### Problem Statement

- Claude Code needs complete context to work effectively
- Manual documentation becomes outdated quickly
- Each new conversation loses context about patterns and architectural decisions
- Developers spend time repeatedly explaining the same architecture
- Token usage can be inefficient with verbose or scattered documentation

### Solution

A semi-interactive skill that analyzes existing code, automatically detects architectural patterns, and generates structured documentation at two levels:

1. **CLAUDE.MD** - Critical context loaded in every conversation (project, business, stack, key decisions)
2. **.claude/rules/** - Rules and workflows organized by area, loaded conditionally based on file path

### Key Principle

**Documentation is generated from real code, not generic templates.** Existing patterns in the project are the source of truth.

## Execution Flow

### Command

`/generate-project-docs` or skill invocation `generate-project-docs`

### Phases

#### Phase 1: Automatic Analysis (no interaction)

1. Detect if monorepo or separate project
2. Analyze backend:
   - Detect framework (NestJS, Express, Fastify, etc.)
   - Scan `package.json` for key dependencies
   - Analyze folder structure (`src/modules/`, `src/core/`, etc.)
   - Identify patterns: Prisma, Zod, Guards, Controllers, Services, etc.
3. Analyze frontend:
   - Detect framework (Next.js App Router, Pages Router, React SPA, etc.)
   - Scan dependencies (TanStack Query, Zustand, shadcn/ui, etc.)
   - Analyze structure (`app/`, `features/`, `shared/`)
   - Identify patterns: server actions, components, hooks, stores, etc.
4. Review configurations: TypeScript, ESLint, Prettier, Docker, etc.

#### Phase 2: User Questions (interactive)

1. **Detection preview**: "Detected: NestJS + Prisma + Redis | Next.js 16 + TanStack Query + Zustand. Correct?"
2. **Business context**:
   - "What type of application is this? (SaaS, ecommerce, CRM, internal tool, etc.)"
   - "Does it use multi-tenancy? Organization model?"
   - "Role system? What are the main roles?"
   - "Main features of the project? (2-3 key points)"
3. **Critical rules**:
   - "Any critical business rules that must never be broken?"
   - "Special security/compliance restrictions?"
4. **Preview of files to generate**:
   ```
   Will generate:
   - CLAUDE.MD
   - .claude/rules/general.md
   - .claude/rules/testing.md
   - .claude/rules/architecture.md
   - .claude/rules/backend/api-endpoints.md
   - .claude/rules/backend/database.md
   - .claude/rules/backend/security.md
   - .claude/rules/frontend/components.md
   - .claude/rules/frontend/api-integration.md
   - .claude/rules/frontend/state-management.md
   - .claude/rules/reference/tech-decisions.md
   - .claude/rules/sop/adding-api-endpoint.md
   - .claude/rules/sop/adding-frontend-page.md

   Proceed?
   ```

#### Phase 3: Generation (automatic)

1. Generate CLAUDE.MD with critical context
2. Generate .claude/rules/ based on detection
3. Apply merge strategy if files already exist
4. Create SOPs based on real code examples

#### Phase 4: Validation and Report

1. Show summary of created/updated files
2. Suggest next step: "Documentation generated. You can edit it manually or regenerate when the project evolves."

## File Structure and Content

### CLAUDE.MD (project root)

**Purpose**: Essential context loaded in every Claude Code conversation.

**Content** (300-500 lines):

- Project Information (type, status, version)
- Tech Stack (backend + frontend with versions)
- High-Level Architecture (folder structure overview)
- Business Model (multi-tenancy, roles, permissions)
- Main Features (2-3 critical features)
- Critical Business Rules (soft delete, audit trail, etc.)
- Conventions (naming, imports, file organization)
- Documentation Index (links to .claude/rules/)

**Length target**: 300-500 lines (sufficient context without saturating tokens)

### .claude/rules/ (folder structure)

```
.claude/rules/
├── general.md              # Always loaded - git, docker, commands, env vars
├── testing.md              # Always loaded - testing strategy, conventions
├── architecture.md         # Always loaded - Complete project structure map
├── backend/                # Path-conditional (backend/**)
│   ├── api-endpoints.md
│   ├── database.md
│   ├── security.md
│   └── [detected patterns]
├── frontend/               # Path-conditional (frontend/** or src/app/**)
│   ├── components.md
│   ├── api-integration.md
│   ├── state-management.md
│   └── [detected patterns]
├── reference/              # Path-conditional (on demand)
│   └── tech-decisions.md
└── sop/                    # Path-conditional (on demand)
    ├── adding-api-endpoint.md
    ├── adding-frontend-page.md
    ├── adding-database-migration.md
    └── [detected patterns]
```

### Individual File Content

#### general.md (Always loaded)
- Common commands (npm scripts, docker-compose)
- Git workflow (branching, commits)
- Critical environment variables
- Initial project setup

#### testing.md (Always loaded)
- Testing strategy (unit, integration, e2e)
- Test locations
- Naming conventions
- How to run tests

#### architecture.md (Always loaded)
- Complete project structure (backend + frontend)
- Purpose of each directory
- Organization rules
- Path aliases
- Naming conventions
- Cross-cutting concerns

Content: ~400-600 lines with detailed folder structure and purposes

#### backend/api-endpoints.md (Flow-oriented)
- Pattern: Controller → Service → Prisma
- Complete example from existing project code
- DTOs with Zod
- Guards and decorators
- Swagger documentation
- References to real files: `src/modules/users/users.controller.ts:45`

#### sop/adding-api-endpoint.md (Procedural checklist)
```markdown
# SOP: Add New API Endpoint

## Checklist

- [ ] Create DTO in `dto/[feature].dto.ts` with Zod
- [ ] Add method in Service
- [ ] Add endpoint in Controller
- [ ] Add Swagger decorators
- [ ] Add Guards if requires auth
- [ ] Write unit tests
- [ ] Verify in Swagger UI

## Step-by-Step Example
[Based on real project code]
```

## Pattern Detection Logic

### Backend Detection

#### 1. Framework Identification

```javascript
// Search in package.json
dependencies: {
  "@nestjs/core" → NestJS detected
  "express" (without NestJS) → Express detected
  "fastify" → Fastify detected
}
```

#### 2. Architectural Pattern Detection

| Pattern | Detection Signals | File to Generate |
|---------|------------------|------------------|
| **Database** | `prisma`, `@prisma/client`, `typeorm`, `sequelize` | `backend/database.md` |
| **Validation** | `zod`, `class-validator`, `joi` | Include in `backend/api-endpoints.md` |
| **Authentication** | `@nestjs/jwt`, `passport`, files with `auth`, `guards/`, `strategies/` | `backend/security.md` |
| **Caching** | `redis`, `@nestjs/cache-manager`, `ioredis` | `backend/caching.md` |
| **Queue/Jobs** | `@nestjs/bull`, `bullmq`, `agenda` | `backend/jobs.md` |
| **File Storage** | `@aws-sdk/client-s3`, `multer`, folder `storage/` | `backend/file-storage.md` |
| **Email** | `nodemailer`, `@sendgrid/mail`, folder `mail/` | `backend/email.md` |
| **Testing** | `jest`, `vitest`, files `.spec.ts` | Update `testing.md` |
| **API Documentation** | `@nestjs/swagger`, `swagger-ui-express` | Include in `backend/api-endpoints.md` |

#### 3. Module Structure Detection

```typescript
// Analyze src/modules/
- If exists: Extract one complete module as canonical example
- Identify pattern: Controller → Service → DTO → Module
- Generate SOP based on this real module
```

#### 4. Prisma Schema Analysis (if exists)

```prisma
// Read prisma/schema.prisma
- Detect main models
- Identify critical relationships
- Detect soft delete (deletedAt field)
- Detect audit fields (createdBy, updatedBy)
- Map enums (Role, Status, etc.)
```

### Frontend Detection

#### 1. Framework Identification

```javascript
// package.json
dependencies: {
  "next": "16.x" → Next.js 16 App Router (verify src/app/ exists)
  "next": "13.x" → Verify App Router vs Pages Router
  "react" (without Next) → React SPA
}
```

#### 2. Architectural Pattern Detection

| Pattern | Detection Signals | File to Generate |
|---------|------------------|------------------|
| **State Management** | `zustand`, `@tanstack/react-query`, `redux`, `jotai` | `frontend/state-management.md` |
| **API Client** | `axios`, fetch wrapper, folder `services/` | `frontend/api-integration.md` |
| **Forms** | `react-hook-form`, `@hookform/resolvers`, `zod` | `frontend/forms.md` |
| **UI Library** | `shadcn/ui`, `@radix-ui`, folder `components/ui/` | `frontend/components.md` |
| **Styling** | `tailwindcss`, `styled-components`, `emotion` | Include in `frontend/components.md` |
| **i18n** | `next-intl`, `react-i18next`, folder `messages/` | `frontend/i18n.md` |
| **Animations** | `framer-motion`, `motion`, `@react-spring` | `frontend/animations.md` |
| **Testing** | `vitest`, `@testing-library/react`, files `.test.tsx` | Update `testing.md` |

#### 3. Feature Structure Detection

```typescript
// Analyze src/features/
- If structure exists: Identify one complete feature as example
- Detect pattern: components/ + hooks/ + services/ + stores/
- Generate SOP based on real feature
```

#### 4. Canonical Component Detection

```typescript
// Search for examples of:
- Installed shadcn/ui components (src/shared/components/ui/)
- Custom shared components (src/shared/components/common/)
- Custom hooks (src/shared/hooks/)
- Zustand stores (search files with `create` from zustand)
```

### File Generation Decision Algorithm

```
For each detected pattern:
  IF complexity >= THRESHOLD:
    Generate dedicated file
  ELSE:
    Include in broader related file

Examples:
- Prisma + 10+ models → backend/database.md (dedicated)
- Only Redis for rate limiting → Include in backend/api-endpoints.md
- React Query + axios + 5+ services → frontend/api-integration.md (dedicated)
- Only basic fetch → Include in frontend/components.md
```

**Complexity Threshold**:
- **Low**: 1-2 files of the pattern, few lines
- **Medium**: 3-5 files, moderate usage
- **High**: 6+ files, central pattern of the project

### Canonical Example Extraction

#### For SOPs - Backend

```typescript
// Find most complete/representative module:
1. List all modules in src/modules/
2. Analyze each:
   - Has Controller + Service + DTO + Module?
   - Uses Guards/Decorators?
   - Has tests?
   - Complete CRUD?
3. Choose most complete as reference
4. Extract real code for SOP examples
```

#### For SOPs - Frontend

```typescript
// Find most complete feature:
1. List features in src/features/
2. Analyze structure:
   - Has components/ + hooks/ + services/ + stores/?
   - Uses react-hook-form?
   - Integrates with API?
   - Has tests?
3. Choose reference feature
4. Extract patterns for SOP
```

### Real Code References Generation

In each generated `.md` file, include specific references:

```markdown
## Real Project Example

See complete implementation at:
- Controller: `src/modules/users/users.controller.ts:45-67`
- Service: `src/modules/users/users.service.ts:23-45`
- DTO: `src/modules/users/dto/create-user.dto.ts:5-15`

This pattern is followed in all project modules.
```

## Intelligent Merge Strategy

### Key Concepts

**Marked Sections**: Each generated file will have special markers:

```markdown
<!-- AUTO-GENERATED: START -->
[Auto-generated content that can be overwritten]
<!-- AUTO-GENERATED: END -->

<!-- MANUAL-EDIT -->
[Manually edited content - DO NOT OVERWRITE]
<!-- /MANUAL-EDIT -->
```

### Merge Algorithm

#### Step 1: Detect File State

```
IF file does NOT exist:
  → Generate new complete file

IF file exists:
  → Analyze content
  → Identify AUTO-GENERATED vs MANUAL-EDIT sections
  → Proceed to merge
```

#### Step 2: Strategy by Section Type

| Section Type | Regeneration Action |
|--------------|-------------------|
| `<!-- AUTO-GENERATED -->` | **Overwrite** with new code detection |
| `<!-- MANUAL-EDIT -->` | **Preserve** as is, don't touch |
| No markers | **Ask** user: "Overwrite or preserve?" |

#### Step 3: Significant Change Detection

```typescript
// If code changed significantly:
IF new_detected_technologies !== technologies_in_file:
  → Show diff to user
  → "Detected you now use X but file mentions Y. Update?"

IF new_patterns_found:
  → "Found new patterns: [list]. Add to documentation?"

IF modules_removed:
  → "Module X no longer exists in code. Remove from documentation?"
```

### Generated File Format

**Example: backend/api-endpoints.md**

```markdown
# API Endpoints Pattern

<!-- AUTO-GENERATED: START -->
<!-- Generated: 2026-01-01 -->
<!-- Source: Analysis of src/modules/users/ -->

## Stack Detected
- NestJS v10.3.0
- Zod validation (nestjs-zod)
- Swagger/OpenAPI
- JWT Guards

<!-- AUTO-GENERATED: END -->

<!-- MANUAL-EDIT -->
## Business Rules for Endpoints

### Critical Rules
1. All mutations require authentication
2. Soft delete only - never hard delete users
3. Always validate organizationId for multi-tenant isolation

### Custom Guidelines
- Use transaction for operations affecting multiple tables
- Rate limit public endpoints to 100 req/min
<!-- /MANUAL-EDIT -->

<!-- AUTO-GENERATED: START -->
## Standard Endpoint Pattern

Based on: `src/modules/users/users.controller.ts`

### 1. Define DTO with Zod
\`\`\`typescript
// dto/create-user.dto.ts
import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

export const createUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(255),
});

export class CreateUserDto extends createZodDto(createUserSchema) {}
\`\`\`
<!-- AUTO-GENERATED: END -->

<!-- MANUAL-EDIT -->
## Special Cases

### Webhook Endpoints
For webhook endpoints (e.g., Stripe), skip JWT guard and use signature verification instead.

See: `src/modules/billing/webhooks.controller.ts` for example.
<!-- /MANUAL-EDIT -->
```

### Step-by-Step Merge Process

#### Scenario 1: First Generation

```
1. Generate all files with AUTO-GENERATED markers
2. Include comment at start: "This file was auto-generated.
   You can add sections with <!-- MANUAL-EDIT --> to preserve content."
3. Create files without asking
```

#### Scenario 2: Regeneration - No Manual Changes

```
1. Detect that file only has AUTO-GENERATED sections
2. Completely overwrite with new detection
3. Notify: "Updated backend/api-endpoints.md (no manual edits)"
```

#### Scenario 3: Regeneration - With Manual Changes

```
1. Parse existing file
2. Extract MANUAL-EDIT sections
3. Regenerate AUTO-GENERATED sections with new detection
4. Combine: new_auto_generated + preserve_manual_edit
5. Write merged file
6. Notify: "Updated backend/api-endpoints.md (preserved 2 manual sections)"
```

#### Scenario 4: Detected Conflicts

```
IF new_structure_incompatible_with_manual_edits:
  1. Create backup: backend/api-endpoints.md.backup
  2. Show to user:
     "File structure changed significantly.
      - Backup saved at: api-endpoints.md.backup
      - Regenerate from scratch or attempt merge?"
  3. Option A: Regenerate (loses manual edits)
     Option B: Manual merge (user reviews later)
```

### Special Files

#### CLAUDE.MD

- First generation: Complete auto-generation
- Regeneration: **Always ask before overwriting**
  - "CLAUDE.MD already exists. Contains business context."
  - "Do you want: [A] Update stack/structure only [B] Regenerate complete [C] Cancel?"

#### architecture.md

- Always mark detected structure sections as AUTO-GENERATED
- Preserve manual notes/comments
- If project structure changed (new folders), show diff

#### SOPs

- If canonical example code changed → Update SOP automatically
- If manually added steps exist → Preserve them
- Show: "SOP updated with new example from src/modules/products/"

### Merge UI/UX

#### Clear Notifications

```
✓ Generated:   .claude/rules/backend/database.md (new)
↻ Updated:     .claude/rules/backend/api-endpoints.md (preserved edits)
⚠ Conflict:    CLAUDE.MD (requires manual decision)
- No changes:  .claude/rules/testing.md (code unchanged)
```

#### Change Preview

```markdown
Before writing files, show:

## Detected Changes

### New Technologies
+ Bull Queue (will generate backend/jobs.md)
+ React Hook Form (will add to frontend/forms.md)

### Updated Code
~ src/modules/users/ changed → Will update backend/api-endpoints.md
~ New components in shared/components/ → Will update frontend/components.md

### Files Without Changes
- backend/security.md (no changes in guards/)
- frontend/state-management.md (zustand unchanged)

Proceed with update?
```

## Implementation Notes

### Tools to Use

- **Glob**: Find files by patterns
- **Read**: Read package.json, source files, existing docs
- **Grep**: Search for specific patterns in code
- **AskUserQuestion**: Interactive questions for business context
- **Write**: Create new documentation files
- **Edit**: Update existing files using merge strategy
- **TodoWrite**: Track progress during generation

### Skill Structure

```markdown
---
name: generate-project-docs
description: Generate AI-optimized documentation for the project
---

# Generate Project Documentation

## Overview
[Skill description]

## Process

### Phase 1: Analysis
[Analysis checklist]

### Phase 2: User Questions
[Question flow with AskUserQuestion]

### Phase 3: Generation
[Generation logic with conditionals]

### Phase 4: Report
[Summary and next steps]

## Error Handling
[What to do if detection fails, files conflict, etc.]
```

### Testing Strategy

After creating the skill, test with:
1. Fresh project (no .claude/rules/)
2. Project with existing .claude/rules/ (merge test)
3. Project with manual edits (preserve test)
4. Project after significant code changes (update test)

## Success Criteria

The skill is successful if:

✅ Generates complete documentation from code analysis
✅ Captures business context through user questions
✅ Creates accurate SOPs based on real project patterns
✅ Preserves manual edits during regeneration
✅ References actual files with line numbers
✅ Optimizes token usage with layered documentation
✅ Enables Claude Code to work effectively with minimal context
✅ Is maintainable as the project evolves

## Future Enhancements

Post-MVP features to consider:

- **Smart context loader skill** - Automatically loads relevant .claude/rules/ sections based on current task
- **Documentation diff tool** - Shows what changed in docs vs code
- **CI/CD integration** - Auto-regenerate docs on PR merge
- **Multiple project templates** - Detect and use different templates (Django, Rails, etc.)
- **Documentation versioning** - Track doc changes over time

## Related Skills

This skill will work well with:
- `superpowers:brainstorming` - For planning new features with context
- `superpowers:writing-plans` - For implementation plans using documented patterns
- Future: `smart-context-loader` - For intelligent doc loading during tasks
