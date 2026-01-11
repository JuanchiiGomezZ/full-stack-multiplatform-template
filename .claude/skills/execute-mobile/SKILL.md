---
name: execute-mobile
description: Use when implementing features, fixing bugs, or refactoring in React Native Expo mobile app for iOS and Android. Requires feature-first architecture, Unistyles theming, Zustand + React Query state, and Expo Router navigation. For new UI, use frontend-design:frontend-design first. For new dependencies, consult Context7 MCP.
---

# React Native Expo Senior Developer Skill

## Overview

This skill provides comprehensive guidance for implementing features in the project's React Native Expo mobile application. It documents the established architecture patterns, conventions, and best practices that should be followed for all mobile development tasks.

**Key capabilities:**
- Create new features following the feature-first pattern
- Implement screens with proper navigation and state management
- Handle data with React Query (server state) and Zustand (client state)
- Style with Unistyles theme system
- Navigate with Expo Router file-based routing
- Persist data with MMKV and SecureStore
- Internationalize with i18next + MMKV
- Validate forms with React Hook Form + Zod

## Purpose & Scope

**This skill is for IMPLEMENTATION only.** It is NOT for writing plans.

| Use Case | Skill to Use |
|----------|--------------|
| Planning a new feature, defining requirements | `superpowers:writing-plans` |
| Exploring ideas and clarifying scope | `superpowers:brainstorming` |
| Designing new UI screens | `frontend-design:frontend-design` |
| Researching new libraries | Context7 MCP or Web Search |
| **Implementing mobile features** | **`execute-mobile`** |

**When to invoke `execute-mobile`:**
- Creating a new feature module
- Implementing new screens
- Adding form validation
- Integrating new API endpoints
- Fixing bugs in mobile code
- Refactoring mobile components
- Any mobile coding task

**When NOT to use:**
- Writing implementation plans (use `writing-plans`)
- Exploring requirements (use `brainstorming`)
- Designing UI (use `frontend-design:frontend-design`)
- Researching new technologies (use Context7 MCP)

**IMPORTANT:** This skill assumes iOS and Android compatibility. Always verify cross-platform compatibility when using native modules.

---

## Architecture Overview

The mobile app follows a **feature-first architecture** with clear separation of concerns:

```
mobile/src/
├── app/                    # Expo Router, layouts, providers
│   ├── _layout.tsx         # Root layout (providers, gesture handler)
│   ├── index.tsx           # Auth redirect based on state
│   ├── providers.tsx       # Global providers (QueryClient, Theme, Auth)
│   ├── (auth)/             # Public routes (no header)
│   │   ├── _layout.tsx     # Auth stack layout
│   │   ├── login/
│   │   └── register/
│   └── (tool)/             # Protected routes (tabs)
│       ├── _layout.tsx     # Protected tabs + auth check
│       ├── dashboard/
│       └── settings/
├── features/               # Feature modules (feature-first)
│   └── auth/               # Auth feature (canonical example)
│       ├── components/     # Feature-specific components
│       ├── hooks/          # Custom hooks (useAuth, etc.)
│       ├── schemas/        # Zod validation schemas
│       ├── services/       # API service layer
│       ├── stores/         # Zustand stores
│       ├── types/          # TypeScript definitions
│       ├── utils/          # Utility functions
│       └── index.ts        # Public exports
├── shared/                 # Shared resources
│   ├── components/         # Reusable UI components
│   │   ├── ui/             # Base UI components (Button, Input, etc.)
│   │   └── common/         # Shared components (ScreenWrapper, etc.)
│   ├── hooks/              # Shared hooks
│   ├── i18n/               # i18n configuration
│   ├── lib/                # Library configurations (axios, etc.)
│   ├── locales/            # Translation files (en/, es/)
│   ├── styles/             # Unistyles theme configuration
│   └── utils/              # Shared utilities (storage, etc.)
├── constants/              # App constants
└── stores/                 # Global stores (if needed)
```

### Directory Responsibilities

**App (`app/`):** Expo Router file-based routing
- `_layout.tsx` - Root layout with providers and gesture handler
- `index.tsx` - Initial redirect based on auth state
- `(auth)/` - Public authentication routes
- `(tool)/` - Protected routes with tabs

**Features (`features/`):** Feature-specific code organized by domain
- Each feature is self-contained with all its dependencies
- Follows canonical pattern from `auth` feature
- Co-located tests, types, hooks, services

**Shared (`shared/`):** Cross-cutting resources
- `components/ui/` - Base UI components from shadcn/ui patterns
- `components/common/` - Shared composite components
- `lib/` - Third-party library configurations
- `styles/` - Unistyles theme configuration
- `utils/` - Shared utilities (storage, helpers)

**Constants (`constants/`):** App-wide constants
- API URL configuration
- Storage keys
- Other app-wide values

### Key Files Reference

| File | Purpose |
|------|---------|
| `app/_layout.tsx` | Root layout with GestureHandler, BottomSheet, Providers, Toast |
| `app/index.tsx` | Auth redirect with navigation state check |
| `app/(tool)/_layout.tsx` | Protected layout with Tabs, auth check, logout |
| `shared/lib/api.ts` | Axios instance with auth interceptor and token refresh |
| `shared/utils/storage.ts` | MMKV + SecureStore abstractions |
| `shared/styles/unistyles.ts` | Unistyles theme configuration |
| `features/auth/stores/auth.store.ts` | Auth state with Zustand + SecureStore |
| `features/auth/hooks/useAuth.ts` | Auth React Query hooks |
| `features/auth/services/auth.service.ts` | Auth API service |
| `constants/index.ts` | App constants and storage keys |

---

## Key Patterns Implemented

### Feature-First Architecture

Every feature follows the same self-contained structure:

```
features/{feature-name}/
├── components/      # Only used by this feature
│   └── {Feature}Component.tsx
├── hooks/           # Custom hooks specific to feature
│   └── use{Feature}.ts
├── schemas/         # Zod validation schemas
│   └── {feature}.schema.ts
├── services/        # API calls
│   └── {feature}.service.ts
├── stores/          # Zustand stores
│   └── {feature}.store.ts
├── types/           # TypeScript definitions
│   └── {feature}.types.ts
├── utils/           # Feature-specific utilities
│   └── {feature}.utils.ts
└── index.ts         # Public exports (barrel file)
```

**Principles:**
- Components in `features/` = feature-specific
- Components in `shared/components/ui/` = reusable base components
- Never mix - if only for auth, put in `features/auth/`

**Index.ts pattern:**
```typescript
// features/auth/index.ts
export * from './types';
export * from './schemas';
export * from './services';
export * from './hooks';
export * from './stores';
export * from './components';
```

### Storage Layer - MMKV + SecureStore

The app uses two-tier storage with specific use cases:

**1. MMKV (General Data) - Fast, synchronous**

Used for: Theme preferences, onboarding status, feature flags, cache data

```typescript
import { storage } from '@/shared/utils/storage';

// Store object
storage.setObject('userPreferences', { theme: 'dark', language: 'en' });

// Retrieve object
const prefs = storage.getObject<UserPreferences>('userPreferences');

// String operations
storage.set('key', 'value');
const value = storage.getString('key');

// Boolean operations
storage.setBoolean('enabled', true);
const enabled = storage.getBoolean('enabled');

// Remove
storage.remove('key');

// Clear all
storage.clearAll();
```

**2. SecureStore (Sensitive Data) - Encrypted, async**

Used for: Access tokens, refresh tokens, user credentials

```typescript
import { secureStorageApi } from '@/shared/utils/storage';

// Tokens
await secureStorageApi.setAccessToken(token);
await secureStorageApi.setRefreshToken(refreshToken);
const accessToken = await secureStorageApi.getAccessToken();
await secureStorageApi.removeAccessToken();

// User data (encrypted)
await secureStorageApi.setUser(JSON.stringify(userData));
const userData = await secureStorageApi.getUser();

// Clear all auth data on logout
await secureStorageApi.clearAuthData();
```

**3. Zustand Storage Adapter**

For persisting Zustand stores with MMKV:

```typescript
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { zustandStorage } from '@/shared/utils/storage';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  login: (user: User, token: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      login: (user, token) => set({ user, isAuthenticated: true }),
      logout: () => set({ user: null, isAuthenticated: false }),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => zustandStorage),
      partialize: (state) => ({ user: state.user }),
    }
  )
);
```

**Storage Constants:**

```typescript
// constants/index.ts
export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
  USER: 'user',
  THEME: 'app_theme',
  LANGUAGE: 'language',
  ONBOARDING_COMPLETED: 'onboarding_completed',
} as const;

export const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';
```

### API Layer - Axios with Interceptors

The app uses a pre-configured Axios instance with automatic auth and token refresh:

```typescript
// shared/lib/api.ts
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { API_URL, STORAGE_KEYS } from '@/constants';

export const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor - add auth token
api.interceptors.request.use(
  async (config) => {
    const token = await SecureStore.getItemAsync(STORAGE_KEYS.ACCESS_TOKEN);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle 401 with token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refreshToken = await SecureStore.getItemAsync(STORAGE_KEYS.REFRESH_TOKEN);
        if (refreshToken) {
          const response = await axios.post(`${API_URL}/auth/refresh`, { refreshToken });
          const { accessToken, refreshToken: newRefreshToken } = response.data;
          await SecureStore.setItemAsync(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
          await SecureStore.setItemAsync(STORAGE_KEYS.REFRESH_TOKEN, newRefreshToken);
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        await SecureStore.deleteItemAsync(STORAGE_KEYS.ACCESS_TOKEN);
        await SecureStore.deleteItemAsync(STORAGE_KEYS.REFRESH_TOKEN);
      }
    }
    return Promise.reject(error);
  }
);
```

**NVER create a new axios instance.** Always use `api` from `@/shared/lib/api`.

### Service Layer Pattern

Each feature has its own service file for API calls:

```typescript
// features/products/services/products.service.ts
import { api } from '@/shared/lib/api';
import type { Product, CreateProductDto, UpdateProductDto } from '../types';

export const productsApi = {
  getAll: (params?: { page?: number; limit?: number; search?: string }) =>
    api.get<Product[]>('/products', { params }),

  getById: (id: string) =>
    api.get<Product>(`/products/${id}`),

  create: (data: CreateProductDto) =>
    api.post<Product>('/products', data),

  update: (id: string, data: UpdateProductDto) =>
    api.patch<Product>(`/products/${id}`, data),

  delete: (id: string) =>
    api.delete<void>(`/products/${id}`),
};
```

### React Query Patterns

Data fetching uses TanStack Query (React Query) with proper patterns:

```typescript
// features/products/hooks/useProducts.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productsApi } from '../services/products.service';
import { toast } from 'sonner';

// Query keys
export const productsQueryKeys = {
  all: ['products'] as const,
  lists: () => [...productsQueryKeys.all, 'list'] as const,
  list: (filters: ProductFilters) => [...productsQueryKeys.lists(), filters] as const,
  details: () => [...productsQueryKeys.all, 'detail'] as const,
  detail: (id: string) => [...productsQueryKeys.details(), id] as const,
};

// Data fetching
export function useProducts(filters?: ProductFilters) {
  return useQuery({
    queryKey: productsQueryKeys.list(filters || {}),
    queryFn: () => productsApi.getAll(filters),
  });
}

export function useProduct(id: string) {
  return useQuery({
    queryKey: productsQueryKeys.detail(id),
    queryFn: () => productsApi.getById(id),
    enabled: !!id,
  });
}

// Mutations with invalidation
export function useDeleteProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: productsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productsQueryKeys.all });
      toast.success('Product deleted');
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
}
```

### State Management - Zustand + React Query

The app uses a hybrid state management approach:

**Server State (React Query):**
- Data from API
- Automatic caching and refetching
- Optimistic updates
- Query invalidation

**Client State (Zustand):**
- Auth state (user, tokens, isAuthenticated)
- UI state (modals, theme preferences)
- Local preferences (filters, sorting)

**Auth Store Pattern:**

```typescript
// features/auth/stores/auth.store.ts
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import * as SecureStore from 'expo-secure-store';
import { secureStorageApi, zustandStorage } from '@/shared/utils/storage';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  // Actions
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  setLoading: (loading: boolean) => void;
  login: (user: User, accessToken: string, refreshToken: string) => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    async (set, get) => ({
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
      storage: createJSONStorage(() => zustandStorage),
      partialize: (state) => ({
        user: state.user,
      }),
    }
  )
);

// Selectors for performance
export const selectUser = (state: AuthState) => state.user;
export const selectIsAuthenticated = (state: AuthState) => state.isAuthenticated;
export const selectIsLoading = (state: AuthState) => state.isLoading;
```

### Navigation - Expo Router

The app uses Expo Router for file-based routing with layout groups:

**Root Layout:**

```typescript
// app/_layout.tsx
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { Stack } from "expo-router";
import { Toast } from "sonner-native";
import Providers from "./providers";

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <BottomSheetModalProvider>
        <Providers>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="(tool)" />
          </Stack>
          <Toast />
        </Providers>
      </BottomSheetModalProvider>
    </GestureHandlerRootView>
  );
}
```

**Initial Auth Redirect:**

```typescript
// app/index.tsx
import { useEffect, useState, useCallback } from "react";
import { router, useRootNavigationState } from "expo-router";
import { useAuthStore, selectIsAuthenticated } from "@/features/auth/stores/auth.store";
import { ScreenWrapper } from "@/shared/components/ui";

export default function Index() {
  const isAuthenticated = useAuthStore(selectIsAuthenticated);
  const isLoading = useAuthStore((state) => state.isLoading);
  const rootNavigationState = useRootNavigationState();
  const [isLayoutReady, setIsLayoutReady] = useState(false);

  // Wait for navigator to be ready
  const onNavigationStateChange = useCallback(() => {
    if (rootNavigationState?.key != null) {
      setIsLayoutReady(true);
    }
  }, [rootNavigationState?.key]);

  useEffect(() => {
    onNavigationStateChange();
  }, [onNavigationStateChange]);

  useEffect(() => {
    if (!isLayoutReady || isLoading) return;

    const timer = setTimeout(() => {
      router.replace(isAuthenticated ? "/(tool)/dashboard" : "/(auth)/login");
    }, 100);

    return () => clearTimeout(timer);
  }, [isLayoutReady, isLoading, isAuthenticated]);

  return <ScreenWrapper loading centered />;
}
```

**Auth Group (Public Routes):**

```typescript
// app/(auth)/_layout.tsx
import { Stack } from "expo-router";

export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'fade' }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
    </Stack>
  );
}
```

**Tool Group (Protected Routes with Auth Check in Layout):**

```typescript
// app/(tool)/_layout.tsx
import { useEffect } from 'react';
import { router, Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useLogout } from '@/features/auth/hooks/useAuth';
import { useAuthStore, selectIsAuthenticated, selectIsLoading } from '@/features/auth/stores/auth.store';

export default function ToolLayout() {
  const logoutMutation = useLogout();
  const isAuthenticated = useAuthStore(selectIsAuthenticated);
  const isLoading = useAuthStore(selectIsLoading);

  useEffect(() => {
    // Redirect to login if not authenticated
    if (!isLoading && !isAuthenticated) {
      router.replace('/(auth)/login');
    }
  }, [isLoading, isAuthenticated]);

  // Don't render anything if loading or not authenticated
  if (isLoading || !isAuthenticated) {
    return null;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        headerRight: () => (
          <Ionicons
            name="log-out-outline"
            size={24}
            color="#ff3b30"
            style={{ marginRight: 15 }}
            onPress={() => {
              if (!logoutMutation.isPending) {
                logoutMutation.mutate();
              }
            }}
          />
        ),
        tabBarStyle: {
          borderTopWidth: 1,
          borderTopColor: '#eee',
        },
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="settings" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
```

**IMPORTANT:** Auth check goes in the _layout, NOT in a ProtectedRoute component. This is the established pattern.

**Dynamic Routes:**
```typescript
// app/(tool)/products/[id]/index.tsx
import { useLocalSearchParams } from 'expo-router';

export default function ProductDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  // Use id to fetch product data
}
```

### UI Components - Shared Base Components

The app uses base UI components from `shared/components/ui/` that MUST be reused:

**Available Base Components:**
- `Button` - Action buttons with variants
- `TextInput` - Text input with label and error
- `ScreenWrapper` - Screen container with padding
- `Spinner` - Loading indicator
- `Card` - Card container
- `Modal` - Modal dialog
- And more...

**Using Base Components:**

```typescript
// ❌ WRONG - Creating from scratch
export function LoginForm() {
  return (
    <View>
      <TextInput style={styles.input} />
      <TouchableOpacity style={styles.button}>
        <Text>Login</Text>
      </TouchableOpacity>
    </View>
  );
}

// ✅ CORRECT - Using base components
import { TextInput } from '@/shared/components/ui/text-input';
import { Button } from '@/shared/components/ui/button';
import { ScreenWrapper } from '@/shared/components/ui';

export function LoginForm() {
  return (
    <ScreenWrapper>
      <TextInput label="Email" />
      <TextInput label="Password" secureTextEntry />
      <Button>Login</Button>
    </ScreenWrapper>
  );
}
```

**Creating New Base Components:**

When a base component doesn't exist, create it in `shared/components/ui/`:

```typescript
// shared/components/ui/custom-component.tsx
import { View, Text, StyleSheet } from 'react-native';
import { useStyles } from 'react-native-unistyles';

interface CustomComponentProps {
  title: string;
  onPress: () => void;
}

export function CustomComponent({ title, onPress }: CustomComponentProps) {
  const { styles } = useStyles();
  return (
    <View style={styles.container}>
      <Text>{title}</Text>
    </View>
  );
}
```

### Unistyles Theme System

The app uses Unistyles for cross-platform styling with theme support:

**Theme Configuration:**

```typescript
// shared/styles/unistyles.ts
import { StyleSheet } from "react-native-unistyles";
import { themes } from "./theme";
import { breakpoints } from "./breakpoints";

type AppBreakpoints = typeof breakpoints;
type AppThemes = typeof themes;

declare module "react-native-unistyles" {
  export interface UnistylesThemes extends AppThemes {}
  export interface UnistylesBreakpoints extends AppBreakpoints {}
}

StyleSheet.configure({
  themes: { light: themes.light, dark: themes.dark },
  breakpoints,
  settings: { adaptiveThemes: true },
});
```

**Using Styles:**

```typescript
import { useStyles } from 'react-native-unistyles';

export function MyComponent() {
  const { styles, theme } = useStyles();
  return (
    <View style={styles.container}>
      <Text style={{ color: theme.colors.text }}>
        Hello
      </Text>
    </View>
  );
}
```

**NVER use StyleSheet from react-native directly.** Always use Unistyles with the theme.

### Forms - React Hook Form + Zod

Forms use React Hook Form with Zod validation:

```typescript
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { TextInput } from '@/shared/components/ui/text-input';
import { Button } from '@/shared/components/ui/button';

// Zod schema
const loginSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export function LoginForm() {
  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = (data: LoginFormData) => {
    console.log(data);
  };

  return (
    <Controller
      control={form.control}
      name="email"
      render={({ field: { value, onChange, onBlur } }) => (
        <TextInput
          label="Email"
          value={value}
          onChangeText={onChange}
          onBlur={onBlur}
          error={form.formState.errors.email?.message}
          keyboardType="email-address"
          autoCapitalize="none"
        />
      )}
    />
  );
}
```

### Internationalization - i18next + MMKV

The app uses i18next with MMKV storage for language preferences. Translation files are organized by namespace (feature/area) and language.

#### Complete Flow to Add New Translations

When adding translations for a new feature (e.g., `products`), follow this complete process:

**Step 1: Create Translation Files**

Create JSON files for each language in `shared/locales/{lang}/{namespace}.json`:

```json
// shared/locales/en/products.json
{
  "title": "Products",
  "create": "Create Product",
  "edit": "Edit Product",
  "delete": "Delete Product",
  "name": "Name",
  "price": "Price",
  "stock": "Stock",
  "save": "Save",
  "cancel": "Cancel",
  "form": {
    "errors": {
      "required": "This field is required",
      "invalid": "Invalid value"
    }
  },
  "list": {
    "empty": "No products found",
    "loading": "Loading products..."
  },
  "messages": {
    "created": "Product created successfully",
    "updated": "Product updated successfully",
    "deleted": "Product deleted successfully"
  }
}
```

```json
// shared/locales/es/products.json
{
  "title": "Productos",
  "create": "Crear Producto",
  "edit": "Editar Producto",
  "delete": "Eliminar Producto",
  "name": "Nombre",
  "price": "Precio",
  "stock": "Stock",
  "save": "Guardar",
  "cancel": "Cancelar",
  "form": {
    "errors": {
      "required": "Este campo es obligatorio",
      "invalid": "Valor inválido"
    }
  },
  "list": {
    "empty": "No se encontraron productos",
    "loading": "Cargando productos..."
  },
  "messages": {
    "created": "Producto creado correctamente",
    "updated": "Producto actualizado correctamente",
    "deleted": "Producto eliminado correctamente"
  }
}
```

**Step 2: Update TypeScript Types**

Add the new namespace to `shared/i18n/types.ts`:

```typescript
// shared/i18n/types.ts
import "i18next";

// Import type from English file (any language works for typing)
import type productsEN from "@shared/locales/en/products.json";

declare module "i18next" {
  interface CustomTypeOptions {
    defaultNS: "common";
    resources: {
      common: typeof commonEN;
      auth: typeof authEN;
      dashboard: typeof dashboardEN;
      settings: typeof settingsEN;
      toast: typeof toastEN;
      products: typeof productsEN;  // ADD THIS LINE
    };
  }
}
```

**Step 3: Update i18n Configuration**

Register the new namespace in `shared/i18n/config.ts`:

```typescript
// shared/i18n/config.ts
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { mmkvLanguageDetector } from "./storage";

// Import translations (synchronous for performance)
import productsEN from "@shared/locales/en/products.json";
import productsES from "@shared/locales/es/products.json";

const resources = {
  en: {
    common: commonEN,
    auth: authEN,
    dashboard: dashboardEN,
    settings: settingsEN,
    toast: toastEN,
    products: productsEN,  // ADD THIS
  },
  es: {
    common: commonES,
    auth: authES,
    dashboard: dashboardES,
    settings: settingsES,
    toast: toastES,
    products: productsES,  // ADD THIS
  },
} as const;

i18n
  .use(mmkvLanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: "es",
    defaultNS: "common",
    ns: ["common", "auth", "dashboard", "settings", "toast", "products"],  // ADD HERE
    interpolation: { escapeValue: false },
    react: { useSuspense: false },
    compatibilityJSON: "v4",
    debug: __DEV__,
  });

export default i18n;
```

**Step 4: Use Translations in Components**

```typescript
// Using with specific namespace
import { useTranslation } from 'react-i18next';

function ProductsScreen() {
  const { t } = useTranslation('products');

  return (
    <View>
      <Text>{t('title')}</Text>
      <Button>{t('create')}</Button>
    </View>
  );
}

// Using nested keys
t('form.errors.required');
t('messages.created');

// Accessing common translations without namespace
const { t: tCommon } = useTranslation('common');
tCommon('save');  // From common.json
```

**Step 5: Using in Screens with Proper Types**

```typescript
// typescript will autocomplete because of module augmentation
function ProductsList() {
  const { t } = useTranslation('products');

  // VSCode will show:
  // "title" | "create" | "edit" | "delete" | "name" | "price" | ...
  const title = t('title');

  return <Text>{title}</Text>;
}
```

#### Translation File Structure Best Practices

**Use nested keys by feature/area:**

```json
{
  "products": {
    "list": {
      "title": "Products",
      "empty": "No products",
      "loading": "Loading..."
    },
    "form": {
      "name": "Name",
      "price": "Price",
      "errors": {
        "required": "Required",
        "min": "Minimum {min} characters"
      }
    },
    "actions": {
      "create": "Create",
      "edit": "Edit",
      "delete": "Delete",
      "save": "Save"
    },
    "messages": {
      "created": "Created",
      "updated": "Updated",
      "deleted": "Deleted"
    }
  }
}
```

**With parameters:**

```typescript
t('form.errors.min', { min: 8 });  // "Minimum 8 characters"
t('welcome', { name: 'John' });     // "Welcome, John!"
```

**Plurals:**

```json
{
  "count": {
    "zero": "No items",
    "one": "1 item",
    "few": "{count} items",
    "many": "{count} items",
    "other": "{count} items"
  }
}
```

```typescript
t('count', { count: 0 });  // "No items"
t('count', { count: 1 });  // "1 item"
t('count', { count: 5 });  // "5 items"
```

#### Removing Translations

To remove a translation namespace (e.g., `products`):

1. Delete `shared/locales/en/products.json`
2. Delete `shared/locales/es/products.json`
3. Remove import and type from `shared/i18n/types.ts`
4. Remove imports and resources from `shared/i18n/config.ts`
5. Remove from `ns` array in config
6. Update any screens using that namespace

#### Language Switcher

```typescript
import { useTranslation } from 'react-i18next';

function LanguageSwitcher() {
  const { i18n } = useTranslation();

  const changeLanguage = (lang: 'en' | 'es') => {
    i18n.changeLanguage(lang);
  };

  return (
    <View style={{ flexDirection: 'row', gap: 10 }}>
      <Button title="EN" onPress={() => changeLanguage('en')} />
      <Button title="ES" onPress={() => changeLanguage('es')} />
    </View>
  );
}
```

#### i18n Debug in Development

```typescript
import i18n from 'i18next';

if (__DEV__) {
  console.log('Current language:', i18n.language);
  console.log('Available languages:', i18n.languages);
  console.log('Translation:', i18n.t('products.title'));
}
```

### Providers Setup

Global providers wrap the app:

```typescript
// app/providers.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useEffect } from 'react';
import { UnistylesRuntime } from 'react-native-unistyles';
import { preferences } from '@/shared/utils';
import { useAuthStore } from '@/features/auth/stores/auth.store';
import { secureStorageApi } from '@/shared/utils/storage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function ThemeInitializer({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const savedTheme = preferences.getTheme();
    if (savedTheme && savedTheme !== 'system') {
      UnistylesRuntime.setAdaptiveThemes(false);
      UnistylesRuntime.setTheme(savedTheme);
    }
  }, []);
  return <>{children}</>;
}

function AuthInitializer({ children }: { children: React.ReactNode }) {
  const { setUser, setLoading } = useAuthStore();

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const userData = await secureStorageApi.getUser();
        const accessToken = await secureStorageApi.getAccessToken();
        if (userData && accessToken) {
          const storedUser = JSON.parse(userData) as User;
          setUser(storedUser);
        }
      } catch (error) {
        // Handle error
      } finally {
        setLoading(false);
      }
    };
    initializeAuth();
  }, [setUser, setLoading]);

  return <>{children}</>;
}

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeInitializer>
        <AuthInitializer>{children}</AuthInitializer>
      </ThemeInitializer>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
```

---

## Implementation Checklist

When implementing a new feature, follow this checklist:

### 1. Planning Phase
- [ ] Feature requirements defined
- [ ] API endpoints identified
- [ ] UI design approved (frontend-design:frontend-design)
- [ ] Implementation plan created (if needed)

### 2. Create Feature Structure
```bash
mobile/src/features/{feature-name}/
├── components/
├── hooks/
├── schemas/
├── services/
├── stores/
├── types/
├── utils/
└── index.ts
```

### 3. Create Routes
```
src/app/(tool)/{feature-name}/
├── _layout.tsx          # With auth check if protected
├── list/
│   └── index.tsx
└── detail/
    └── [id].tsx
```

### 4. Implement Types
- Create `types/{feature}.types.ts`
- Define interfaces for data models, DTOs, params

### 5. Create Zod Schemas
- Create `schemas/{feature}.schema.ts`
- Define validation rules for forms

### 6. Implement Service
- Create `services/{feature}.service.ts`
- Use `api` from `@/shared/lib/api`

### 7. Create React Query Hooks
- Create `hooks/use{Feature}.ts`
- Define query keys
- Implement mutations with invalidation

### 8. Create Zustand Store (if needed)
- Create `stores/{feature}.store.ts`
- Use `zustandStorage` for persistence

### 9. Implement Components
- Use base components from `shared/components/ui/`
- Use Unistyles for styling
- Follow feature-first pattern

### 10. Add Forms (if needed)
- React Hook Form + Zod resolver
- Error handling with toasts

### 11. Add i18n Translations
Follow the complete i18n flow:

**Step 1 - Create translation files:**
- Create `shared/locales/en/{namespace}.json`
- Create `shared/locales/es/{namespace}.json`
- Use nested keys by feature area

**Step 2 - Update TypeScript types:**
- Add import type to `shared/i18n/types.ts`
- Add namespace to `CustomTypeOptions.resources`

**Step 3 - Register namespace:**
- Add imports to `shared/i18n/config.ts`
- Add to `resources` object (en and es)
- Add to `ns` array in `init()`

**Step 4 - Use in components:**
```typescript
const { t } = useTranslation('namespace');
t('key.nested');  // Type-safe autocomplete
```

### 12. Test and Commit
- Test on both iOS and Android
- Commit with descriptive message

---

## Quick Reference

### Essential Imports

```typescript
// API
import { api } from '@/shared/lib/api';

// Storage
import { storage, secureStorageApi, zustandStorage } from '@/shared/utils/storage';

// Auth
import { useAuthStore, selectIsAuthenticated } from '@/features/auth/stores/auth.store';

// React Query
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// Navigation
import { router } from 'expo-router';
import { useLocalSearchParams } from 'expo-router';

// Styles
import { useStyles } from 'react-native-unistyles';

// i18n
import { useTranslation } from 'react-i18next';

// Forms
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
```

### Common Patterns

**API Call:**
```typescript
const { data } = await api.get('/endpoint');
await api.post('/endpoint', payload);
await api.patch(`/endpoint/${id}`, payload);
await api.delete(`/endpoint/${id}`);
```

**React Query:**
```typescript
const query = useQuery({
  queryKey: ['key', id],
  queryFn: () => api.get(`/endpoint/${id}`),
  enabled: !!id,
});

const mutation = useMutation({
  mutationFn: api.post,
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['key'] });
  },
});
```

**Zustand Store:**
```typescript
create<State>()(
  persist(
    (set) => ({ /* actions */ }),
    { name: 'storage-key', storage: createJSONStorage(() => zustandStorage) }
  )
);
```

**Navigation:**
```typescript
router.replace('/(auth)/login');
router.push('/(tool)/products');
router.back();
```

**Platform Check:**
```typescript
import { Platform } from 'react-native';
Platform.OS; // 'ios' | 'android'
```

---

## Error Handling

### API Errors
```typescript
try {
  await api.post('/endpoint', data);
  toast.success('Success');
} catch (error) {
  toast.error(error.response?.data?.message || 'Error');
}
```

### Form Validation Errors
```typescript
const form = useForm({ resolver: zodResolver(schema) });
// Errors accessible via form.formState.errors
```

### Async Storage Errors
All storage operations have try-catch with console.error logging.

---

## Debugging Tips

### Check Auth State
```typescript
import { useAuthStore } from '@/features/auth/stores/auth.store';
console.log(useAuthStore.getState());
```

### View React Query Cache
React Query DevTools available in development (bottom-left icon).

### Check Storage
```typescript
import { storage, secureStorageApi } from '@/shared/utils/storage';
storage.getAllKeys(); // MMKV keys
await secureStorageApi.getAccessToken(); // Token exists
```

### i18n Debug
```typescript
import i18n from 'i18next';
console.log(i18n.language); // Current language
console.log(i18n.t('key')); // Translation value
```

---

## Tech Stack Summary

| Category | Library | Purpose |
|----------|---------|---------|
| Framework | Expo 54 | Mobile framework |
| Navigation | Expo Router | File-based routing |
| State - Server | React Query | Data fetching, caching |
| State - Client | Zustand | Client state, persistence |
| Storage - General | MMKV | Fast local storage |
| Storage - Sensitive | SecureStore | Encrypted token storage |
| Styling | Unistyles | Theme-based styling |
| Forms | React Hook Form | Form handling |
| Validation | Zod | Schema validation |
| i18n | i18next + MMKV | Internationalization |
| HTTP | Axios | API client |
| Gestures | React Native Gesture Handler | Touch interactions |
| Modals | Bottom Sheet | Sheet modals |
| Toasts | Sonner Native | Notifications |

---

## File Organization Best Practices

### Component Location Rules
- Base reusable components → `shared/components/ui/`
- Composite shared components → `shared/components/common/`
- Feature-specific components → `features/{feature}/components/`

### Hook Location Rules
- Shared hooks → `shared/hooks/`
- Feature hooks → `features/{feature}/hooks/`

### Utility Location Rules
- Shared utilities → `shared/utils/`
- Feature utilities → `features/{feature}/utils/`

### Service Location Rules
- API services per feature → `features/{feature}/services/`

### Never
- Create components outside feature or shared
- Put feature code in root directories
- Mix responsibilities across directories
