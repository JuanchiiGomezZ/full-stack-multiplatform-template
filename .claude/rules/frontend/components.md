# Frontend: Components

<!-- AUTO-GENERATED: START -->

## UI Library Stack

- **Base:** React 19
- **Component Library:** Radix UI
- **Styling:** Tailwind CSS 4
- **Utilities:** shadcn/ui components
- **Icons:** lucide-react
- **Animations:** motion (framer-motion)

## Component Structure

### shadcn/ui Components

Location: `frontend/src/shared/components/ui/`

**Installed components:**
- `button.tsx`
- `card.tsx`
- `dialog.tsx`
- `dropdown-menu.tsx`
- `form.tsx`
- `input.tsx`
- `label.tsx`
- `sheet.tsx`
- `sonner.tsx` (toast notifications)
- `table.tsx`

**See:** `frontend/src/shared/components/ui/button.tsx:1-50`

### Example: Button Component

```typescript
import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/shared/utils/cn';

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
        outline: 'border border-input bg-background hover:bg-accent',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 rounded-md px-3',
        lg: 'h-11 rounded-md px-8',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
```

**Usage:**
```typescript
import { Button } from '@/shared/components/ui/button';

<Button variant="default">Click me</Button>
<Button variant="outline" size="sm">Small button</Button>
<Button variant="destructive">Delete</Button>
```

## Shared Components

Location: `frontend/src/shared/components/common/`

### Custom Component Pattern

```typescript
// Header.tsx
import { Button } from '@/shared/components/ui/button';
import { useAuth } from '@/features/auth';

export function Header() {
  const { user, logout } = useAuth();

  return (
    <header className="border-b">
      <div className="container mx-auto flex items-center justify-between py-4">
        <div className="text-xl font-bold">Your App</div>

        {user ? (
          <div className="flex items-center gap-4">
            <span>{user.email}</span>
            <Button variant="ghost" onClick={logout}>
              Logout
            </Button>
          </div>
        ) : (
          <Button>Login</Button>
        )}
      </div>
    </header>
  );
}
```

## Feature Components

Location: `frontend/src/features/{feature-name}/components/`

**Example:** Auth feature components

Location: `frontend/src/features/auth/components/`

### Form Component Pattern

```typescript
// LoginForm.tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/shared/components/ui/form';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

type LoginFormData = z.infer<typeof loginSchema>;

interface LoginFormProps {
  onSubmit: (data: LoginFormData) => Promise<void>;
  isLoading?: boolean;
}

export function LoginForm({ onSubmit, isLoading }: LoginFormProps) {
  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" placeholder="you@example.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <Input type="password" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? 'Logging in...' : 'Login'}
        </Button>
      </form>
    </Form>
  );
}
```

## Styling with Tailwind

### Utility Classes

```typescript
// Layout
<div className="container mx-auto px-4">
<div className="flex items-center justify-between">
<div className="grid grid-cols-3 gap-4">

// Spacing
<div className="p-4 m-2">  // padding, margin
<div className="space-y-4">  // vertical spacing between children

// Typography
<h1 className="text-2xl font-bold">
<p className="text-gray-600 dark:text-gray-400">

// Colors
<div className="bg-white dark:bg-gray-800">
<div className="text-primary bg-primary-foreground">

// Borders & Radius
<div className="border border-gray-200 rounded-lg">

// Responsive
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
```

### cn() Utility

Location: `frontend/src/shared/utils/cn.ts`

```typescript
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

**Usage:**
```typescript
<div className={cn(
  'base-classes',
  condition && 'conditional-classes',
  className // Allow override from props
)} />
```

## Animation with motion

```typescript
import { motion } from 'motion/react';

export function FadeIn({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
    >
      {children}
    </motion.div>
  );
}
```

**Common animations:**
```typescript
// Fade in
<motion.div
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
/>

// Slide in
<motion.div
  initial={{ x: -100 }}
  animate={{ x: 0 }}
/>

// Scale
<motion.button
  whileHover={{ scale: 1.05 }}
  whileTap={{ scale: 0.95 }}
/>
```

## Dialog Pattern

```typescript
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/shared/components/ui/dialog';
import { Button } from '@/shared/components/ui/button';

export function DeleteUserDialog({ userId }: { userId: string }) {
  const [open, setOpen] = useState(false);

  const handleDelete = async () => {
    await deleteUser(userId);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="destructive">Delete</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Are you sure?</DialogTitle>
          <DialogDescription>
            This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleDelete}>
            Delete
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

## Toast Notifications

```typescript
import { toast } from 'sonner';

// Success
toast.success('User created successfully');

// Error
toast.error('Failed to create user');

// Info
toast.info('Please verify your email');

// Custom
toast('New notification', {
  description: 'Additional details here',
  action: {
    label: 'Undo',
    onClick: () => console.log('Undo'),
  },
});
```

**Setup in layout:**
```typescript
import { Toaster } from '@/shared/components/ui/sonner';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
```

## Component Testing

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { LoginForm } from './LoginForm';

describe('LoginForm', () => {
  it('renders form fields', () => {
    render(<LoginForm onSubmit={vi.fn()} />);

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
  });

  it('shows validation errors', async () => {
    render(<LoginForm onSubmit={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: /login/i }));

    await waitFor(() => {
      expect(screen.getByText(/invalid email/i)).toBeInTheDocument();
    });
  });
});
```

## Best Practices

### ✅ DO

- Use shadcn/ui for base components
- Keep components under 200 lines
- Extract logic to custom hooks
- Use TypeScript for props
- Co-locate feature components
- Use Tailwind utilities over custom CSS
- Implement proper accessibility (ARIA labels)
- Test user interactions

### ❌ DON'T

- Create wrapper components unnecessarily
- Mix feature logic with UI components
- Inline complex logic in JSX
- Forget to handle loading/error states
- Use inline styles
- Duplicate component code
- Skip prop type definitions

## Adding shadcn/ui Components

```bash
cd frontend

# Add individual components
npx shadcn@latest add button
npx shadcn@latest add dialog
npx shadcn@latest add form

# Components are added to src/shared/components/ui/
```

<!-- AUTO-GENERATED: END -->
