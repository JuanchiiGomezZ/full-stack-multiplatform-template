---
name: generate-project-docs
description: Use when you need to generate or update AI-optimized project documentation for Claude Code. Triggers include new projects without .claude/rules/, outdated documentation after major code changes, missing context about project architecture, or when you catch yourself generating generic documentation instead of analyzing real code patterns.
---

# Generate Project Documentation

## Overview

Generate AI-optimized documentation that enables Claude Code to understand project architecture and follow existing patterns. **Core principle: Documentation is generated from analyzing real code, not from generic templates.**

## When to Use

Use when you need to:
- Generate documentation for a new project
- Update documentation after significant code changes
- Create `.claude/rules/` structure for Claude Code
- Ensure future Claude instances have project context

**Do NOT use for:**
- Adding one-off project notes (use CLAUDE.md directly)
- Documenting a single feature (add to existing docs)
- Creating user-facing documentation (this is for AI consumption)

## The Core Problem

**Baseline behavior without this skill:**
- Creates `docs/` with generic documentation, not `.claude/rules/`
- Doesn't analyze real code - uses assumptions and templates
- Generates verbose docs that load completely (no conditional loading)
- No business context questions (multi-tenancy, roles, critical rules)
- No merge strategy for updates
- No references to actual code files

**This skill fixes all of these.**

## Quick Reference

| Phase | Action | Output |
|-------|--------|--------|
| **Analyze** | Detect stack, patterns, structure from code | Pattern detection report |
| **Question** | Ask about business context | Business rules, roles, features |
| **Preview** | Show files to generate | User approval |
| **Generate** | Create CLAUDE.MD + .claude/rules/ | Documentation files |
| **Merge** | Preserve manual edits if regenerating | Updated docs |

## The Process

### Phase 1: Analyze Code (Automatic)

**Detect patterns from real code - never assume:**

1. Read `package.json` (backend + frontend)
2. Scan folder structure
3. Identify framework (NestJS/Express/Next.js/React)
4. Detect dependencies and patterns

**See @detection-patterns.md for complete detection logic**

### Phase 2: Ask Business Context (Interactive)

**Never generate without asking:**

```
Required questions:
1. "Detected [stack]. Correct?"
2. "Application type? (SaaS/ecommerce/CRM/etc.)"
3. "Multi-tenancy? Organization model?"
4. "Role system? Main roles?"
5. "Critical business rules that must never be broken?"
6. "Main features? (2-3 key points)"
```

Use `AskUserQuestion` tool for clean interaction.

### Phase 3: Preview Files (Before Writing)

Show what you'll generate:
```
Will generate:
- CLAUDE.MD
- .claude/rules/general.md
- .claude/rules/testing.md
- .claude/rules/architecture.md
- .claude/rules/backend/api-endpoints.md
- .claude/rules/frontend/components.md
- .claude/rules/sop/adding-api-endpoint.md

Proceed?
```

### Phase 4: Generate Documentation

**Structure:**
```
CLAUDE.MD                       # Context (300-500 lines)
.claude/rules/
├── general.md                  # Always loaded
├── testing.md                  # Always loaded
├── architecture.md             # Always loaded
├── backend/*.md                # Path-conditional
├── frontend/*.md               # Path-conditional
├── reference/*.md              # On demand
└── sop/*.md                    # On demand
```

**See @file-structure.md for content templates**

### Phase 5: Merge Strategy (If Regenerating)

**Use section markers:**
```markdown
<!-- AUTO-GENERATED: START -->
[Overwritable content]
<!-- AUTO-GENERATED: END -->

<!-- MANUAL-EDIT -->
[Preserved content]
<!-- /MANUAL-EDIT -->
```

**See @merge-strategy.md for complete algorithm**

## Key Rules

### ❌ NEVER Do This

1. **Don't create generic docs** - Always analyze real code
2. **Don't skip business questions** - Context is critical
3. **Don't ignore existing docs** - Use merge strategy
4. **Don't forget references** - Link to real files: `file.ts:45`
5. **Don't make huge files** - Use path-conditional loading

### ✅ ALWAYS Do This

1. **Analyze code first** - Read package.json, scan folders
2. **Ask about business** - Multi-tenancy, roles, critical rules
3. **Preview before writing** - Get user approval
4. **Use real examples** - Extract from canonical modules/components
5. **Add file references** - `src/modules/users/users.controller.ts:45`
6. **Use section markers** - AUTO-GENERATED vs MANUAL-EDIT
7. **Optimize for tokens** - Conditional loading, concise content

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| "I'll create comprehensive docs in /docs/" | WRONG. Use .claude/rules/ with path-conditional loading |
| "I'll assume NestJS uses standard patterns" | WRONG. Analyze actual code to find patterns |
| "I'll generate everything at once" | WRONG. Ask questions, preview, then generate |
| "I'll create detailed documentation" | WRONG. Be concise, link to code, optimize tokens |
| "Files exist, I'll overwrite them" | WRONG. Use merge strategy to preserve edits |

## Example Workflow

```
User: "/generate-project-docs"

You:
1. Read backend/package.json + frontend/package.json
2. Scan src/ structure
3. "Detected: NestJS + Prisma + Redis | Next.js 16 + Zustand. Correct?"

User: "Yes"

You:
4. Ask business questions (multi-tenancy, roles, features)
5. Find canonical module (src/modules/users/)
6. Preview: "Will generate CLAUDE.MD + 8 files in .claude/rules/"

User: "Proceed"

You:
7. Generate CLAUDE.MD (context from code + answers)
8. Generate .claude/rules/architecture.md (from folder scan)
9. Generate .claude/rules/backend/api-endpoints.md (from users module)
10. Generate .claude/rules/sop/adding-api-endpoint.md (from users pattern)
11. Add references: "See src/modules/users/users.controller.ts:45-67"
12. Use AUTO-GENERATED markers for future updates
```

## Real-World Impact

**Before this skill:**
- 4,117 lines of generic docs in /docs/
- No code analysis, just assumptions
- No business context captured
- No merge strategy
- Inefficient token usage

**After this skill:**
- 300-500 line CLAUDE.MD + modular .claude/rules/
- Documentation FROM real code patterns
- Business context preserved
- Merge-safe updates
- Token-optimized conditional loading

**Token savings:** ~10x reduction in loaded context per conversation

## Supporting Files

- `@detection-patterns.md` - Complete pattern detection logic
- `@file-structure.md` - Content templates for each file type
- `@merge-strategy.md` - Intelligent merge algorithm

## Tools to Use

- **Glob**: Find files by pattern
- **Read**: Analyze package.json, source files
- **Grep**: Search for patterns in code
- **AskUserQuestion**: Business context questions
- **Write**: Create new files
- **Edit**: Update with merge strategy
- **TodoWrite**: Track progress through phases
