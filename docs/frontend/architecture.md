# Architecture

## Project Structure

```
frontend/
└── src/
    ├── app/                      # Next.js App Router
    │   ├── [locale]/             # i18n locale segment
    │   │   ├── (marketing)/      # Route group: Public SSR pages
    │   │   ├── (tool)/           # Route group: Protected CSR pages
    │   │   └── (auth)/           # Route group: Auth pages
    │   ├── providers.tsx         # Global client providers
    │   └── globals.css           # Global styles
    │
    ├── features/                 # Business modules (feature-based)
    │   └── [feature-name]/
    │       ├── components/       # Feature-specific components
    │       ├── hooks/            # Feature-specific hooks
    │       ├── services/         # API service layer
    │       ├── stores/           # Zustand stores
    │       ├── types/            # TypeScript types
    │       ├── utils/            # Utilities
    │       └── index.ts          # Public API
    │
    ├── shared/                   # Shared code
    │   ├── components/
    │   │   ├── ui/               # shadcn/ui components
    │   │   └── common/           # Custom shared components
    │   ├── hooks/                # Shared hooks
    │   ├── lib/                  # Library configs
    │   │   ├── api.ts            # Axios instance
    │   │   ├── query.ts          # TanStack Query client
    │   │   ├── utils.ts          # cn() helper
    │   │   └── zod.ts            # Zod schemas
    │   ├── config/
    │   │   └── env.ts            # Environment variables
    │   └── constants/            # Constants
    │
    ├── i18n/                     # Internationalization
    │   ├── messages/             # Translation files
    │   ├── routing.ts            # Locale config
    │   ├── request.ts            # Server-side i18n
    │   └── navigation.ts         # i18n navigation helpers
    │
    └── test/                     # Test utilities
        ├── setup.ts              # Global test setup
        ├── utils.tsx             # Custom render
        └── mocks/                # Shared mocks
```

## Path Aliases

```typescript
"@/*": "./src/*"
"@app/*": "./src/app/*"
"@features/*": "./src/features/*"
"@shared/*": "./src/shared/*"
"@i18n/*": "./src/i18n/*"
"@test/*": "./src/test/*"
```

## Route Groups

- `(marketing)`: SSR pages for SEO (landing, pricing, about)
- `(tool)`: CSR protected application pages
- `(auth)`: Login, register, forgot password

## Conventions

### File Naming

- Components: `PascalCase.tsx`
- Hooks: `camelCase.ts` (with `use` prefix)
- Services: `kebab-case.service.ts`
- Stores: `kebab-case.store.ts`
- Types: `kebab-case.types.ts`

### Import Order

1. External packages
2. `@shared/*` imports
3. `@features/*` imports
4. Relative imports
5. Types (last)

### Feature Isolation

- Features should only import from `@shared/*` or their own directory
- Features export via `index.ts` (public API)
- Cross-feature imports: Only via public API
