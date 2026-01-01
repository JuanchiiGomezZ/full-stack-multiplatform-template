# Frontend: State Management

<!-- AUTO-GENERATED: START -->

## Stack

- **Server State:** React Query (TanStack Query)
- **Client State:** Zustand
- **Form State:** React Hook Form
- **URL State:** Next.js router (useSearchParams)

## State Categories

```
┌─────────────────────────────────────────────────┐
│ Server State (React Query)                      │
│ - Data from API                                 │
│ - Cached responses                              │
│ - Automatic refetching                          │
│ - Background updates                            │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│ Client State (Zustand)                          │
│ - UI state (modals, sidebars)                   │
│ - Theme preference                              │
│ - Auth tokens (persisted)                       │
│ - User preferences                              │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│ Form State (React Hook Form)                    │
│ - Input values                                  │
│ - Validation errors                             │
│ - Form submission state                         │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│ URL State (Next.js Router)                      │
│ - Route parameters                              │
│ - Search params                                 │
│ - Query filters                                 │
└─────────────────────────────────────────────────┘
```

## React Query (Server State)

**Setup:** `frontend/src/app/[locale]/layout.tsx`

```typescript
'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState } from 'react';

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
```

### Query Pattern

```typescript
import { useQuery } from '@tanstack/react-query';
import { usersApi } from '@/features/users/services/users.service';

export function useUsers(page: number = 1) {
  return useQuery({
    queryKey: ['users', { page }],
    queryFn: () => usersApi.getAll({ page, limit: 10 }),
  });
}
```

**Usage in component:**
```typescript
function UsersList() {
  const { data, isLoading, error } = useUsers(1);

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      {data.users.map((user) => (
        <UserCard key={user.id} user={user} />
      ))}
    </div>
  );
}
```

### Mutation Pattern

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { usersApi } from '@/features/users/services/users.service';
import { toast } from 'sonner';

export function useCreateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: usersApi.create,
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('User created successfully');
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
}
```

**Usage:**
```typescript
function CreateUserForm() {
  const createUser = useCreateUser();

  const handleSubmit = (data) => {
    createUser.mutate(data);
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* form fields */}
      <button disabled={createUser.isPending}>
        {createUser.isPending ? 'Creating...' : 'Create User'}
      </button>
    </form>
  );
}
```

### Query Keys Strategy

```typescript
// Hierarchical keys for easy invalidation
export const queryKeys = {
  users: {
    all: ['users'] as const,
    lists: () => [...queryKeys.users.all, 'list'] as const,
    list: (filters: string) => [...queryKeys.users.lists(), { filters }] as const,
    details: () => [...queryKeys.users.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.users.details(), id] as const,
  },
};

// Usage
useQuery({
  queryKey: queryKeys.users.detail(userId),
  queryFn: () => usersApi.getById(userId),
});

// Invalidate all user lists
queryClient.invalidateQueries({ queryKey: queryKeys.users.lists() });
```

### Optimistic Updates

```typescript
export function useUpdateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: usersApi.update,
    onMutate: async (newUser) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['users', newUser.id] });

      // Snapshot previous value
      const previousUser = queryClient.getQueryData(['users', newUser.id]);

      // Optimistically update
      queryClient.setQueryData(['users', newUser.id], newUser);

      return { previousUser };
    },
    onError: (err, newUser, context) => {
      // Rollback on error
      queryClient.setQueryData(['users', newUser.id], context?.previousUser);
    },
    onSettled: (newUser) => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: ['users', newUser?.id] });
    },
  });
}
```

## Zustand (Client State)

### Auth Store Example

Location: `frontend/src/features/auth/stores/auth.store.ts`

```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  email: string;
  role: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (user: User, token: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      login: (user, token) =>
        set({
          user,
          token,
          isAuthenticated: true,
        }),
      logout: () =>
        set({
          user: null,
          token: null,
          isAuthenticated: false,
        }),
    }),
    {
      name: 'auth-storage', // localStorage key
    }
  )
);
```

**Usage:**
```typescript
function Header() {
  const { user, logout } = useAuthStore();

  return (
    <div>
      <span>{user?.email}</span>
      <button onClick={logout}>Logout</button>
    </div>
  );
}
```

### Theme Store

```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ThemeState {
  theme: 'light' | 'dark' | 'system';
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      theme: 'system',
      setTheme: (theme) => set({ theme }),
    }),
    {
      name: 'theme-storage',
    }
  )
);
```

### UI State Store

```typescript
interface UIState {
  isSidebarOpen: boolean;
  isModalOpen: boolean;
  toggleSidebar: () => void;
  openModal: () => void;
  closeModal: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  isSidebarOpen: true,
  isModalOpen: false,
  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
  openModal: () => set({ isModalOpen: true }),
  closeModal: () => set({ isModalOpen: false }),
}));
```

### Selectors

```typescript
// Extract specific state to avoid unnecessary re-renders
function UserEmail() {
  const email = useAuthStore((state) => state.user?.email);
  return <span>{email}</span>;
}

// Multiple selectors
function UserInfo() {
  const { user, isAuthenticated } = useAuthStore((state) => ({
    user: state.user,
    isAuthenticated: state.isAuthenticated,
  }));

  return <div>{isAuthenticated && user.email}</div>;
}
```

## Form State (React Hook Form)

See `.claude/rules/frontend/forms.md` for detailed patterns.

## URL State (Search Params)

```typescript
'use client';

import { useSearchParams, useRouter } from 'next/navigation';

function UsersList() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const page = searchParams.get('page') || '1';
  const search = searchParams.get('search') || '';

  const setPage = (newPage: number) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', newPage.toString());
    router.push(`?${params.toString()}`);
  };

  return (
    <div>
      {/* List component */}
      <Pagination page={parseInt(page)} onPageChange={setPage} />
    </div>
  );
}
```

## Best Practices

### ✅ DO

**React Query:**
- Use for all server data
- Implement proper query keys
- Invalidate queries on mutations
- Handle loading/error states
- Use optimistic updates for better UX

**Zustand:**
- Keep stores small and focused
- Use persist middleware for user preferences
- Use selectors to avoid re-renders
- Separate concerns (auth, UI, theme)

**General:**
- Choose the right tool for the state type
- Avoid prop drilling with proper state management
- Keep state as local as possible
- Use URL state for shareable filters

### ❌ DON'T

- Store server data in Zustand
- Put form state in global store
- Create one massive store
- Forget to handle error states
- Over-fetch data
- Duplicate state across stores

## Debugging

### React Query Devtools

Already configured in providers:
```typescript
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

<ReactQueryDevtools initialIsOpen={false} />
```

Access at: http://localhost:4000 (bottom-left icon)

### Zustand DevTools

```typescript
import { devtools } from 'zustand/middleware';

export const useStore = create<State>()(
  devtools(
    persist(
      (set) => ({
        // state
      }),
      { name: 'my-store' }
    ),
    { name: 'MyStore' }
  )
);
```

Use Redux DevTools extension to inspect Zustand stores.

<!-- AUTO-GENERATED: END -->
