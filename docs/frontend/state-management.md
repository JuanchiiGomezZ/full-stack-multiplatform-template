# State Management

## Zustand

Used for client-side state that needs to persist or be shared across components.

### When to Use

| Use Zustand              | Use useState/useReducer |
| ------------------------ | ----------------------- |
| Shared across components | Local to component      |
| Needs persistence        | Ephemeral               |
| Complex state logic      | Simple state            |
| Auth, user preferences   | Form inputs, UI toggles |

### Store Pattern

Location: `src/features/[feature]/stores/[name].store.ts`

```typescript
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

interface MyState {
  count: number;
}

interface MyActions {
  increment: () => void;
  reset: () => void;
}

type MyStore = MyState & MyActions;

const initialState: MyState = {
  count: 0,
};

export const useMyStore = create<MyStore>()(
  persist(
    (set) => ({
      ...initialState,
      increment: () => set((state) => ({ count: state.count + 1 })),
      reset: () => set(initialState),
    }),
    {
      name: "my-storage",
      storage: createJSONStorage(() => localStorage),
    }
  )
);
```

### Usage

```typescript
import { useMyStore } from "@features/example/stores/my.store";

function MyComponent() {
  const { count, increment } = useMyStore();

  return <button onClick={increment}>Count: {count}</button>;
}
```

### Selectors (Performance)

```typescript
// Select only what you need
const count = useMyStore((state) => state.count);
const increment = useMyStore((state) => state.increment);
```

### Auth Store Example

See `src/features/auth/stores/auth.store.ts` for a complete example with:

- User state
- Persistence
- Login/logout actions

## Global vs Feature Stores

| Global (`shared/stores/`) | Feature (`features/[x]/stores/`) |
| ------------------------- | -------------------------------- |
| App-wide state            | Feature-specific state           |
| Theme, layout             | Feature data                     |
| Rarely used               | Common pattern                   |
