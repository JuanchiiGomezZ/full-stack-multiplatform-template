---
name: mobile-storage
description: >
  Implements MMKV and SecureStore storage patterns.
  Trigger: When storing data locally, persisting state, or handling tokens.
license: MIT
metadata:
  author: juanma-gomez
  version: "1.0"
  scope: [mobile]
  auto_invoke: "storage, mmkv, securestore, persist, token, cache"
allowed-tools: Read, Edit, Write, Glob, Grep
---

## When to Use

- Storing user preferences
- Caching data locally
- Persisting auth tokens
- Storing sensitive credentials
- Creating Zustand storage adapters

---

## Critical Rules - NON-NEGOTIABLE

### Storage Choice

- **ALWAYS**: MMKV for general data (fast, synchronous)
- **ALWAYS**: SecureStore for sensitive data (encrypted, async)
- **NEVER**: Store tokens or credentials in MMKV
- **NEVER**: Store large data in SecureStore

### Usage

- **ALWAYS**: Use storage utilities from `@/shared/utils/storage`
- **ALWAYS**: Define keys in `constants/index.ts`
- **NEVER**: Create new storage instances
- **NEVER**: Hardcode storage keys

---

## Decision Tree

```
Auth tokens? → SecureStore (secureStorageApi)
User credentials? → SecureStore
Theme preference? → MMKV (storage)
Language setting? → MMKV
Cache data? → MMKV
Feature flags? → MMKV
Zustand persist? → zustandStorage (MMKV adapter)
```

---

## Workflow

### 1. Define Storage Keys

**File:** `constants/index.ts`

```typescript
export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
  USER: 'user',
  THEME: 'app_theme',
  LANGUAGE: 'language',
  ONBOARDING_COMPLETED: 'onboarding_completed',
} as const;
```

### 2. Choose Storage Type

- Sensitive → `secureStorageApi`
- General → `storage`
- Zustand → `zustandStorage`

### 3. Use Appropriate API

Import from `@/shared/utils/storage`.

---

## Code Examples

### MMKV (General Data)

```typescript
import { storage } from '@/shared/utils/storage';

// String
storage.set('key', 'value');
const value = storage.getString('key');

// Boolean
storage.setBoolean('enabled', true);
const enabled = storage.getBoolean('enabled');

// Object
storage.setObject('userPrefs', { theme: 'dark', lang: 'en' });
const prefs = storage.getObject<UserPrefs>('userPrefs');

// Remove
storage.remove('key');

// Clear all
storage.clearAll();

// Get all keys
const keys = storage.getAllKeys();
```

### SecureStore (Sensitive Data)

```typescript
import { secureStorageApi } from '@/shared/utils/storage';

// Tokens
await secureStorageApi.setAccessToken(token);
await secureStorageApi.setRefreshToken(refreshToken);
const accessToken = await secureStorageApi.getAccessToken();
const refreshToken = await secureStorageApi.getRefreshToken();
await secureStorageApi.removeAccessToken();
await secureStorageApi.removeRefreshToken();

// User data
await secureStorageApi.setUser(JSON.stringify(userData));
const userData = await secureStorageApi.getUser();
await secureStorageApi.removeUser();

// Clear all auth data
await secureStorageApi.clearAuthData();
```

### Zustand Storage Adapter

```typescript
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { zustandStorage } from '@/shared/utils/storage';

interface SettingsState {
  theme: 'light' | 'dark' | 'system';
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      theme: 'system',
      setTheme: (theme) => set({ theme }),
    }),
    {
      name: 'settings-storage',
      storage: createJSONStorage(() => zustandStorage),
    }
  )
);
```

### SecureStore Adapter for Zustand

```typescript
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import * as SecureStore from 'expo-secure-store';

const secureStorage = {
  getItem: async (name: string): Promise<string | null> => {
    return await SecureStore.getItemAsync(name);
  },
  setItem: async (name: string, value: string): Promise<void> => {
    await SecureStore.setItemAsync(name, value);
  },
  removeItem: async (name: string): Promise<void> => {
    await SecureStore.deleteItemAsync(name);
  },
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      setToken: (token) => set({ token }),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => secureStorage),
      partialize: (state) => ({ token: state.token }),
    }
  )
);
```

### Storage Utility Implementation

**File:** `shared/utils/storage.ts`

```typescript
import { MMKV } from 'react-native-mmkv';
import * as SecureStore from 'expo-secure-store';
import { STORAGE_KEYS } from '@/constants';

// MMKV Instance
export const storage = new MMKV();

// Extended MMKV API
export const mmkvStorage = {
  set: (key: string, value: string) => storage.set(key, value),
  getString: (key: string) => storage.getString(key),
  setBoolean: (key: string, value: boolean) => storage.set(key, value),
  getBoolean: (key: string) => storage.getBoolean(key),
  setObject: <T>(key: string, value: T) => storage.set(key, JSON.stringify(value)),
  getObject: <T>(key: string): T | null => {
    const value = storage.getString(key);
    return value ? JSON.parse(value) : null;
  },
  remove: (key: string) => storage.delete(key),
  clearAll: () => storage.clearAll(),
  getAllKeys: () => storage.getAllKeys(),
};

// SecureStore API
export const secureStorageApi = {
  setAccessToken: (token: string) =>
    SecureStore.setItemAsync(STORAGE_KEYS.ACCESS_TOKEN, token),
  getAccessToken: () =>
    SecureStore.getItemAsync(STORAGE_KEYS.ACCESS_TOKEN),
  removeAccessToken: () =>
    SecureStore.deleteItemAsync(STORAGE_KEYS.ACCESS_TOKEN),

  setRefreshToken: (token: string) =>
    SecureStore.setItemAsync(STORAGE_KEYS.REFRESH_TOKEN, token),
  getRefreshToken: () =>
    SecureStore.getItemAsync(STORAGE_KEYS.REFRESH_TOKEN),
  removeRefreshToken: () =>
    SecureStore.deleteItemAsync(STORAGE_KEYS.REFRESH_TOKEN),

  setUser: (user: string) =>
    SecureStore.setItemAsync(STORAGE_KEYS.USER, user),
  getUser: () =>
    SecureStore.getItemAsync(STORAGE_KEYS.USER),
  removeUser: () =>
    SecureStore.deleteItemAsync(STORAGE_KEYS.USER),

  clearAuthData: async () => {
    await SecureStore.deleteItemAsync(STORAGE_KEYS.ACCESS_TOKEN);
    await SecureStore.deleteItemAsync(STORAGE_KEYS.REFRESH_TOKEN);
    await SecureStore.deleteItemAsync(STORAGE_KEYS.USER);
  },
};

// Zustand MMKV Adapter
export const zustandStorage = {
  getItem: (name: string) => storage.getString(name) ?? null,
  setItem: (name: string, value: string) => storage.set(name, value),
  removeItem: (name: string) => storage.delete(name),
};
```

---

## Commands

```bash
# Check storage utilities
cat mobile/src/shared/utils/storage.ts

# Check constants
cat mobile/src/constants/index.ts
```

---

## Checklist

- [ ] Storage keys defined in constants
- [ ] Sensitive data in SecureStore
- [ ] General data in MMKV
- [ ] Using storage utilities, not direct instances
- [ ] Zustand stores use appropriate adapter
- [ ] Error handling for async operations

---

## Resources

- **Storage Utils**: `mobile/src/shared/utils/storage.ts`
- **Constants**: `mobile/src/constants/index.ts`
- **Auth Store Example**: `mobile/src/features/auth/stores/auth.store.ts`
