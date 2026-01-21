---
name: mobile-query
description: >
  Implements React Query patterns for API data fetching.
  Trigger: When fetching data, creating mutations, or caching API responses.
license: MIT
metadata:
  author: juanma-gomez
  version: "1.0"
  scope: [mobile]
  auto_invoke: "query, mutation, api, fetch, data, cache, tanstack, react query"
allowed-tools: Read, Edit, Write, Glob, Grep
---

## When to Use

- Fetching data from API
- Creating, updating, deleting resources
- Implementing optimistic updates
- Managing server state cache
- Invalidating queries after mutations

---

## Critical Rules - NON-NEGOTIABLE

### Service Layer

- **ALWAYS**: API calls in `features/{name}/services/`
- **ALWAYS**: Use `api` from `@/shared/lib/api`
- **NEVER**: Make API calls directly in components
- **NEVER**: Create new axios instances

### Query Hooks

- **ALWAYS**: Define query keys factory
- **ALWAYS**: Hooks in `features/{name}/hooks/`
- **ALWAYS**: Use `enabled` for conditional queries
- **NEVER**: Hardcode query keys as strings

### Mutations

- **ALWAYS**: Invalidate related queries on success
- **ALWAYS**: Show toast feedback on success/error
- **NEVER**: Forget error handling

---

## Decision Tree

```
Fetch single item? → useQuery with enabled: !!id
Fetch list? → useQuery with filters
Create/Update/Delete? → useMutation with invalidation
Need optimistic update? → onMutate + onError rollback
Paginated list? → useInfiniteQuery
```

---

## Workflow

### 1. Create Service

**File:** `features/{name}/services/{name}.service.ts`

### 2. Define Query Keys

```typescript
export const queryKeys = {
  all: ['products'] as const,
  lists: () => [...queryKeys.all, 'list'] as const,
  list: (filters: Filters) => [...queryKeys.lists(), filters] as const,
  details: () => [...queryKeys.all, 'detail'] as const,
  detail: (id: string) => [...queryKeys.details(), id] as const,
};
```

### 3. Create Hooks

**File:** `features/{name}/hooks/use{Name}.ts`

---

## Code Examples

### Service Layer

**File:** `features/products/services/products.service.ts`

```typescript
import { api } from '@/shared/lib/api';
import type { Product, CreateProductDto, UpdateProductDto } from '../types';

export const productsApi = {
  getAll: (params?: { page?: number; limit?: number; search?: string }) =>
    api.get<Product[]>('/products', { params }).then((res) => res.data),

  getById: (id: string) =>
    api.get<Product>(`/products/${id}`).then((res) => res.data),

  create: (data: CreateProductDto) =>
    api.post<Product>('/products', data).then((res) => res.data),

  update: (id: string, data: UpdateProductDto) =>
    api.patch<Product>(`/products/${id}`, data).then((res) => res.data),

  delete: (id: string) =>
    api.delete<void>(`/products/${id}`),
};
```

### Query Keys Factory

```typescript
// features/products/hooks/useProducts.ts
export const productsQueryKeys = {
  all: ['products'] as const,
  lists: () => [...productsQueryKeys.all, 'list'] as const,
  list: (filters: ProductFilters) => [...productsQueryKeys.lists(), filters] as const,
  details: () => [...productsQueryKeys.all, 'detail'] as const,
  detail: (id: string) => [...productsQueryKeys.details(), id] as const,
};
```

### Query Hook (List)

```typescript
import { useQuery } from '@tanstack/react-query';
import { productsApi } from '../services/products.service';

export function useProducts(filters?: ProductFilters) {
  return useQuery({
    queryKey: productsQueryKeys.list(filters || {}),
    queryFn: () => productsApi.getAll(filters),
  });
}
```

### Query Hook (Single Item)

```typescript
export function useProduct(id: string) {
  return useQuery({
    queryKey: productsQueryKeys.detail(id),
    queryFn: () => productsApi.getById(id),
    enabled: !!id, // Only fetch if id exists
  });
}
```

### Create Mutation

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-native-toast-message';

export function useCreateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: productsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productsQueryKeys.all });
      toast.show({ type: 'success', text1: 'Product created' });
    },
    onError: (error: any) => {
      toast.show({
        type: 'error',
        text1: error.response?.data?.message || 'Failed to create',
      });
    },
  });
}
```

### Update Mutation

```typescript
export function useUpdateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateProductDto }) =>
      productsApi.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: productsQueryKeys.detail(variables.id),
      });
      queryClient.invalidateQueries({ queryKey: productsQueryKeys.lists() });
      toast.show({ type: 'success', text1: 'Product updated' });
    },
    onError: (error: any) => {
      toast.show({
        type: 'error',
        text1: error.response?.data?.message || 'Failed to update',
      });
    },
  });
}
```

### Delete Mutation

```typescript
export function useDeleteProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: productsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productsQueryKeys.all });
      toast.show({ type: 'success', text1: 'Product deleted' });
    },
    onError: (error: any) => {
      toast.show({
        type: 'error',
        text1: error.response?.data?.message || 'Failed to delete',
      });
    },
  });
}
```

### Optimistic Update

```typescript
export function useToggleFavorite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, isFavorite }: { id: string; isFavorite: boolean }) =>
      productsApi.update(id, { isFavorite }),

    onMutate: async ({ id, isFavorite }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: productsQueryKeys.detail(id) });

      // Snapshot previous value
      const previousProduct = queryClient.getQueryData(productsQueryKeys.detail(id));

      // Optimistically update
      queryClient.setQueryData(productsQueryKeys.detail(id), (old: Product) => ({
        ...old,
        isFavorite,
      }));

      return { previousProduct };
    },

    onError: (err, { id }, context) => {
      // Rollback on error
      if (context?.previousProduct) {
        queryClient.setQueryData(productsQueryKeys.detail(id), context.previousProduct);
      }
    },

    onSettled: (_, __, { id }) => {
      // Refetch after settlement
      queryClient.invalidateQueries({ queryKey: productsQueryKeys.detail(id) });
    },
  });
}
```

### Using in Components

```typescript
function ProductList() {
  const { data, isLoading, error, refetch } = useProducts();
  const deleteProduct = useDeleteProduct();

  if (isLoading) return <ScreenWrapper loading />;
  if (error) return <ErrorState onRetry={refetch} />;

  return (
    <FlatList
      data={data}
      renderItem={({ item }) => (
        <ProductCard
          product={item}
          onDelete={() => deleteProduct.mutate(item.id)}
        />
      )}
    />
  );
}
```

### QueryClient Configuration

**File:** `app/providers.tsx`

```typescript
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // 1 minute
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

export function Providers({ children }) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
```

---

## Commands

```bash
# Create service
touch mobile/src/features/{name}/services/{name}.service.ts

# Create hooks
touch mobile/src/features/{name}/hooks/use{Name}.ts

# Check api instance
cat mobile/src/shared/lib/api.ts
```

---

## Checklist

- [ ] Service uses `api` from `@/shared/lib/api`
- [ ] Query keys factory defined
- [ ] Hooks in `features/{name}/hooks/`
- [ ] `enabled` used for conditional queries
- [ ] Mutations invalidate related queries
- [ ] Toast feedback on success/error
- [ ] No API calls in components

---

## Resources

- **API Instance**: `mobile/src/shared/lib/api.ts`
- **Auth Hooks**: `mobile/src/features/auth/hooks/useAuth.ts`
- **Providers**: `mobile/src/app/providers.tsx`
