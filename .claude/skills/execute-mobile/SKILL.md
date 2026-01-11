---
name: execute-mobile
description: Use when implementing features, fixing bugs, or refactoring in React Native Expo mobile app for iOS and Android. Requires feature-first architecture, Unistyles theming, Zustand + React Query state, and Expo Router navigation. For new UI, use frontend-design:frontend-design first. For new dependencies, consult Context7 MCP.
---

# execute-mobile

## Propósito y Scope

**execute-mobile** guía la implementación en **React Native Expo** para **iOS y Android**.

**Regla de hierro:** Si hay un gap, ambigüedad, o no entiendes algo → **PREGUNTA antes de implementar**. No asumas, no guesses, no inventes.

**CUANDO USAR:**
- Creating/fixing/refactoring features
- Adding API integrations
- Implementing forms
- Any mobile implementation task

**CUANDO NO USAR:**
- Planning (use `writing-plans`)
- Exploring requirements (use `brainstorming`)
- Designing UI (use `frontend-design:frontend-design`)

---

## Reglas Críticas (Violar estas = Fail)

### 1. UNISTYLES OBLIGATORIO - NO StyleSheet

```typescript
// ❌ WRONG - StyleSheet
const styles = StyleSheet.create({ container: { flex: 1 } });

// ✅ CORRECT - Unistyles
import { useStyles } from 'react-native-unistyles';
const { styles } = useStyles();
```

### 2. COMPONENTES BASE PRIMERO

**PRIMERO:** Verificar en `src/shared/components/ui/`

```typescript
// ❌ WRONG - Crear desde cero
<TextInput style={styles.input} />

// ✅ CORRECT - Usar componente base
import { TextInput } from '@/shared/components/ui/text-input';
<TextInput label="Email" />
```

### 3. PREGUNTAR SI HAY GAP

**NUNCA asumir:**
- Backend API structure → PREGUNTAR
- UI design → frontend-design:frontend-design
- New library → Context7 MCP
- Componente existente → Revisar shared/components/ui/

---

## Feature-First Architecture

```
src/features/{feature-name}/
├── components/      # Solo para esta feature
├── hooks/           # Custom hooks
├── schemas/         # Zod validations
├── services/        # API calls
├── stores/          # Zustand stores
├── types/           # TypeScript definitions
├── utils/           # Utilities
└── index.ts         # Exports
```

---

## Storage - MMKV + SecureStore

**NUNCA usar AsyncStorage o SecureStore directo:**

```typescript
// ✅ CORRECT - Usar abstracciones
import { storage, secureStorageApi, zustandStorage } from '@/shared/utils/storage';

// Tokens (sensible)
await secureStorageApi.setAccessToken(token);

// Datos generales (MMKV)
storage.setObject('preferences', prefs);
const prefs = storage.getObject<Preferences>('preferences');

// Zustand persist
create({
  storage: createJSONStorage(() => zustandStorage),
});
```

---

## API Layer

```typescript
// ✅ CORRECT - Usar api existente
import { api } from '@/shared/lib/api';
api.get('/products');
api.post('/products', data);
```

**NUNCA crear nuevo axios instance.**

---

## React Query

```typescript
// features/products/hooks/useProducts.ts
export function useProducts(page = 1) {
  return useQuery({
    queryKey: ['products', { page }],
    queryFn: () => api.get('/products', { params: { page, limit: 10 } }),
  });
}
```

**Invalidación:**
```typescript
queryClient.invalidateQueries({ queryKey: ['products'] });
```

---

## Forms - React Hook Form + Zod

```typescript
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, Controller } from 'react-hook-form';

const schema = z.object({
  name: z.string().min(1),
  price: z.number().positive(),
});

const form = useForm({ resolver: zodResolver(schema) });

<Controller
  control={form.control}
  name="name"
  render={({ field }) => (
    <TextInput value={field.value} onChangeText={field.onChange} />
  )}
/>
```

---

## Navegación - Expo Router

### Estructura de rutas
```
src/app/
├── _layout.tsx              # Root (providers)
├── index.tsx                # Redirect auth
├── (auth)/                  # Públicas
│   └── login/
└── (tool)/                  # Protegidas
    └── products/
        ├── index.tsx        # List
        └── [id]/            # Detail
            └── index.tsx
```

### Auth check en LAYOUT (NO en componente)

**`src/app/(tool)/_layout.tsx`:**
```typescript
useEffect(() => {
  if (!isLoading && !isAuthenticated) {
    router.replace('/(auth)/login');
  }
}, [isLoading, isAuthenticated]);

if (isLoading || !isAuthenticated) return null;
```

**NUNCA crear ProtectedRoute component.**

---

## i18n

```typescript
import { useTranslation } from 'react-i18next';

const { t } = useTranslation('products');
<Text>{t('list.title')}</Text>
```

---

## Checklist de Implementación

1. [ ] ¿Frontend design aprobado? (frontend-design:frontend-design)
2. [ ] ¿API endpoints verificados?
3. [ ] Feature structure creada
4. [ ] Tipos definidos
5. [ ] Zod schemas (si hay forms)
6. [ ] Service implementado (usando api)
7. [ ] React Query hooks
8. [ ] Zustand store (si necesita estado local)
9. [ ] Componentes UI (usando base components + Unistyles)
10. [ ] Navegación con layout groups
11. [ ] i18n keys

---

## Quick Reference

```typescript
// Imports esenciales
import { api } from '@/shared/lib/api';
import { storage, secureStorageApi, zustandStorage } from '@/shared/utils/storage';
import { useAuthStore, selectIsAuthenticated } from '@/features/auth/stores/auth.store';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useStyles } from 'react-native-unistyles';
import { useTranslation } from 'react-i18next';

// Platform check
import { Platform } from 'react-native';
Platform.OS; // 'ios' | 'android'
```
