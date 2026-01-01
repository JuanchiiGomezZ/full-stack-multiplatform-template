# Features

## Feature Module Pattern

Each feature is a self-contained module in `src/features/[feature-name]/`.

### Structure

```
features/
└── auth/
    ├── components/       # UI components
    ├── hooks/            # React hooks
    ├── constants/        # Constants
    ├── services/         # API calls
    ├── stores/           # Zustand stores
    ├── types/            # TypeScript types
    ├── utils/            # Helpers
    └── index.ts          # Public API
```

### Public API (`index.ts`)

Only export what other features need:

```typescript
// features/auth/index.ts

// Hooks
export { useAuth, authKeys } from "./hooks/useAuth";

// Services
export { authService } from "./services/auth.service";

// Stores
export { useAuthStore } from "./stores/auth.store";

// Types
export type { User, LoginCredentials } from "./types/auth.types";
```

### Usage from Other Features

```typescript
// ✅ Correct - import from public API
import { useAuth, User } from "@features/auth";

// ❌ Wrong - don't reach into internals
import { useAuth } from "@features/auth/hooks/useAuth";
```

## Creating a New Feature

1. Create folder: `src/features/[feature-name]/`
2. Add subfolders as needed
3. Create `index.ts` with public exports
4. Add feature-specific pages in `src/app/[locale]/...`

## Feature Guidelines

- Features are independent modules
- Import only from `@shared/*` or own directory
- Cross-feature imports via public API only
- Keep services thin (API calls only)
- Business logic in hooks
