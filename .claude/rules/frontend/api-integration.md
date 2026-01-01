# Frontend: API Integration

<!-- AUTO-GENERATED: START -->

## Stack

- **HTTP Client:** Axios
- **State Management:** React Query (TanStack Query)
- **Base URL:** Environment variable `NEXT_PUBLIC_API_URL`

## Axios Configuration

**File:** `frontend/src/shared/lib/axios.ts`

```typescript
import axios from 'axios';
import { useAuthStore } from '@/features/auth/stores/auth.store';

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor (add auth token)
api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor (handle errors)
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Handle 401 (unauthorized)
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const { logout } = useAuthStore.getState();
        logout();
        window.location.href = '/login';
      } catch (err) {
        return Promise.reject(err);
      }
    }

    return Promise.reject(error);
  }
);
```

## Service Layer Pattern

**File:** `frontend/src/features/users/services/users.service.ts`

```typescript
import { api } from '@/shared/lib/axios';
import type {
  User,
  CreateUserData,
  UpdateUserData,
  PaginationParams,
  PaginatedResponse,
} from '../types/users.types';

export const usersApi = {
  // Get all users (paginated)
  getAll: async (params: PaginationParams): Promise<PaginatedResponse<User>> => {
    const { data } = await api.get('/users', { params });
    return data;
  },

  // Get single user
  getById: async (id: string): Promise<User> => {
    const { data } = await api.get(`/users/${id}`);
    return data;
  },

  // Get current user
  getMe: async (): Promise<User> => {
    const { data } = await api.get('/users/me');
    return data;
  },

  // Create user
  create: async (userData: CreateUserData): Promise<User> => {
    const { data } = await api.post('/users', userData);
    return data;
  },

  // Update user
  update: async (id: string, userData: UpdateUserData): Promise<User> => {
    const { data } = await api.patch(`/users/${id}`, userData);
    return data;
  },

  // Delete user
  delete: async (id: string): Promise<void> => {
    await api.delete(`/users/${id}`);
  },
};
```

## React Query Integration

**File:** `frontend/src/features/users/hooks/useUsers.ts`

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usersApi } from '../services/users.service';
import { toast } from 'sonner';

// Query hook
export function useUsers(page: number = 1, limit: number = 10) {
  return useQuery({
    queryKey: ['users', { page, limit }],
    queryFn: () => usersApi.getAll({ page, limit }),
  });
}

// Single user query
export function useUser(id: string) {
  return useQuery({
    queryKey: ['users', id],
    queryFn: () => usersApi.getById(id),
    enabled: !!id, // Only run if ID exists
  });
}

// Current user query
export function useCurrentUser() {
  return useQuery({
    queryKey: ['users', 'me'],
    queryFn: usersApi.getMe,
  });
}

// Create mutation
export function useCreateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: usersApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('User created successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create user');
    },
  });
}

// Update mutation
export function useUpdateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateUserData }) =>
      usersApi.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['users', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('User updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update user');
    },
  });
}

// Delete mutation
export function useDeleteUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: usersApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('User deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete user');
    },
  });
}
```

## Usage in Components

```typescript
'use client';

import { useUsers, useDeleteUser } from '@/features/users/hooks/useUsers';
import { Button } from '@/shared/components/ui/button';

export function UsersList() {
  const { data, isLoading, error } = useUsers(1, 10);
  const deleteUser = useDeleteUser();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  const handleDelete = (id: string) => {
    if (confirm('Are you sure?')) {
      deleteUser.mutate(id);
    }
  };

  return (
    <div>
      {data.data.map((user) => (
        <div key={user.id} className="flex items-center justify-between p-4">
          <div>
            <p>{user.email}</p>
            <p className="text-sm text-gray-600">{user.role}</p>
          </div>
          <Button
            variant="destructive"
            onClick={() => handleDelete(user.id)}
            disabled={deleteUser.isPending}
          >
            Delete
          </Button>
        </div>
      ))}
    </div>
  );
}
```

## Type Definitions

**File:** `frontend/src/features/users/types/users.types.ts`

```typescript
export interface User {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: 'USER' | 'ADMIN' | 'SUPER_ADMIN';
  isActive: boolean;
  emailVerified: boolean;
  organizationId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserData {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  role?: 'USER' | 'ADMIN' | 'SUPER_ADMIN';
  organizationId?: string;
}

export interface UpdateUserData {
  email?: string;
  firstName?: string;
  lastName?: string;
  role?: 'USER' | 'ADMIN' | 'SUPER_ADMIN';
  isActive?: boolean;
}

export interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
```

## Error Handling

```typescript
import { AxiosError } from 'axios';

interface APIError {
  statusCode: number;
  message: string;
  error: string;
}

export function useCreateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: usersApi.create,
    onError: (error: AxiosError<APIError>) => {
      if (error.response) {
        // Server responded with error
        const { statusCode, message } = error.response.data;

        switch (statusCode) {
          case 400:
            toast.error(`Validation error: ${message}`);
            break;
          case 401:
            toast.error('Unauthorized. Please login.');
            break;
          case 403:
            toast.error('You don't have permission to do this.');
            break;
          case 409:
            toast.error('Email already exists.');
            break;
          default:
            toast.error(message || 'Something went wrong');
        }
      } else if (error.request) {
        // Request made but no response
        toast.error('Network error. Please check your connection.');
      } else {
        // Something else happened
        toast.error('An unexpected error occurred');
      }
    },
  });
}
```

## File Upload

```typescript
export const uploadApi = {
  uploadImage: async (file: File): Promise<{ key: string; url: string }> => {
    const formData = new FormData();
    formData.append('file', file);

    const { data } = await api.post('/upload/image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return data;
  },

  uploadDocument: async (file: File): Promise<{ key: string; url: string }> => {
    const formData = new FormData();
    formData.append('file', file);

    const { data } = await api.post('/upload/document', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return data;
  },
};

// Hook
export function useUploadImage() {
  return useMutation({
    mutationFn: uploadApi.uploadImage,
    onSuccess: () => {
      toast.success('Image uploaded successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Upload failed');
    },
  });
}
```

## Request Cancellation

```typescript
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

export function useSearchUsers(query: string) {
  return useQuery({
    queryKey: ['users', 'search', query],
    queryFn: async ({ signal }) => {
      const { data } = await api.get('/users/search', {
        params: { q: query },
        signal, // Pass AbortSignal to axios
      });
      return data;
    },
    enabled: query.length > 2, // Only search if query is long enough
  });
}
```

## Optimistic Updates

```typescript
export function useUpdateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateUserData }) =>
      usersApi.update(id, data),
    onMutate: async ({ id, data }) => {
      // Cancel outgoing queries
      await queryClient.cancelQueries({ queryKey: ['users', id] });

      // Snapshot previous value
      const previousUser = queryClient.getQueryData(['users', id]);

      // Optimistically update
      queryClient.setQueryData(['users', id], (old: User) => ({
        ...old,
        ...data,
      }));

      return { previousUser };
    },
    onError: (err, { id }, context) => {
      // Rollback on error
      if (context?.previousUser) {
        queryClient.setQueryData(['users', id], context.previousUser);
      }
      toast.error('Update failed');
    },
    onSettled: (_, __, { id }) => {
      // Refetch after mutation
      queryClient.invalidateQueries({ queryKey: ['users', id] });
    },
  });
}
```

## Polling

```typescript
export function useUserStatus(userId: string) {
  return useQuery({
    queryKey: ['users', userId, 'status'],
    queryFn: () => usersApi.getStatus(userId),
    refetchInterval: 5000, // Poll every 5 seconds
  });
}
```

## Infinite Scrolling

```typescript
import { useInfiniteQuery } from '@tanstack/react-query';

export function useInfiniteUsers() {
  return useInfiniteQuery({
    queryKey: ['users', 'infinite'],
    queryFn: ({ pageParam = 1 }) =>
      usersApi.getAll({ page: pageParam, limit: 20 }),
    getNextPageParam: (lastPage) => {
      const { page, totalPages } = lastPage.meta;
      return page < totalPages ? page + 1 : undefined;
    },
    initialPageParam: 1,
  });
}

// Usage
function InfiniteUsersList() {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteUsers();

  return (
    <div>
      {data?.pages.map((page) =>
        page.data.map((user) => <UserCard key={user.id} user={user} />)
      )}

      {hasNextPage && (
        <Button onClick={() => fetchNextPage()} disabled={isFetchingNextPage}>
          {isFetchingNextPage ? 'Loading...' : 'Load More'}
        </Button>
      )}
    </div>
  );
}
```

## Best Practices

### ✅ DO

- Use service layer pattern
- Type all API responses
- Handle all error cases
- Use React Query for caching
- Implement optimistic updates
- Show loading/error states
- Cancel requests when component unmounts
- Use environment variables for URLs

### ❌ DON'T

- Make API calls directly in components
- Forget to handle errors
- Skip loading states
- Hardcode API URLs
- Duplicate API call logic
- Ignore network errors
- Store API data in Zustand

<!-- AUTO-GENERATED: END -->
