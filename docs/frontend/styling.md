# Styling

## Tailwind CSS v4

### Configuration

CSS-based configuration in `src/app/globals.css`.

### Using Classes

```tsx
<div className="flex items-center justify-between p-4">
  <h1 className="text-2xl font-bold">Title</h1>
</div>
```

### The `cn()` Helper

Merge Tailwind classes conditionally:

```tsx
import { cn } from "@/shared/lib/utils";

<div className={cn("base-classes", isActive && "active-classes", className)} />;
```

## Theming

### CSS Variables

Defined in `globals.css`:

```css
:root {
  --background: 0 0% 100%;
  --foreground: 0 0% 3.9%;
  --primary: 0 0% 9%;
  /* ... */
}

.dark {
  --background: 0 0% 3.9%;
  --foreground: 0 0% 98%;
  /* ... */
}
```

### Semantic Colors

Use semantic color classes:

- `bg-background`, `text-foreground`
- `bg-primary`, `text-primary-foreground`
- `bg-muted`, `text-muted-foreground`
- `bg-destructive`, `text-destructive-foreground`

### Customizing Theme

Edit CSS variables in `globals.css` to change colors across the app.

## Responsive Design

```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
  {/* items */}
</div>
```

Breakpoints:

- `sm`: 640px
- `md`: 768px
- `lg`: 1024px
- `xl`: 1280px
- `2xl`: 1536px
