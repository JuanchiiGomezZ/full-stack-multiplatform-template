# Generate Project Docs Skill

AI-optimized project documentation generator for Claude Code.

## What It Does

Generates documentation that enables Claude Code to:
- Understand project architecture and patterns
- Follow existing code conventions
- Access business context and critical rules
- Work efficiently with token-optimized structure

## Key Difference vs Generic Docs

**Traditional approach (without skill):**
- Creates `docs/` with generic templates
- 4,000+ lines loaded every conversation
- Assumes patterns without analyzing code
- No business context captured
- No merge strategy for updates

**With this skill:**
- Creates `CLAUDE.MD` + `.claude/rules/` structure
- ~1,150 lines always loaded, rest conditional (~72% savings)
- Analyzes real code to extract patterns
- Captures business context via questions
- Intelligent merge preserves manual edits

## Usage

```bash
# In Claude Code conversation:
/generate-project-docs
```

or if you prefer using the Skill tool:
```
Use the Skill tool with skill: "generate-project-docs"
```

## What Gets Generated

```
CLAUDE.MD                          # Critical context (300-500 lines)

.claude/rules/
├── general.md                     # Commands, git, env vars
├── testing.md                     # Testing strategy
├── architecture.md                # Complete structure map
├── backend/                       # Backend patterns
│   ├── api-endpoints.md
│   ├── database.md
│   ├── security.md
│   └── [detected patterns]
├── frontend/                      # Frontend patterns
│   ├── components.md
│   ├── api-integration.md
│   ├── state-management.md
│   └── [detected patterns]
├── reference/                     # Architectural decisions
│   └── tech-decisions.md
└── sop/                           # Step-by-step procedures
    ├── adding-api-endpoint.md
    ├── adding-frontend-page.md
    └── [from canonical examples]
```

## The Process

1. **Analyze Code** (automatic)
   - Reads package.json
   - Scans folder structure
   - Detects frameworks and patterns
   - Finds canonical examples

2. **Ask Questions** (interactive)
   - Application type (SaaS, ecommerce, etc.)
   - Multi-tenancy model
   - Role system
   - Critical business rules
   - Main features

3. **Preview** (before writing)
   - Shows files to generate
   - Gets your approval

4. **Generate** (automatic)
   - Creates CLAUDE.MD with context
   - Generates .claude/rules/ files
   - Extracts real code examples
   - Adds file references with line numbers

5. **Merge** (if updating)
   - Preserves manual edits
   - Updates auto-generated sections
   - Shows change summary

## Key Features

### ✅ Code Analysis (Not Templates)
```
❌ Assumes: "NestJS uses standard CRUD pattern"
✅ Analyzes: src/modules/users/ and extracts actual pattern
```

### ✅ Real Code References
```markdown
See implementation:
- Controller: `src/modules/users/users.controller.ts:45-67`
- Service: `src/modules/users/users.service.ts:23-45`
```

### ✅ Intelligent Merge
```markdown
<!-- AUTO-GENERATED: START -->
[This gets updated when code changes]
<!-- AUTO-GENERATED: END -->

<!-- MANUAL-EDIT -->
[Your notes are preserved forever]
<!-- /MANUAL-EDIT -->
```

### ✅ Token Optimization
- Path-conditional loading (backend files load only in backend/)
- Concise content (link to code instead of duplicating)
- Layered structure (always-loaded vs on-demand)

## When to Regenerate

Run again when:
- Major architectural changes
- New technologies added (Bull Queue, React Hook Form, etc.)
- Patterns evolved significantly
- Business rules changed

The skill will:
- Detect changes
- Show preview
- Preserve your manual edits
- Update auto-generated sections

## Files

- **SKILL.md** - Main workflow and usage
- **detection-patterns.md** - Pattern detection logic
- **file-structure.md** - Content templates
- **merge-strategy.md** - Merge algorithm

## Testing

Verified with TDD approach:
- ✅ Baseline test without skill (10 gaps identified)
- ✅ Skill addresses all baseline failures
- ✅ Verification complete

## Location

- **Personal skills**: `~/.claude/skills/generate-project-docs/`
- **Project copy**: `.claude/skills/generate-project-docs/`

## Design Document

See complete design rationale:
`docs/plans/2026-01-01-generate-project-docs-skill-design.md`

## Future Enhancements

After using this skill, you might want:
- **Smart context loader** - Auto-loads relevant rules based on current task
- **Documentation diff** - Shows what changed in docs vs code
- **CI/CD integration** - Auto-regenerate on PR merge

## Contributing

If you improve this skill:
1. Test changes with baseline scenario
2. Update this README
3. Commit changes
4. Share improvements

---

**Built with TDD principles - tested before written.**
