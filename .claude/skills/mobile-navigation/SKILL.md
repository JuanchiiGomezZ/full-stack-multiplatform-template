---
name: mobile-navigation
description: >
  Implements Expo Router file-based navigation patterns.
  Trigger: When creating routes, layouts, navigation, or auth redirects.
license: MIT
metadata:
  author: juanma-gomez
  version: "1.0"
  scope: [mobile]
  auto_invoke: "navigation, router, route, layout, redirect, tabs, screen"
allowed-tools: Read, Edit, Write, Glob, Grep, Bash
---

## When to Use

- Creating new routes/screens
- Adding layout groups (`(auth)`, `(tabs)`)
- Implementing auth redirects
- Setting up tab navigation
- Adding dynamic routes `[id]`

---

## Critical Rules - NON-NEGOTIABLE

### File Structure

- **ALWAYS**: Routes in `src/app/` directory
- **ALWAYS**: Use layout groups: `(auth)`, `(tabs)`, `(modals)`
- **ALWAYS**: Define `_layout.tsx` for each group
- **NEVER**: Mix route groups

### Auth Pattern

- **ALWAYS**: Auth check in `_layout.tsx` of protected group
- **ALWAYS**: Use `router.replace()` for auth redirects
- **NEVER**: Create separate `ProtectedRoute` component

### Navigation

- **ALWAYS**: Use `router.replace()` for auth flows
- **ALWAYS**: Use `router.push()` for navigation stack
- **ALWAYS**: Use `router.back()` to go back
- **NEVER**: Use imperative navigation for initial routes

---

## Decision Tree

```
Public route (login, register)? → Create in (auth)/
Protected route with tabs? → Create in (tabs)/
Modal screen? → Create in (modals)/
Dynamic route? → Use [param].tsx
Auth redirect? → In index.tsx or _layout.tsx
```

---

## Workflow

### 1. Understand Route Structure

```
app/
├── _layout.tsx          # Root: GestureHandler, Providers
├── index.tsx            # Entry: Auth redirect
├── (auth)/              # Public routes
│   ├── _layout.tsx      # Stack without header
│   ├── login.tsx
│   └── register.tsx
└── (tabs)/              # Protected routes
    ├── _layout.tsx      # Tabs + auth check
    ├── dashboard/
    │   └── index.tsx
    └── settings/
        └── index.tsx
```

### 2. Create Route Group

```bash
mkdir -p mobile/src/app/(group-name)
touch mobile/src/app/(group-name)/_layout.tsx
```

### 3. Add Auth Check (if protected)

In the `_layout.tsx` of protected group.

---

## Code Examples

### Root Layout

**File:** `app/_layout.tsx`

```typescript
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { Stack } from 'expo-router';
import Toast from 'react-native-toast-message';
import Providers from './providers';

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <BottomSheetModalProvider>
        <Providers>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="(tabs)" />
          </Stack>
          <Toast />
        </Providers>
      </BottomSheetModalProvider>
    </GestureHandlerRootView>
  );
}
```

### Auth Redirect (index.tsx)

**File:** `app/index.tsx`

```typescript
import { useEffect, useState, useCallback } from 'react';
import { router, useRootNavigationState } from 'expo-router';
import { useAuthStore, selectIsAuthenticated } from '@/features/auth';
import { ScreenWrapper } from '@/shared/components/ui';

export default function Index() {
  const isAuthenticated = useAuthStore(selectIsAuthenticated);
  const isLoading = useAuthStore((state) => state.isLoading);
  const rootNavigationState = useRootNavigationState();
  const [isLayoutReady, setIsLayoutReady] = useState(false);

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
      router.replace(isAuthenticated ? '/(tabs)/dashboard' : '/(auth)/login');
    }, 100);

    return () => clearTimeout(timer);
  }, [isLayoutReady, isLoading, isAuthenticated]);

  return <ScreenWrapper loading centered />;
}
```

### Auth Layout (Public)

**File:** `app/(auth)/_layout.tsx`

```typescript
import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'fade' }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
    </Stack>
  );
}
```

### Protected Layout with Tabs

**File:** `app/(tabs)/_layout.tsx`

```typescript
import { useEffect } from 'react';
import { router, Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore, selectIsAuthenticated, selectIsLoading } from '@/features/auth';

export default function TabsLayout() {
  const isAuthenticated = useAuthStore(selectIsAuthenticated);
  const isLoading = useAuthStore(selectIsLoading);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/(auth)/login');
    }
  }, [isLoading, isAuthenticated]);

  if (isLoading || !isAuthenticated) {
    return null;
  }

  return (
    <Tabs screenOptions={{ headerShown: true }}>
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

### Dynamic Route

**File:** `app/(tabs)/products/[id].tsx`

```typescript
import { useLocalSearchParams } from 'expo-router';
import { useProduct } from '@/features/products';

export default function ProductDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: product, isLoading } = useProduct(id);

  if (isLoading) return <ScreenWrapper loading />;

  return (
    <ScreenWrapper>
      <Text>{product?.name}</Text>
    </ScreenWrapper>
  );
}
```

### Navigation Actions

```typescript
import { router } from 'expo-router';

// Replace (no back)
router.replace('/(auth)/login');

// Push (can go back)
router.push('/(tabs)/products/123');

// Go back
router.back();

// Navigate with params
router.push({
  pathname: '/(tabs)/products/[id]',
  params: { id: '123' },
});
```

---

## Commands

```bash
# Create route group
mkdir -p mobile/src/app/(group-name)
touch mobile/src/app/(group-name)/_layout.tsx

# Create screen in group
touch mobile/src/app/(tabs)/screen-name.tsx

# Create nested route
mkdir -p mobile/src/app/(tabs)/feature
touch mobile/src/app/(tabs)/feature/index.tsx

# Create dynamic route
touch mobile/src/app/(tabs)/feature/[id].tsx
```

---

## Checklist

- [ ] Route group has `_layout.tsx`
- [ ] Protected routes check auth in layout
- [ ] Auth redirects use `router.replace()`
- [ ] Navigation waits for layout ready
- [ ] Dynamic routes use `useLocalSearchParams`
- [ ] Tab icons defined for all tabs

---

## Resources

- **Root Layout**: `mobile/src/app/_layout.tsx`
- **Auth Group**: `mobile/src/app/(auth)/`
- **Tabs Group**: `mobile/src/app/(tabs)/`
- **Expo Router Docs**: https://docs.expo.dev/router/
