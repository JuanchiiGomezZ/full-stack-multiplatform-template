---
name: execute-mobile
description: Use when implementing features, fixing bugs, or refactoring in React Native Expo mobile app for iOS and Android. Requires feature-first architecture, Unistyles theming, Zustand + React Query state, and Expo Router navigation. For new UI, use frontend-design:frontend-design first. For new dependencies, consult Context7 MCP.
---

# execute-mobile

## Propósito y Scope del Skill

**execute-mobile** es un skill híbrido de técnica y proceso para implementación en **React Native Expo** con soporte para **iOS y Android**.

**IMPORTANTE:** Toda implementación debe funcionar en ambas plataformas. Verificar compatibilidad antes de usar libraries nativas.

**Herramientas disponibles:**
- **Context7 MCP** - Documentación actualizada de libraries/frameworks
- **Web Search** - Información adicional cuando Context7 no es suficiente
- **Project rules** - `.claude/rules/` para patrones y convenciones locales
- **frontend-design:frontend-design** - MANDATORIO para toda nueva UI

**El skill se activa cuando:**
- Creating new features in the mobile app
- Fixing bugs in existing mobile code
- Refactoring mobile components/services
- Adding new API integrations
- Implementing forms with validation
- **Integrating new dependencies** → usar Context7/Web Search para setup actual
- Any mobile-related implementation task

**El skill NO se usa para:**
- Planning new features (use `writing-plans`)
- Exploring requirements (use `brainstorming`)
- Writing documentation (use `generate-project-docs`)
- Designing UI (use `frontend-design:frontend-design`)

**Regla de hierro:** Si hay un gap, ambigüedad, o no entiendes algo → PREGUNTA antes de implementar. No asumas, no guesses, no inventes.

**Reglas de compatibilidad iOS/Android:**
- Usar APIs cross-platform de React Native
- Para native modules, verificar soporte iOS/Android
- Testear en ambos emuladores/devices antes de commit
- Si hay diferencias de implementación, usar platform checks

---

## Nueva UI → frontend-design:frontend-design OBLIGATORIO

**REQUIRED SUB-SKILL:** Antes de implementar cualquier UI nueva, USA `frontend-design:frontend-design`

**Flujo correcto:**
1. Requerimiento de UI → frontend-design:frontend-design para diseño
2. Diseño aprobado → execute-mobile para implementación técnica
3. Implementación → Apego estricto al diseño recibido

**No hay excepciones.** Even "simple" UI changes require frontend-design review.

---

## Arquitectura Mobile - Feature-First

El proyecto mobile sigue una arquitectura **feature-first** donde cada feature es autosuficiente y contiene todo lo que necesita:

```
src/features/{feature-name}/
├── components/      # Solo usados por esta feature
├── hooks/           # Hooks personalizados
├── schemas/         # Zod validations
├── services/        # API calls
├── stores/          # Zustand stores
├── types/           # TypeScript definitions
├── utils/           # Utilidades locales
└── index.ts         # Exports públicos
```

**Principios clave:**
- Componentes en `features/` = específicos de la feature
- Componentes en `shared/components/ui/` = UI base reutilizable
- Nunca mezclar - si es solo para auth, va en `features/auth/`

---

## Componentes UI y Patrones de Implementación

### Componentes UI Base - Regla Mandatory

**PRIMERO:** Verificar si existe el componente en `src/shared/components/ui/`

**NUNCA crear desde cero** si ya existe el componente base:
- Button, TextInput, Card, Modal, etc.
- Todos ya configurados con Unistyles theme
- Tipados con TypeScript
- Testeados y consistentes

**Flujo de creación de UI:**

```typescript
// ❌ WRONG - Crear todo desde cero
export function LoginForm() {
  return (
    <View>
      <TextInput style={...} />
      <TouchableOpacity style={...}>
        <Text>Login</Text>
      </TouchableOpacity>
    </View>
  );
}

// ✅ CORRECT - Usar componentes base
import { TextInput } from '@/shared/components/ui/text-input';
import { Button } from '@/shared/components/ui/button';

export function LoginForm() {
  return (
    <View>
      <TextInput label="Email" />
      <Button>Login</Button>
    </View>
  );
}
```

### Unistyles - Theme Obligatorio

**Configuración en `src/shared/styles/unistyles.ts`:**
- Themes light/dark definidos globalmente
- Breakpoints responsive
- `adaptiveThemes: true` por defecto

**Uso en componentes:**
```typescript
import { useStyles } from 'react-native-unistyles';

export function MyComponent() {
  const { styles } = useStyles();
  return <View style={styles.container} />;
}
```

**NUNCA estilos inline sueltos** - usar el theme system.

### Formularios - React Hook Form + Zod

**Patrón establecido:**
```typescript
// 1. Schema Zod
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

// 2. Hook con resolver
const form = useForm({
  resolver: zodResolver(loginSchema),
});

// 3. UI con FormField components
<Controller
  control={form.control}
  name="email"
  render={({ field }) => (
    <TextInput
      value={field.value}
      onChangeText={field.onChange}
      error={form.formState.errors.email?.message}
    />
  )}
/>
```

### i18n - Internacionalización

**Usar i18next con MMKV storage:**
```typescript
import { useTranslation } from 'react-i18next';

function LoginScreen() {
  const { t } = useTranslation('auth');
  return <Button>{t('login')}</Button>;
}
```

**Keys de traducción** en `src/shared/locales/`

---

## API Integration y State Management

### Storage Layer - MMKV + SecureStore

**Archivo base:** `src/shared/utils/storage.ts`

**Dos capas de almacenamiento:**

**1. MMKV (datos generales):**
- Theme, preferencias, onboarding
- Acceso síncrono, muy rápido
- `storage.setObject()`, `storage.getObject()`, etc.

**2. SecureStore (datos sensibles):**
- Tokens de autenticación
- Datos de usuario
- `secureStorageApi.getAccessToken()`, `secureStorageApi.setAccessToken()`, etc.

**Nunca usar SecureStore directamente** - usar `secureStorageApi`:
```typescript
import { secureStorageApi, storage } from '@/shared/utils/storage';

// Para tokens (sensible)
await secureStorageApi.setAccessToken(token);
await secureStorageApi.removeAccessToken();

// Para preferencias (general)
storage.setObject('userPreferences', preferences);
const prefs = storage.getObject<UserPreferences>('userPreferences');
```

### Axios Configuration

**Archivo base:** `src/shared/lib/api.ts`

**Configuración ya establecida:**
```typescript
export const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Interceptor request - añade token
api.interceptors.request.use(async (config) => {
  const token = await secureStorageApi.getAccessToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Interceptor response - maneja 401 con refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401 && !originalRequest._retry) {
      // Refresh token logic usando secureStorageApi
    }
    return Promise.reject(error);
  }
);
```

**NUNCA crear axios instance nuevo** - usar `api` de `@/shared/lib/api`.

### Service Layer Pattern

**Cada feature tiene su servicio:**
```
features/auth/services/auth.service.ts
features/products/services/products.service.ts
```

**Estructura del servicio:**
```typescript
import { api } from '@/shared/lib/api';
import type { Product, CreateProductDto } from '../types';

export const productsApi = {
  getAll: (params) => api.get('/products', { params }),
  getById: (id) => api.get(`/products/${id}`),
  create: (data) => api.post('/products', data),
  update: (id, data) => api.patch(`/products/${id}`, data),
  delete: (id) => api.delete(`/products/${id}`),
};
```

### React Query Hooks

**Co-located con el servicio:**
```typescript
// features/products/hooks/useProducts.ts
export function useProducts(page = 1) {
  return useQuery({
    queryKey: ['products', { page }],
    queryFn: () => productsApi.getAll({ page, limit: 10 }),
  });
}

export function useProduct(id: string) {
  return useQuery({
    queryKey: ['products', id],
    queryFn: () => productsApi.getById(id),
    enabled: !!id,
  });
}
```

**Invalidación por feature:**
```typescript
queryClient.invalidateQueries({ queryKey: ['products'] });
```

### Zustand + MMKV Storage

**Auth store pattern:**
```typescript
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { zustandStorage, secureStorageApi } from '@/shared/utils/storage';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  login: (user: User, accessToken: string, refreshToken: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      login: async (user, accessToken, refreshToken) => {
        await secureStorageApi.setAccessToken(accessToken);
        await secureStorageApi.setRefreshToken(refreshToken);
        set({ user, isAuthenticated: true });
      },
      logout: async () => {
        await secureStorageApi.clearAuthData();
        set({ user: null, isAuthenticated: false });
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => zustandStorage),
      partialize: (state) => ({ user: state.user }),
    }
  )
);
```

**NUNCA usar AsyncStorage** - usar `zustandStorage` + `secureStorageApi`.

### Constants y Storage Keys

**Archivo:** `src/constants/index.ts`
```typescript
export const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
  USER: 'user',
  THEME: 'app_theme',
  ONBOARDING_COMPLETED: 'onboarding_completed',
} as const;
```

---

## Navegación y Rutas

### Expo Router - File-Based Routing

**Estructura de rutas:**
```
src/app/
├── _layout.tsx              # Root layout (providers, gesture handler)
├── index.tsx                # Redirect based on auth state
├── providers.tsx            # QueryClient, Theme, Auth providers
│
├── (auth)/                  # Grupo: rutas públicas
│   ├── _layout.tsx          # Stack sin header
│   ├── login/
│   └── register/
│
└── (tool)/                  # Grupo: rutas protegidas
    ├── _layout.tsx          # Tabs + auth check + logout
    ├── dashboard/
    └── settings/
```

### Root Layout

**`src/app/_layout.tsx`:**
```typescript
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { Stack } from "expo-router";
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

### Initial Redirect - Pantalla de Entrada

**`src/app/index.tsx`:**
```typescript
import { useEffect, useState, useCallback } from "react";
import { router, useRootNavigationState } from "expo-router";
import { useAuthStore, selectIsAuthenticated } from "@/features/auth/stores/auth.store";
import { ScreenWrapper } from "@/shared/components/ui";

export default function Index() {
  const isAuthenticated = useAuthStore(selectIsAuthenticated);
  const isLoading = useAuthStore((state) => state.isLoading);
  const rootNavigationState = useRootNavigationState();
  const [isLayoutReady, setIsLayoutReady] = useState(false);

  // Esperar a que el navigator esté listo
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

    // Redirigir según estado auth
    const timer = setTimeout(() => {
      router.replace(isAuthenticated ? "/(tool)/dashboard" : "/(auth)/login");
    }, 100);

    return () => clearTimeout(timer);
  }, [isLayoutReady, isLoading, isAuthenticated]);

  return <ScreenWrapper loading centered />;
}
```

### Auth Group - Rutas Públicas

**`src/app/(auth)/_layout.tsx`:**
```typescript
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

### Tool Group - Rutas Protegidas

**La protección va en el _layout del grupo, NO en componentes:**

**`src/app/(tool)/_layout.tsx`:**
```typescript
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
    // Redirect a login si no está autenticado
    if (!isLoading && !isAuthenticated) {
      router.replace('/(auth)/login');
    }
  }, [isLoading, isAuthenticated]);

  // No renderizar nada si cargando o no autenticado
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
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color, size }) => <Ionicons name="home" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, size }) => <Ionicons name="settings" size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
```

**Pattern para rutas protegidas:**
1. useEffect verifica `isAuthenticated` del store
2. Redirect a `/login` si no autenticado
3. Return `null` si no autenticado (evita flash de contenido)
4. Logout button en `headerRight`

---

## Checklist de Implementación de Features

### 1. Planning (YA HECHO por writing-plans)
- [ ] Plan de implementación revisado
- [ ] Diseño de UI aprobado (frontend-design:frontend-design)
- [ ] Endpoints de API verificados

### 2. Crear Estructura de Feature
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

### 3. Crear Rutas (si aplica)
```
src/app/(tool)/{feature-name}/
├── _layout.tsx          # Con auth check si es protegido
├── list/
│   └── index.tsx
└── detail/
    └── [id].tsx
```

### 4. Implementar Tipos
- `types/{feature}.types.ts` - interfaces de datos
- Tipos bien definidos, sin `any`

### 5. Crear Zod Schemas
- `schemas/{feature}.schema.ts` - validaciones
- Reutilizar common schemas si aplica

### 6. Implementar Service
- `services/{feature}.service.ts` - llamadas API
- Usar `api` de `@/shared/lib/api`

### 7. Crear React Query Hooks
- `hooks/use{Feature}.ts` - data fetching
- Invalidación correcta de queries

### 8. Crear Zustand Store (si necesita estado local)
- `stores/{feature}.store.ts`
- Usar `zustandStorage` de `@/shared/utils/storage`

### 9. Implementar Componentes UI
- Usar componentes base de `shared/components/ui/` primero
- Crear componentes específicos en `features/{feature}/components/`
- Usar Unistyles theme
- Tipados con TypeScript

### 10. Formularios (si aplica)
- React Hook Form + Zod resolver
- Error handling

### 11. Commit
- Commits frecuentes y descriptivos

---

## Errores Comunes y Debugging

### Errores Frecuentes - Cómo Evitarlos

#### ❌ Estado no persistido
**Problema:** Datos perdidos al cerrar app
**Causa:** Usar `AsyncStorage` o no usar persist middleware
**Solución:** Usar `zustandStorage` + `secureStorageApi`

#### ❌ Token no enviado en requests
**Problema:** 401 Unauthorized
**Causa:** Crear nuevo axios instance en lugar de usar `api`
**Solución:** Siempre usar `import { api } from '@/shared/lib/api'`

#### ❌ Re-renders excesivos
**Problema:** Componente se re-renderiza innecesariamente
**Causa:** Selector mal usado en Zustand
**Solución:** Usar selectors específicos:
```typescript
// ❌ WRONG - Todo el store
const user = useAuthStore((state) => state.user);

// ✅ CORRECT - Selector específico
const user = useAuthStore(selectUser);
```

#### ❌ UI inconsistente
**Problema:** Distinto look & feel entre pantallas
**Causa:** Estilos inline o fuera del theme
**Solución:** Usar Unistyles theme system

#### ❌ Navigation errors
**Problema:** Navigator not ready, key undefined
**Causa:** Navegar antes de que layout esté listo
**Solución:** Usar `useRootNavigationState` + `isLayoutReady`

#### ❌ Forms que no validan
**Problema:** Errores no mostrados al usuario
**Causa:** Olvidar `resolver={zodResolver(schema)}`
**Solución:** SIEMPRE incluir resolver en useForm

### Debugging Tips

**Ver estado de auth:**
```typescript
import { useAuthStore } from '@/features/auth/stores/auth.store';
// En dev, loguear:
// const { user, isAuthenticated } = useAuthStore.getState();
```

**Ver queries de React Query:**
- Instalar React Query DevTools en providers
- Ver cache, stale status, fetching

**Ver storage:**
```typescript
import { storage, secureStorageApi } from '@/shared/utils/storage';
// MMKV: storage.getAllKeys()
// Secure: await secureStorageApi.getAccessToken()
```

---

## Quick Reference

### Imports Essenciales
```typescript
// API
import { api } from '@/shared/lib/api';

// Storage
import { storage, secureStorageApi, zustandStorage } from '@/shared/utils/storage';

// Auth State
import { useAuthStore, selectIsAuthenticated } from '@/features/auth/stores/auth.store';

// React Query
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// Navigation
import { router } from 'expo-router';

// i18n
import { useTranslation } from 'react-i18next';

// Unistyles
import { useStyles } from 'react-native-unistyles';
```

### Patrón Feature Nueva
```bash
# 1. Crear estructura
mkdir -p features/newfeature/{components,hooks,schemas,services,stores,types,utils}

# 2. Crear rutas
mkdir -p app/\(tool\)/newfeature/{list,detail}
```

### Patrón API Call
```typescript
// service
export const featureApi = {
  get: (id) => api.get(`/feature/${id}`),
  create: (data) => api.post('/feature', data),
};

// hook
export function useFeature(id) {
  return useQuery({
    queryKey: ['feature', id],
    queryFn: () => featureApi.get(id),
    enabled: !!id,
  });
}
```

### Patrón Zustand Store
```typescript
interface State { /* ... */ }

export const useStore = create<State>()(
  persist(
    (set) => ({ /* actions */ }),
    {
      name: 'feature-storage',
      storage: createJSONStorage(() => zustandStorage),
    }
  )
);
```

### Patrón Form
```typescript
const schema = z.object({ /* ... */ });
const form = useForm({ resolver: zodResolver(schema) });

<Controller control={form.control} name="field" render={({ field }) => (
  <TextInput value={field.value} onChangeText={field.onChange} />
)} />
```

### Navigation
```typescript
// Redirect
router.replace('/(auth)/login');

// Params
const { id } = useLocalSearchParams<{ id: string }>();
```

### Storage Keys
```typescript
import { STORAGE_KEYS } from '@/constants';
// ACCESS_TOKEN, REFRESH_TOKEN, USER, THEME, etc.
```

### Compatibilidad iOS/Android
```typescript
// Verificar plataforma
import { Platform } from 'react-native';

if (Platform.OS === 'ios') {
  // iOS specific
} else {
  // Android specific
}

// constants
Platform.OS        // 'ios' | 'android'
Platform.Version   // OS version
```

---

## Resumen del Skill

| Área | Patrón | Location |
|------|--------|----------|
| Feature structure | feature-first | `src/features/{name}/` |
| API calls | axios interceptors | `@/shared/lib/api` |
| Auth state | Zustand + SecureStore | `@/shared/utils/storage` |
| Server state | React Query | `hooks/use*` |
| Routing | Expo Router groups | `src/app/(group)/` |
| Protected routes | Auth check in layout | `(tool)/_layout.tsx` |
| Forms | React Hook Form + Zod | `schemas/`, `hooks/` |
| Styling | Unistyles theme | `@/shared/styles/` |
| i18n | i18next + MMKV | `@/shared/i18n/` |
| Components | UI base first | `shared/components/ui/` |
