# Testing

## Vitest + Testing Library

### Running Tests

```bash
npm run test          # Watch mode
npm run test -- --run # Single run
npm run test:coverage # With coverage
```

### Test Location

Place tests next to the file they test:

```
components/
├── Button.tsx
└── Button.test.tsx
```

Or in `__tests__` folder:

```
components/
├── Button.tsx
└── __tests__/
    └── Button.test.tsx
```

## Writing Tests

### Basic Component Test

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@test/utils";
import { Button } from "./Button";

describe("Button", () => {
  it("renders correctly", () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole("button")).toBeInTheDocument();
  });
});
```

### With User Interaction

```tsx
import { render, screen } from "@test/utils";
import userEvent from "@testing-library/user-event";

it("handles click", async () => {
  const user = userEvent.setup();
  const onClick = vi.fn();

  render(<Button onClick={onClick}>Click</Button>);
  await user.click(screen.getByRole("button"));

  expect(onClick).toHaveBeenCalled();
});
```

## Test Utilities

Location: `src/test/utils.tsx`

Custom `render` wraps components with QueryClient provider.

```tsx
import { render, screen } from "@test/utils";
```

## Mocking

### Next.js Navigation

Mocked globally in `src/test/setup.ts`:

```typescript
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => "/",
}));
```

### API Calls

```typescript
vi.mock("@/shared/lib/api", () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));
```
