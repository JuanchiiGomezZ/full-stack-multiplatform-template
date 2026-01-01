# Frontend Template - Implementation Plan

## Overview

A scalable, well-documented Next.js 16 SaaS template with:

- **App Router** with SSR landing + CSR dashboard
- **Tailwind CSS v4** + **shadcn/ui**
- **Zustand** for state, **TanStack Query** + **Axios** for API
- **next-intl** for i18n (ES/EN)
- **Vitest** for testing
- AI-friendly documentation in `/docs/frontend/`

---

## Final Project Structure

```
project-template/
├── frontend/                         # Frontend Next.js application
│   ├── src/
│   │   ├── app/                      # Next.js App Router
│   │   │   ├── [locale]/             # i18n locale segment
│   │   │   │   ├── (marketing)/      # SSR: Landing, pricing, etc.
│   │   │   │   │   ├── page.tsx
│   │   │   │   │   └── layout.tsx
│   │   │   │   ├── (tool)/           # CSR: Protected app
│   │   │   │   │   ├── dashboard/
│   │   │   │   │   └── layout.tsx
│   │   │   │   ├── (auth)/           # Auth pages
│   │   │   │   │   ├── login/
│   │   │   │   │   └── register/
│   │   │   │   ├── layout.tsx
│   │   │   │   ├── page.tsx
│   │   │   │   ├── not-found.tsx
│   │   │   │   └── error.tsx
│   │   │   ├── api/                  # Route handlers (if needed)
│   │   │   └── globals.css
│   │   │
│   │   ├── features/                 # Business modules
│   │   │   ├── auth/                 # Example feature
│   │   │   │   ├── components/
│   │   │   │   ├── hooks/
│   │   │   │   ├── services/
│   │   │   │   ├── stores/
│   │   │   │   ├── types/
│   │   │   │   ├── utils/
│   │   │   │   └── index.ts
│   │   │   └── [feature-name]/
│   │   │
│   │   ├── shared/
│   │   │   ├── components/
│   │   │   │   ├── ui/               # shadcn/ui components
│   │   │   │   └── common/           # Custom shared components
│   │   │   ├── hooks/
│   │   │   ├── lib/
│   │   │   │   ├── api.ts            # Axios instance
│   │   │   │   ├── query.ts          # TanStack Query config
│   │   │   │   ├── utils.ts          # cn() helper
│   │   │   │   └── zod.ts            # Zod utilities
│   │   │   ├── services/
│   │   │   ├── stores/               # Global Zustand stores
│   │   │   ├── types/
│   │   │   ├── utils/
│   │   │   ├── config/
│   │   │   │   └── env.ts            # Validated env vars
│   │   │   └── constants/
│   │   │
│   │   ├── i18n/
│   │   │   ├── messages/
│   │   │   │   ├── en.json
│   │   │   │   └── es.json
│   │   │   ├── request.ts
│   │   │   └── routing.ts
│   │   │
│   │   ├── middleware.ts             # Auth + i18n middleware
│   │   │
│   │   └── test/
│   │       ├── setup.ts
│   │       ├── utils.tsx
│   │       └── mocks/
│   │
│   ├── public/
│   ├── .env.example
│   ├── .env.local
│   ├── next.config.ts
│   ├── tailwind.config.ts
│   ├── tsconfig.json
│   ├── vitest.config.ts
│   ├── package.json
│   └── README.md
│
├── docs/
│   └── frontend/
│       ├── README.md
│       ├── architecture.md
│       ├── components.md
│       ├── features.md
│       ├── api-patterns.md
│       ├── state-management.md
│       ├── forms.md
│       ├── i18n.md
│       ├── testing.md
│       └── styling.md
│
└── README.md                         # Root project README
```

---

## Phase 1: Project Initialization

### Commands

```bash
mkdir -p frontend
npx create-next-app@latest ./frontend --typescript --tailwind --eslint --app --src-dir --turbopack --import-alias "@/*"
```

### Configuration Files

#### [MODIFY] tsconfig.json

Add path aliases:

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"],
      "@app/*": ["./src/app/*"],
      "@features/*": ["./src/features/*"],
      "@shared/*": ["./src/shared/*"],
      "@i18n/*": ["./src/i18n/*"],
      "@test/*": ["./src/test/*"]
    }
  }
}
```

#### [MODIFY] next.config.ts

Enable experimental features.

---

## Phase 2: Styling & UI

### Tailwind CSS v4

Already included with `create-next-app`. Verify configuration.

### shadcn/ui Setup

```bash
npx shadcn@latest init
npx shadcn@latest add button input label dialog sheet dropdown-menu card table toast form
```

> [!NOTE]
> Components will be installed in `src/shared/components/ui/`

---

## Phase 3: Core Libraries

### Dependencies

```bash
npm install axios @tanstack/react-query zustand react-hook-form @hookform/resolvers zod
```

### Files to Create

| File                       | Purpose                             |
| -------------------------- | ----------------------------------- |
| `src/shared/lib/api.ts`    | Axios instance with interceptors    |
| `src/shared/lib/query.ts`  | TanStack Query client config        |
| `src/shared/lib/utils.ts`  | `cn()` helper for classnames        |
| `src/shared/config/env.ts` | Zod-validated environment variables |
| `src/app/providers.tsx`    | Client providers wrapper            |

---

## Phase 4: i18n

### Dependencies

```bash
npm install next-intl
```

### Files to Create

| File                        | Purpose                |
| --------------------------- | ---------------------- |
| `src/i18n/routing.ts`       | Locale routing config  |
| `src/i18n/request.ts`       | Server-side i18n       |
| `src/i18n/messages/en.json` | English translations   |
| `src/i18n/messages/es.json` | Spanish translations   |
| `src/middleware.ts`         | i18n + auth middleware |

---

## Phase 5: Auth & Middleware

### Middleware Logic

1. Locale detection and routing
2. Protected route checking (`/tool/*`)
3. Redirect to login if no auth cookie

### Files to Create

| File                                         | Purpose                         |
| -------------------------------------------- | ------------------------------- |
| `src/middleware.ts`                          | Combined i18n + auth middleware |
| `src/features/auth/stores/auth.store.ts`     | Auth Zustand store              |
| `src/features/auth/services/auth.service.ts` | Auth API calls                  |
| `src/features/auth/hooks/useAuth.ts`         | Auth hook                       |
| `src/features/auth/types/auth.types.ts`      | Auth types                      |

---

## Phase 6: Project Structure

### Create Folder Structure

All folders defined in the structure above.

### Feature Template

Each feature contains standardized folders with `index.ts` as public API.

---

## Phase 7: Testing

### Dependencies

```bash
npm install -D vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/jest-dom
```

### Files to Create

| File                 | Purpose               |
| -------------------- | --------------------- |
| `vitest.config.ts`   | Vitest configuration  |
| `src/test/setup.ts`  | Global test setup     |
| `src/test/utils.tsx` | Test render utilities |

---

## Phase 8: Documentation

### `/docs/frontend/` Structure

| File                  | Content                                              |
| --------------------- | ---------------------------------------------------- |
| `README.md`           | Index with links to all docs                         |
| `architecture.md`     | Project structure, conventions, file organization    |
| `components.md`       | shadcn/ui usage, custom components, naming           |
| `features.md`         | Feature module pattern, public API, boundaries       |
| `api-patterns.md`     | Axios setup, TanStack Query patterns, error handling |
| `state-management.md` | Zustand store patterns, when to use global vs local  |
| `forms.md`            | React Hook Form + Zod validation patterns            |
| `i18n.md`             | Translation workflow, adding locales                 |
| `testing.md`          | Test file location, mocking, utilities               |
| `styling.md`          | Tailwind conventions, theme customization            |

> [!IMPORTANT]
> Documentation is designed as AI agent context. Each file should be self-contained and provide clear use rules.

---

## Verification Plan

### Automated

- `npm run dev` - Development server starts
- `npm run build` - Production build succeeds
- `npm run lint` - No linting errors
- `npm run test` - Tests pass

### Manual

- Navigate to `/en` and `/es` - i18n works
- Navigate to `/en/tool/dashboard` without auth - redirects to login
- Verify all shadcn/ui components render correctly

---

## Execution Order

| Phase                | Depends On | Estimated Steps |
| -------------------- | ---------- | --------------- |
| 1. Initialization    | -          | 5               |
| 2. Styling & UI      | Phase 1    | 8               |
| 3. Core Libraries    | Phase 1    | 10              |
| 4. i18n              | Phase 1    | 6               |
| 5. Auth & Middleware | Phase 3, 4 | 8               |
| 6. Project Structure | Phase 1    | 5               |
| 7. Testing           | Phase 3    | 5               |
| 8. Documentation     | All        | 12              |

**Total estimated steps: ~60**
