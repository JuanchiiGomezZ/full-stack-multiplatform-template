# API Patterns

## Axios Client

Location: `src/shared/lib/api.ts`

### Configuration

```typescript
import { apiClient, getApiErrorMessage } from "@/shared/lib/api";

// Make requests
const response = await apiClient.get("/users");
const data = await apiClient.post("/users", { name: "John" });
```

### Features

- Base URL from environment (`NEXT_PUBLIC_API_URL`)
- Credentials included (cookies)
- 401 handling (redirect to login)

### Error Handling

```typescript
import { getApiErrorMessage } from "@/shared/lib/api";

try {
  await apiClient.post("/endpoint", data);
} catch (error) {
  const message = getApiErrorMessage(error);
  toast.error(message);
}
```

## TanStack Query

Location: `src/shared/lib/query.ts`

### Default Configuration

- `staleTime`: 5 minutes
- `gcTime`: 30 minutes
- `retry`: 1 (queries), 0 (mutations)
- `refetchOnWindowFocus`: false

### Query Keys Pattern

```typescript
// Define in feature hook file
export const userKeys = {
  all: ["users"] as const,
  lists: () => [...userKeys.all, "list"] as const,
  list: (filters: Filters) => [...userKeys.lists(), filters] as const,
  details: () => [...userKeys.all, "detail"] as const,
  detail: (id: string) => [...userKeys.details(), id] as const,
};
```

### Queries

```typescript
import { useQuery } from "@tanstack/react-query";

export function useUsers() {
  return useQuery({
    queryKey: userKeys.list(),
    queryFn: () => userService.getUsers(),
  });
}
```

### Mutations

```typescript
import { useMutation, useQueryClient } from "@tanstack/react-query";

export function useCreateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: userService.createUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
      toast.success("User created");
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error));
    },
  });
}
```

## Service Layer

Location: `src/features/[feature]/services/`

### Pattern

```typescript
// features/users/services/user.service.ts
import { apiClient } from "@/shared/lib/api";
import type { User, CreateUserDto } from "../types/user.types";

export const userService = {
  async getUsers(): Promise<User[]> {
    const { data } = await apiClient.get("/users");
    return data;
  },

  async createUser(dto: CreateUserDto): Promise<User> {
    const { data } = await apiClient.post("/users", dto);
    return data;
  },
};
```
