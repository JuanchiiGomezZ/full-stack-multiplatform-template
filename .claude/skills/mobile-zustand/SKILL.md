---
name: mobile-zustand
description: >
  Implements Zustand state management with persist middleware.
  Trigger: When creating stores, managing client state, or persisting data.
license: MIT
metadata:
  author: juanma-gomez
  version: "1.0"
  scope: [mobile]
  auto_invoke: "zustand, store, state, persist, client state"
allowed-tools: Read, Edit, Write, Glob, Grep
---

## When to Use

- Creating client-side state stores
- Managing UI state (modals, selections)
- Persisting user preferences
- Auth state management
- Any local state that isn't server data

---

## Critical Rules - NON-NEGOTIABLE

### State Type

- **ALWAYS**: Zustand for client state (auth, UI, preferences)
- **ALWAYS**: React Query for server state (API data)
- **NEVER**: Mix client and server state in same store
- **NEVER**: Store API responses in Zustand

### Store Structure

- **ALWAYS**: Define interface with state and actions
- **ALWAYS**: Create selectors for performance
- **ALWAYS**: Use `persist` middleware when needed
- **NEVER**: Access entire store, use selectors

### Persistence

- **ALWAYS**: `zustandStorage` for general data
- **ALWAYS**: SecureStore adapter for sensitive data
- **ALWAYS**: Use `partialize` to select what to persist
- **NEVER**: Persist sensitive data with MMKV

---

## Decision Tree

```
Auth tokens/credentials? → Zustand + SecureStore persist
UI state (modals, tabs)? → Zustand (no persist)
User preferences? → Zustand + MMKV persist
Server data? → React Query (NOT Zustand)
Form state? → React Hook Form (NOT Zustand)
```

---

## Workflow

### 1. Create Store File

**File:** `features/{name}/stores/{name}.store.ts`

### 2. Define Interface

```typescript
interface StoreState {
  // State
  value: string;
  // Actions
  setValue: (value: string) => void;
}
```

### 3. Create Store

```typescript
export const useStore = create<StoreState>()(...);
```

### 4. Create Selectors

```typescript
export const selectValue = (state: StoreState) => state.value;
```

---

## Code Examples

### Basic Store

```typescript
import { create } from 'zustand';

interface UIState {
  isModalOpen: boolean;
  selectedTab: number;
  openModal: () => void;
  closeModal: () => void;
  setTab: (tab: number) => void;
}

export const useUIStore = create<UIState>((set) => ({
  isModalOpen: false,
  selectedTab: 0,
  openModal: () => set({ isModalOpen: true }),
  closeModal: () => set({ isModalOpen: false }),
  setTab: (selectedTab) => set({ selectedTab }),
}));

// Selectors
export const selectIsModalOpen = (state: UIState) => state.isModalOpen;
export const selectSelectedTab = (state: UIState) => state.selectedTab;
```

### Store with MMKV Persist

```typescript
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { zustandStorage } from '@/shared/utils/storage';

interface SettingsState {
  theme: 'light' | 'dark' | 'system';
  language: string;
  notifications: boolean;
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  setLanguage: (language: string) => void;
  setNotifications: (enabled: boolean) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      theme: 'system',
      language: 'en',
      notifications: true,
      setTheme: (theme) => set({ theme }),
      setLanguage: (language) => set({ language }),
      setNotifications: (notifications) => set({ notifications }),
    }),
    {
      name: 'settings-storage',
      storage: createJSONStorage(() => zustandStorage),
    }
  )
);

// Selectors
export const selectTheme = (state: SettingsState) => state.theme;
export const selectLanguage = (state: SettingsState) => state.language;
```

### Auth Store with SecureStore

```typescript
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import * as SecureStore from 'expo-secure-store';
import { secureStorageApi } from '@/shared/utils/storage';
import type { User } from '../types';

const createSecureStorage = () => ({
  getItem: async (name: string): Promise<string | null> => {
    return await SecureStore.getItemAsync(name);
  },
  setItem: async (name: string, value: string): Promise<void> => {
    await SecureStore.setItemAsync(name, value);
  },
  removeItem: async (name: string): Promise<void> => {
    await SecureStore.deleteItemAsync(name);
  },
});

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  setLoading: (loading: boolean) => void;
  login: (user: User, accessToken: string, refreshToken: string) => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: true,

      setUser: (user) => set({ user }),
      setToken: (token) => set({ token }),
      setLoading: (isLoading) => set({ isLoading }),

      login: async (user, accessToken, refreshToken) => {
        await secureStorageApi.setAccessToken(accessToken);
        await secureStorageApi.setRefreshToken(refreshToken);
        set({ user, token: accessToken, isAuthenticated: true });
      },

      logout: async () => {
        await secureStorageApi.clearAuthData();
        set({ user: null, token: null, isAuthenticated: false });
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => createSecureStorage()),
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

// Selectors
export const selectUser = (state: AuthState) => state.user;
export const selectIsAuthenticated = (state: AuthState) => state.isAuthenticated;
export const selectIsLoading = (state: AuthState) => state.isLoading;
export const selectAuthActions = (state: AuthState) => ({
  login: state.login,
  logout: state.logout,
  setUser: state.setUser,
  setLoading: state.setLoading,
});
```

### Using Selectors in Components

```typescript
// ✅ CORRECT - Using selector
function UserInfo() {
  const user = useAuthStore(selectUser);
  const isAuthenticated = useAuthStore(selectIsAuthenticated);

  return isAuthenticated ? <Text>{user?.name}</Text> : null;
}

// ❌ WRONG - Using entire store
function UserInfo() {
  const { user, isAuthenticated } = useAuthStore(); // Re-renders on ANY change

  return isAuthenticated ? <Text>{user?.name}</Text> : null;
}
```

### Accessing Store Outside Components

```typescript
// Get current state
const currentUser = useAuthStore.getState().user;

// Update state
useAuthStore.getState().setUser(newUser);

// Subscribe to changes
const unsubscribe = useAuthStore.subscribe(
  (state) => state.user,
  (user) => console.log('User changed:', user)
);
```

---

## Commands

```bash
# Create store file
touch mobile/src/features/{name}/stores/{name}.store.ts

# Check auth store pattern
cat mobile/src/features/auth/stores/auth.store.ts
```

---

## Checklist

- [ ] Interface defined with state and actions
- [ ] Selectors created for all state access
- [ ] Using `persist` with appropriate storage
- [ ] `partialize` used to select persisted fields
- [ ] Sensitive data uses SecureStore adapter
- [ ] Components use selectors, not entire store
- [ ] No API data stored (use React Query)

---

## Resources

- **Auth Store**: `mobile/src/features/auth/stores/auth.store.ts`
- **Storage Utils**: `mobile/src/shared/utils/storage.ts`
- **Zustand Docs**: https://docs.pmnd.rs/zustand
