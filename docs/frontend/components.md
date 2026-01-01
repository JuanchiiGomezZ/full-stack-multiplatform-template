# Components

## UI Components (shadcn/ui)

Location: `src/shared/components/ui/`

### Installed Components

- `button.tsx` - Button variants
- `input.tsx` - Text inputs
- `label.tsx` - Form labels
- `dialog.tsx` - Modal dialogs
- `sheet.tsx` - Side panels
- `dropdown-menu.tsx` - Dropdown menus
- `card.tsx` - Card containers
- `table.tsx` - Data tables
- `sonner.tsx` - Toast notifications
- `form.tsx` - Form wrapper (with react-hook-form)

### Adding Components

```bash
npx shadcn@latest add [component-name]
```

Components are added to `src/shared/components/ui/` automatically.

### Usage Example

```tsx
import { Button } from "@/shared/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";

export function MyComponent() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Title</CardTitle>
      </CardHeader>
      <CardContent>
        <Button variant="default">Click me</Button>
      </CardContent>
    </Card>
  );
}
```

## Custom Shared Components

Location: `src/shared/components/common/`

For reusable components not from shadcn/ui.

### Guidelines

- Must be generic and reusable
- No feature-specific logic
- Props should be typed explicitly
- Include JSDoc comments

## Feature Components

Location: `src/features/[feature]/components/`

Components specific to a feature that shouldn't be shared.

### Guidelines

- Can use shared components
- Can use feature hooks and services
- Export via feature's `index.ts` if used elsewhere
