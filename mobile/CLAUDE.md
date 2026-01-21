# Mobile - React Native Expo

> **Skills Reference**: Use granular skills for specific patterns. Invoke skill BEFORE implementation.

### Auto-invoke Skills

| Action                                 | Skill               | Trigger Keywords                           |
| -------------------------------------- | ------------------- | ------------------------------------------ |
| Creating features, modules, structure  | `mobile-feature`    | feature, module, screen, estructura        |
| Navigation, routes, layouts            | `mobile-navigation` | navigation, router, route, layout, tabs    |
| Styling, theme, colors, spacing        | `mobile-unistyles`  | style, theme, color, spacing, dark mode    |
| Storage, persistence                   | `mobile-storage`    | storage, mmkv, securestore, persist, token |
| Zustand stores, client state           | `mobile-zustand`    | zustand, store, state, persist             |
| API calls, React Query                 | `mobile-query`      | query, mutation, api, fetch, cache         |
| Forms, validation                      | `mobile-forms`      | form, validation, zod, input, submit       |
| Translations, i18n                     | `mobile-i18n`       | i18n, translation, language, locale, text  |
| Complete implementation (all patterns) | `mobile-execute`    | complex feature, full implementation       |

---

## CRITICAL RULES - NON-NEGOTIABLE

### Feature-First Architecture

- **ALWAYS**: Create features in `src/features/{feature-name}/`
- **ALWAYS**: Structure: `components/`, `hooks/`, `services/`, `stores/`, `types/`, `schemas/`
- **ALWAYS**: Export from `index.ts` barrel file
- **NEVER**: Put feature logic in `shared/` or `app/`

### Styling (Unistyles)

- **ALWAYS**: Use `StyleSheet.create` from `react-native-unistyles`
- **ALWAYS**: Access theme via `theme` parameter in stylesheet function
- **ALWAYS**: Use `theme.spacing()`, `theme.colors.*`, `theme.radius.*`
- **ALWAYS**: Use `style` prop directly with stylesheet object
- **OPTIONAL**: Use `useUnistyles` hook when needing theme in component logic
- **NEVER**: Inline styles, hardcoded colors

### Storage Layer

- **ALWAYS**: MMKV for general data (preferences, cache, i18n)
- **ALWAYS**: SecureStore for sensitive data (tokens, credentials)
- **ALWAYS**: Use storage utilities from `@/shared/utils/storage`
- **NEVER**: Store sensitive data in MMKV

### State Management

- **ALWAYS**: Zustand for client state (auth, UI, preferences)
- **ALWAYS**: React Query for server state (API data)
- **ALWAYS**: Use `persist` middleware with appropriate storage
- **ALWAYS**: Define selectors for better performance
- **NEVER**: Mix client and server state in same store

### Navigation (Expo Router)

- **ALWAYS**: File-based routing in `src/app/`
- **ALWAYS**: Use route groups: `(auth)`, `(tabs)`, `(modals)`
- **ALWAYS**: Define `_layout.tsx` for each group
- **NEVER**: Use imperative navigation for initial routes

### API Integration

- **ALWAYS**: Define services in `features/{name}/services/`
- **ALWAYS**: Use React Query hooks in `features/{name}/hooks/`
- **ALWAYS**: Handle loading, error, and success states
- **NEVER**: Make API calls directly in components

### Forms

- **ALWAYS**: React Hook Form + Zod validation
- **ALWAYS**: Define schemas in `features/{name}/schemas/`
- **ALWAYS**: Use controlled components with `Controller`
- **NEVER**: Manual form state management

### i18n

- **ALWAYS**: Define translations per feature in `features/{name}/i18n/`
- **ALWAYS**: Use `useTranslation` hook with namespace
- **ALWAYS**: Follow key pattern: `{namespace}.{section}.{key}`
- **NEVER**: Hardcode user-facing strings

---

## DECISION TREES

### New Feature

```
Need new screen? → Create in src/features/{name}/
Need API data? → React Query hook
Need local state? → Zustand store with persist
Need form? → React Hook Form + Zod schema
```

### Storage Choice

```
Sensitive data (tokens)? → SecureStore
User preferences? → MMKV
Cache data? → MMKV
i18n language? → MMKV
```

### State Type

```
From API/server? → React Query
UI state (modals, tabs)? → Zustand
Form values? → React Hook Form
Auth tokens? → Zustand + SecureStore persist
```

---

## TECH STACK

Expo 54 | React Native 0.81 | React 19 | TypeScript 5.9

**Navigation:** Expo Router 6
**Styling:** react-native-unistyles 3
**State:** Zustand 5 + React Query 5
**Forms:** React Hook Form 7 + Zod 4
**Storage:** MMKV 3 + SecureStore 15
**i18n:** i18next + react-i18next
**UI:** @gorhom/bottom-sheet, @shopify/flash-list

---

## PROJECT STRUCTURE

```
mobile/src/
├── app/                    # Expo Router (file-based routing)
│   ├── _layout.tsx         # Root layout + providers
│   ├── index.tsx           # Entry point / redirect
│   ├── (auth)/             # Auth flow screens
│   │   ├── _layout.tsx
│   │   ├── login.tsx
│   │   └── register.tsx
│   ├── (tabs)/             # Main app (tab navigation)
│   │   └── _layout.tsx
│   └── providers.tsx       # App providers wrapper
│
├── features/               # Feature modules
│   └── auth/               # Auth feature (canonical example)
│       ├── components/     # Feature-specific components
│       ├── hooks/          # React Query + custom hooks
│       ├── services/       # API calls (axios)
│       ├── stores/         # Zustand stores
│       ├── types/          # TypeScript types
│       ├── schemas/        # Zod validation schemas
│       └── index.ts        # Public exports
│
├── shared/                 # Shared resources
│   ├── components/
│   │   ├── ui/             # Base UI components
│   │   │   ├── Button.tsx
│   │   │   ├── Text.tsx
│   │   │   ├── TextInput.tsx
│   │   │   └── ...
│   │   └── ThemeSwitcher.tsx
│   ├── styles/             # Unistyles configuration
│   │   ├── theme.ts        # Light/dark themes
│   │   ├── unistyles.ts    # Unistyles setup
│   │   └── breakpoints.ts
│   └── utils/
│       ├── storage.ts      # MMKV + SecureStore helpers
│       └── format.ts       # Formatting utilities
│
└── constants/              # App-wide constants
    └── index.ts
```

**Canonical examples:**

- Feature structure: `src/features/auth/`
- UI components: `src/shared/components/ui/`
- Theme setup: `src/shared/styles/theme.ts`
- Store pattern: `src/features/auth/stores/auth.store.ts`

---

## COMMANDS

```bash
# Development
npm run start              # Start Expo dev server (port 8082)
npm run ios                # Run on iOS simulator
npm run android            # Run on Android emulator

# Build
npm run prebuild           # Generate native projects
npx eas build              # Build with EAS

# Code Quality
npm run lint               # ESLint check
npm run format             # Prettier check
npm run format:fix         # Prettier fix
```

---

## QA CHECKLIST

- [ ] Feature follows `features/{name}/` structure
- [ ] Components use Unistyles (no inline styles)
- [ ] Theme colors used (no hardcoded colors)
- [ ] Sensitive data in SecureStore
- [ ] API calls through React Query hooks
- [ ] Forms use React Hook Form + Zod
- [ ] All strings translated (no hardcoded text)
- [ ] Loading and error states handled
- [ ] TypeScript strict mode passes
- [ ] `npm run lint` passes

---

## NAMING CONVENTIONS

| Entity         | Pattern             | Example           |
| -------------- | ------------------- | ----------------- |
| Feature folder | `kebab-case`        | `user-profile/`   |
| Component file | `PascalCase.tsx`    | `UserCard.tsx`    |
| Hook file      | `camelCase.ts`      | `useAuth.ts`      |
| Store file     | `{name}.store.ts`   | `auth.store.ts`   |
| Service file   | `{name}.service.ts` | `auth.service.ts` |
| Schema file    | `{name}.schema.ts`  | `login.schema.ts` |
| Type file      | `{name}.types.ts`   | `auth.types.ts`   |
| Screen file    | `kebab-case.tsx`    | `login.tsx`       |

---

## CODE PATTERNS

### Unistyles Component

```typescript
import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

export function Card({ children }) {
  return <View style={styles.container}>{children}</View>;
}

const styles = StyleSheet.create((theme) => ({
  container: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.md,
    padding: theme.spacing(4),
  },
}));
```

### Zustand Store with SecureStore

```typescript
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import * as SecureStore from "expo-secure-store";

const secureStorage = {
  getItem: async (name: string) => await SecureStore.getItemAsync(name),
  setItem: async (name: string, value: string) => await SecureStore.setItemAsync(name, value),
  removeItem: async (name: string) => await SecureStore.deleteItemAsync(name),
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      setToken: (token) => set({ token }),
    }),
    {
      name: "auth-storage",
      storage: createJSONStorage(() => secureStorage),
    }
  )
);
```

### React Query Hook

```typescript
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { userService } from "../services/user.service";

export function useUser(id: string) {
  return useQuery({
    queryKey: ["user", id],
    queryFn: () => userService.getById(id),
    enabled: !!id,
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: userService.update,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["user", variables.id] });
    },
  });
}
```
