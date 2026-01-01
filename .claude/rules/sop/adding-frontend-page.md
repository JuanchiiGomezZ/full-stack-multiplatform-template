# SOP: Adding a Frontend Page

<!-- AUTO-GENERATED: START -->

## Overview

Step-by-step guide for adding a new page/feature to the Next.js frontend, following the patterns established in the `auth` feature.

**Canonical example:** `frontend/src/features/auth/`

## Steps

### 1. Create Feature Structure

```bash
cd frontend/src/features

# Create feature directory
mkdir products
cd products

# Create subdirectories
mkdir components hooks services stores types utils

# Create index file
touch index.ts
```

**Result:**
```
features/products/
├── components/
├── hooks/
├── services/
├── stores/
├── types/
├── utils/
└── index.ts
```

### 2. Define Types

**File:** `frontend/src/features/products/types/products.types.ts`

```typescript
export interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  stock: number;
  isActive: boolean;
  organizationId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProductData {
  name: string;
  description?: string;
  price: number;
  stock?: number;
}

export interface UpdateProductData {
  name?: string;
  description?: string;
  price?: number;
  stock?: number;
  isActive?: boolean;
}

export interface ProductsFilters {
  page: number;
  limit: number;
  search?: string;
}
```

### 3. Create API Service

**File:** `frontend/src/features/products/services/products.service.ts`

```typescript
import { api } from '@/shared/lib/axios';
import type {
  Product,
  CreateProductData,
  UpdateProductData,
  ProductsFilters,
} from '../types/products.types';
import type { PaginatedResponse } from '@/shared/types/common.types';

export const productsApi = {
  getAll: async (filters: ProductsFilters): Promise<PaginatedResponse<Product>> => {
    const { data } = await api.get('/products', { params: filters });
    return data;
  },

  getById: async (id: string): Promise<Product> => {
    const { data } = await api.get(`/products/${id}`);
    return data;
  },

  create: async (productData: CreateProductData): Promise<Product> => {
    const { data } = await api.post('/products', productData);
    return data;
  },

  update: async (id: string, productData: UpdateProductData): Promise<Product> => {
    const { data } = await api.patch(`/products/${id}`, productData);
    return data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/products/${id}`);
  },
};
```

### 4. Create React Query Hooks

**File:** `frontend/src/features/products/hooks/useProducts.ts`

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productsApi } from '../services/products.service';
import { toast } from 'sonner';
import type { CreateProductData, UpdateProductData } from '../types/products.types';

export function useProducts(page: number = 1, limit: number = 10) {
  return useQuery({
    queryKey: ['products', { page, limit }],
    queryFn: () => productsApi.getAll({ page, limit }),
  });
}

export function useProduct(id: string) {
  return useQuery({
    queryKey: ['products', id],
    queryFn: () => productsApi.getById(id),
    enabled: !!id,
  });
}

export function useCreateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: productsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Product created successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create product');
    },
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateProductData }) =>
      productsApi.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['products', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Product updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update product');
    },
  });
}

export function useDeleteProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: productsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Product deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete product');
    },
  });
}
```

### 5. Create Form Component

**File:** `frontend/src/features/products/components/ProductForm.tsx`

```typescript
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/shared/components/ui/form';
import type { Product } from '../types/products.types';

const productSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  description: z.string().optional(),
  price: z.coerce.number().positive('Price must be positive'),
  stock: z.coerce.number().int().min(0).default(0),
});

type ProductFormData = z.infer<typeof productSchema>;

interface ProductFormProps {
  product?: Product;
  onSubmit: (data: ProductFormData) => Promise<void>;
  isLoading?: boolean;
}

export function ProductForm({ product, onSubmit, isLoading }: ProductFormProps) {
  const form = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: product?.name || '',
      description: product?.description || '',
      price: product?.price || 0,
      stock: product?.stock || 0,
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="price"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Price</FormLabel>
              <FormControl>
                <Input type="number" step="0.01" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="stock"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Stock</FormLabel>
              <FormControl>
                <Input type="number" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? 'Saving...' : product ? 'Update Product' : 'Create Product'}
        </Button>
      </form>
    </Form>
  );
}
```

### 6. Create Page Route

**File:** `frontend/src/app/[locale]/(tool)/products/page.tsx`

```typescript
'use client';

import { useState } from 'react';
import { useProducts, useDeleteProduct } from '@/features/products/hooks/useProducts';
import { Button } from '@/shared/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/components/ui/table';

export default function ProductsPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading, error } = useProducts(page, 10);
  const deleteProduct = useDeleteProduct();

  if (isLoading) {
    return <div className="p-8">Loading...</div>;
  }

  if (error) {
    return <div className="p-8">Error: {error.message}</div>;
  }

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this product?')) {
      deleteProduct.mutate(id);
    }
  };

  return (
    <div className="container mx-auto p-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold">Products</h1>
        <Button onClick={() => (window.location.href = '/products/new')}>
          Create Product
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Price</TableHead>
            <TableHead>Stock</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.data.map((product) => (
            <TableRow key={product.id}>
              <TableCell>{product.name}</TableCell>
              <TableCell>${product.price.toFixed(2)}</TableCell>
              <TableCell>{product.stock}</TableCell>
              <TableCell>
                {product.isActive ? 'Active' : 'Inactive'}
              </TableCell>
              <TableCell className="space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => (window.location.href = `/products/${product.id}`)}
                >
                  Edit
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDelete(product.id)}
                  disabled={deleteProduct.isPending}
                >
                  Delete
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {data && data.meta.totalPages > 1 && (
        <div className="mt-4 flex justify-center gap-2">
          <Button
            variant="outline"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            Previous
          </Button>
          <span className="flex items-center px-4">
            Page {page} of {data.meta.totalPages}
          </span>
          <Button
            variant="outline"
            onClick={() => setPage((p) => p + 1)}
            disabled={page === data.meta.totalPages}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
```

### 7. Create New Product Page

**File:** `frontend/src/app/[locale]/(tool)/products/new/page.tsx`

```typescript
'use client';

import { useRouter } from 'next/navigation';
import { useCreateProduct } from '@/features/products/hooks/useProducts';
import { ProductForm } from '@/features/products/components/ProductForm';

export default function NewProductPage() {
  const router = useRouter();
  const createProduct = useCreateProduct();

  const handleSubmit = async (data: any) => {
    await createProduct.mutateAsync(data);
    router.push('/products');
  };

  return (
    <div className="container mx-auto max-w-2xl p-8">
      <h1 className="mb-6 text-3xl font-bold">Create Product</h1>
      <ProductForm
        onSubmit={handleSubmit}
        isLoading={createProduct.isPending}
      />
    </div>
  );
}
```

### 8. Export from Feature Index

**File:** `frontend/src/features/products/index.ts`

```typescript
export * from './components/ProductForm';
export * from './hooks/useProducts';
export * from './services/products.service';
export * from './types/products.types';
```

### 9. Add Navigation Link

**File:** `frontend/src/shared/components/common/Header.tsx` (or Sidebar)

```typescript
<nav>
  <Link href="/dashboard">Dashboard</Link>
  <Link href="/products">Products</Link>
  <Link href="/settings">Settings</Link>
</nav>
```

### 10. Test the Feature

```bash
# Start dev server
cd frontend
npm run dev

# Open browser
# http://localhost:4000/en/products

# Test:
# - Create product
# - List products
# - Edit product
# - Delete product
# - Pagination
```

## Checklist

- [ ] Create feature directory structure
- [ ] Define TypeScript types
- [ ] Create API service
- [ ] Create React Query hooks
- [ ] Create form component
- [ ] Create list page
- [ ] Create create/edit pages
- [ ] Export from feature index
- [ ] Add navigation links
- [ ] Test all CRUD operations
- [ ] Test loading/error states
- [ ] Test pagination
- [ ] Add tests if needed

## Common Patterns

**Feature structure:**
```
features/feature-name/
├── components/       # Feature-specific components
├── hooks/           # React Query hooks
├── services/        # API integration
├── stores/          # Zustand stores (if needed)
├── types/           # TypeScript types
├── utils/           # Helper functions
└── index.ts         # Public API
```

**Hook pattern:**
```typescript
export function useResource(id: string) {
  return useQuery({
    queryKey: ['resource', id],
    queryFn: () => api.getById(id),
    enabled: !!id,
  });
}
```

**Mutation pattern:**
```typescript
export function useCreateResource() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resources'] });
      toast.success('Created');
    },
  });
}
```

<!-- AUTO-GENERATED: END -->
