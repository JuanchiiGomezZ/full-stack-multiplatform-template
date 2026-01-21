# Project Template

Full-stack template: NestJS + Next.js + Expo with multi-tenancy support.

## Repo Map

| Area | Path | CLAUDE.md |
|------|------|-----------|
| Backend | `backend/` | [backend/CLAUDE.md](backend/CLAUDE.md) |
| Frontend | `frontend/` | `frontend/CLAUDE.md` (TODO) |
| Mobile | `mobile/` | [mobile/CLAUDE.md](mobile/CLAUDE.md) |
| Skills | `.claude/skills/` | Individual SKILL.md files |

## Area Routing

**IMPORTANT**: When working on a specific area, load its CLAUDE.md:

```
Backend task (endpoints, services, Prisma) → Read backend/CLAUDE.md
Frontend task (pages, components, React)   → Read frontend/CLAUDE.md
Mobile task (screens, Expo, RN)            → Read mobile/CLAUDE.md
```

---

## NON-NEGOTIABLE RULES (Global)

### No Invention

- **ALWAYS**: Find 2-3 existing patterns BEFORE writing new code
- **ALWAYS**: Follow existing conventions exactly
- **NEVER**: Invent new patterns, create new dependencies, or refactor without approval

### Soft Delete

- **ALWAYS**: Use `deletedAt` field, filter `deletedAt: null` in all queries
- **NEVER**: Hard delete data

### Multi-tenancy

- **ALWAYS**: Scope data by `organizationId` where applicable
- **NEVER**: Query across tenant boundaries

### Changes Requiring Approval

Ask before:
- Adding new dependencies
- Major refactors
- Architecture changes
- New patterns not in codebase

---

## Global Skills

| Action | Skill |
|--------|-------|
| Create new skill | `skill-creator` |
| Commit changes | Use conventional commits |
| Plan implementation | Use brainstorming first |

---

## Tech Stack Overview

| Layer | Technology |
|-------|------------|
| Backend | NestJS 11, Prisma 5, PostgreSQL, Redis |
| Frontend | Next.js 16, React 19, Tailwind, shadcn/ui |
| Mobile | Expo, React Native, Unistyles |
| Auth | JWT + Passport |
| Validation | Zod |

---

## Quick Commands

```bash
# Backend
cd backend && npm run start:dev

# Frontend
cd frontend && npm run dev

# Mobile
cd mobile && npm run start
```

---

## Default Workflow

1. **Explore** - Find similar patterns in codebase
2. **Ask** - Clarify requirements if ambiguous
3. **Plan** - Propose approach before implementing
4. **Implement** - Follow patterns exactly
5. **Verify** - Run lint/tests before finishing
