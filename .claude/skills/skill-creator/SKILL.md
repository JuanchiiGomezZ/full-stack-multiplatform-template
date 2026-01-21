---
name: skill-creator
description: >
  Creates new AI agent skills following the project workflow architecture.
  Trigger: When user asks to create a new skill, add agent instructions, or document patterns for AI.
license: MIT
metadata:
  author: juanma-gomez
  version: "2.0"
  scope: [root]
  auto_invoke: "create skill, new skill, document pattern"
allowed-tools: Read, Edit, Write, Glob, Grep, Bash, Task
---

## When to Create a Skill

Create a skill when:

- A pattern is used repeatedly and AI needs guidance
- Project-specific conventions differ from generic best practices
- Complex workflows need step-by-step instructions
- Decision trees help AI choose the right approach
- Templates/examples improve one-shot accuracy

**Don't create a skill when:**

- Pattern is trivial or self-explanatory
- It's a one-off task
- The pattern already exists in another skill

---

## Skill Structure

```
.claude/skills/{skill-name}/
├── SKILL.md              # Required - main skill file
├── assets/               # Optional - templates, schemas, examples
│   ├── template.ts
│   └── example.tsx
└── references/           # Optional - links to local docs
    └── patterns.md       # Points to existing repo files
```

---

## SKILL.md Template

Use the template in [assets/skill-template.md](assets/skill-template.md).

Key sections:

1. **Frontmatter** - metadata, scope, triggers
2. **When to Use** - clear triggers
3. **Critical Rules** - NON-NEGOTIABLE patterns
4. **Workflow** - step-by-step process
5. **Code Examples** - minimal, from real repo
6. **Commands** - copy-paste ready
7. **Resources** - templates and references

---

## Naming Conventions

| Tipo | Patrón | Ejemplos |
|------|--------|----------|
| Backend NestJS | `nestjs-{acción}` | `nestjs-endpoint`, `nestjs-guard`, `nestjs-module` |
| Prisma ORM | `prisma-{acción}` | `prisma-migration`, `prisma-seed`, `prisma-schema` |
| Backend Testing | `jest-{dominio}` | `jest-service`, `jest-controller`, `jest-e2e` |
| Frontend Next.js | `nextjs-{acción}` | `nextjs-page`, `nextjs-feature`, `nextjs-layout` |
| Componentes UI | `shadcn-{tipo}` | `shadcn-components`, `shadcn-form` |
| Data Fetching | `tanstack-query` | `tanstack-query` |
| Forms | `react-hook-form` | `react-hook-form` |
| State | `zustand-{dominio}` | `zustand-store`, `zustand-persist` |
| i18n | `next-intl` | `next-intl` |
| Mobile Expo | `expo-{acción}` | `expo-screen`, `mobile-navigation` |
| React Native | `rn-{dominio}` | `mobile-unistyles`, `rn-components` |
| Planificación | `{área}-design` | `backend-design`, `frontend-design` |

---

## Scope Values

El `scope` determina en qué CLAUDE.md se registra la skill:

| Scope | Se registra en | Descripción |
|-------|----------------|-------------|
| `[root]` | `CLAUDE.md` | Skills globales (commits, planning) |
| `[backend]` | `backend/CLAUDE.md` | Skills de NestJS, Prisma, Jest |
| `[frontend]` | `frontend/CLAUDE.md` | Skills de Next.js, React, shadcn |
| `[mobile]` | `mobile/CLAUDE.md` | Skills de Expo, React Native |

---

## Frontmatter Fields

| Campo | Requerido | Descripción |
|-------|-----------|-------------|
| `name` | Sí | Identificador (lowercase, hyphens) |
| `description` | Sí | Qué hace + Trigger en un bloque |
| `license` | Sí | `MIT` para este proyecto |
| `metadata.author` | Sí | `juanma-gomez` |
| `metadata.version` | Sí | Versión semántica como string |
| `metadata.scope` | Sí | Array: `[backend]`, `[frontend]`, `[mobile]`, `[root]` |
| `metadata.auto_invoke` | Sí | Keywords que disparan la skill |
| `allowed-tools` | No | Tools que la skill puede usar |

---

## Content Guidelines

### DO

- Empezar con las reglas más críticas (NON-NEGOTIABLE)
- Usar tablas para decision trees
- Mantener ejemplos mínimos y del repo real
- Incluir sección Commands con comandos copy-paste
- Referenciar archivos existentes del repo como ejemplos
- Usar paths relativos a la raíz del proyecto

### DON'T

- Duplicar contenido de otros skills
- Incluir explicaciones largas (link a docs)
- Agregar secciones de troubleshooting
- Usar URLs web (usar paths locales)
- Crear skills para patrones triviales

---

## Workflow para Crear una Skill

### 1. Verificar que no existe
```bash
ls .claude/skills/
```

### 2. Crear estructura
```bash
mkdir -p .claude/skills/{skill-name}/assets
touch .claude/skills/{skill-name}/SKILL.md
```

### 3. Escribir SKILL.md
Usar template de `assets/skill-template.md`

### 4. Agregar assets si necesario
- Templates de código
- Ejemplos reales del repo
- Schemas de validación

### 5. Registrar en CLAUDE.md del área

Agregar entrada en la tabla de auto-invoke:

```markdown
| {acción que triggerea} | `{skill-name}` |
```

### 6. Probar la skill
Pedir al agente que ejecute una tarea que debería invocar la skill.

---

## Checklist

- [ ] Skill no existe previamente
- [ ] Nombre sigue convenciones
- [ ] Frontmatter completo (incluye scope y auto_invoke)
- [ ] Reglas críticas son claras y NON-NEGOTIABLE
- [ ] Ejemplos son mínimos y del repo real
- [ ] Sección Commands existe
- [ ] Registrada en CLAUDE.md del área correspondiente
- [ ] Probada con una tarea real

---

## Resources

- **Template**: [assets/skill-template.md](assets/skill-template.md)
