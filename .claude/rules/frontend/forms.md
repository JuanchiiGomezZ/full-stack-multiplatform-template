# Frontend: Forms

<!-- AUTO-GENERATED: START -->

## Stack

- **Form Library:** React Hook Form
- **Validation:** Zod
- **Integration:** `@hookform/resolvers`
- **UI:** shadcn/ui Form components

## Basic Form Pattern

```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/shared/components/ui/form';

// 1. Define schema
const formSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

type FormData = z.infer<typeof formSchema>;

// 2. Create component
export function LoginForm() {
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = (data: FormData) => {
    console.log(data);
  };

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
              <FormDescription>Your email address</FormDescription>
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

        <Button type="submit">Submit</Button>
      </form>
    </Form>
  );
}
```

## Validation Schemas

### Common Patterns

```typescript
import { z } from 'zod';

// Email
email: z.string().email('Invalid email'),

// Password with requirements
password: z
  .string()
  .min(8, 'Must be at least 8 characters')
  .regex(/[A-Z]/, 'Must contain uppercase letter')
  .regex(/[0-9]/, 'Must contain number'),

// Optional string
firstName: z.string().optional(),

// String with max length
bio: z.string().max(500, 'Bio must be less than 500 characters'),

// Number
age: z.coerce.number().int().min(18).max(120),

// Boolean
agreedToTerms: z.boolean().refine((val) => val === true, {
  message: 'You must agree to the terms',
}),

// Enum
role: z.enum(['USER', 'ADMIN', 'SUPER_ADMIN']),

// Array
tags: z.array(z.string()).min(1, 'At least one tag required'),

// Object
address: z.object({
  street: z.string(),
  city: z.string(),
  zipCode: z.string(),
}),

// UUID
id: z.string().uuid(),

// URL
website: z.string().url(),

// Date
birthDate: z.coerce.date(),

// Conditional validation
password: z.string().min(8),
confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

// Custom validation
username: z.string().refine(
  async (val) => {
    const exists = await checkUsernameExists(val);
    return !exists;
  },
  { message: 'Username already taken' }
),
```

### Reusable Schemas

```typescript
// shared/validation/common.schemas.ts
export const emailSchema = z.string().email('Invalid email address');

export const passwordSchema = z
  .string()
  .min(8, 'Must be at least 8 characters');

export const nameSchema = z
  .string()
  .min(2, 'Must be at least 2 characters')
  .max(50, 'Must be less than 50 characters');

// Use in forms
const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  firstName: nameSchema,
  lastName: nameSchema,
});
```

## Complex Form Examples

### Multi-Step Form

```typescript
import { useState } from 'react';

const step1Schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

const step2Schema = z.object({
  firstName: z.string(),
  lastName: z.string(),
});

const fullSchema = step1Schema.merge(step2Schema);

export function MultiStepForm() {
  const [step, setStep] = useState(1);

  const form = useForm({
    resolver: zodResolver(fullSchema),
    mode: 'onBlur',
  });

  const onSubmit = (data) => {
    console.log('Final data:', data);
  };

  const nextStep = async () => {
    const valid = await form.trigger(
      step === 1 ? ['email', 'password'] : ['firstName', 'lastName']
    );

    if (valid) setStep((s) => s + 1);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        {step === 1 && (
          <>
            <FormField name="email" />
            <FormField name="password" />
            <Button type="button" onClick={nextStep}>
              Next
            </Button>
          </>
        )}

        {step === 2 && (
          <>
            <FormField name="firstName" />
            <FormField name="lastName" />
            <Button type="button" onClick={() => setStep(1)}>
              Back
            </Button>
            <Button type="submit">Submit</Button>
          </>
        )}
      </form>
    </Form>
  );
}
```

### Dynamic Fields (Array)

```typescript
import { useFieldArray } from 'react-hook-form';

const schema = z.object({
  emails: z.array(
    z.object({
      email: z.string().email(),
    })
  ).min(1, 'At least one email required'),
});

export function EmailListForm() {
  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      emails: [{ email: '' }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'emails',
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(console.log)}>
        {fields.map((field, index) => (
          <div key={field.id} className="flex gap-2">
            <FormField
              control={form.control}
              name={`emails.${index}.email`}
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button
              type="button"
              variant="destructive"
              onClick={() => remove(index)}
            >
              Remove
            </Button>
          </div>
        ))}

        <Button
          type="button"
          variant="outline"
          onClick={() => append({ email: '' })}
        >
          Add Email
        </Button>

        <Button type="submit">Submit</Button>
      </form>
    </Form>
  );
}
```

### File Upload

```typescript
const schema = z.object({
  avatar: z
    .instanceof(FileList)
    .refine((files) => files.length > 0, 'Image required')
    .refine((files) => files[0]?.size <= 5000000, 'Max size is 5MB')
    .refine(
      (files) => ['image/jpeg', 'image/png'].includes(files[0]?.type),
      'Only .jpg and .png formats are supported'
    ),
});

export function AvatarForm() {
  const form = useForm({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data) => {
    const file = data.avatar[0];
    const formData = new FormData();
    formData.append('file', file);

    await uploadAvatar(formData);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <FormField
          control={form.control}
          name="avatar"
          render={({ field: { value, onChange, ...field } }) => (
            <FormItem>
              <FormLabel>Avatar</FormLabel>
              <FormControl>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => onChange(e.target.files)}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit">Upload</Button>
      </form>
    </Form>
  );
}
```

## Form Integration with React Query

```typescript
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';

export function CreateUserForm() {
  const form = useForm<CreateUserData>({
    resolver: zodResolver(createUserSchema),
  });

  const createUser = useMutation({
    mutationFn: usersApi.create,
    onSuccess: () => {
      toast.success('User created');
      form.reset();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const onSubmit = (data: CreateUserData) => {
    createUser.mutate(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        {/* fields */}
        <Button type="submit" disabled={createUser.isPending}>
          {createUser.isPending ? 'Creating...' : 'Create User'}
        </Button>
      </form>
    </Form>
  );
}
```

## Form State Management

```typescript
// Check if form is dirty
const isDirty = form.formState.isDirty;

// Check specific field errors
const emailError = form.formState.errors.email;

// Check if form is valid
const isValid = form.formState.isValid;

// Check if submitting
const isSubmitting = form.formState.isSubmitting;

// Get touched fields
const touchedFields = form.formState.touchedFields;

// Watch specific field
const email = form.watch('email');

// Watch all fields
const values = form.watch();

// Set field value
form.setValue('email', 'new@email.com');

// Set error manually
form.setError('email', {
  type: 'manual',
  message: 'This email is already taken',
});

// Clear errors
form.clearErrors('email');

// Reset form
form.reset();

// Reset to specific values
form.reset({ email: 'default@email.com', password: '' });
```

## Validation Modes

```typescript
const form = useForm({
  mode: 'onSubmit',    // Validate on submit (default)
  mode: 'onBlur',      // Validate when field loses focus
  mode: 'onChange',    // Validate on every change (performance cost)
  mode: 'onTouched',   // Validate after field is touched
  mode: 'all',         // Validate on blur and change

  reValidateMode: 'onChange', // Re-validate on change after first submit
});
```

## Server-Side Validation

```typescript
const onSubmit = async (data) => {
  try {
    await api.createUser(data);
  } catch (error) {
    if (error.response?.data?.errors) {
      // Map server errors to form fields
      Object.entries(error.response.data.errors).forEach(([field, message]) => {
        form.setError(field as any, {
          type: 'server',
          message: message as string,
        });
      });
    }
  }
};
```

## Best Practices

### ✅ DO

- Use Zod for type-safe validation
- Define schemas outside components
- Use FormField component for consistency
- Handle loading/error states
- Reset form after successful submission
- Provide helpful error messages
- Use appropriate validation modes
- Implement server-side validation fallback

### ❌ DON'T

- Validate on every keystroke unless necessary
- Forget to handle submission errors
- Use uncontrolled inputs with React Hook Form
- Skip error messages
- Over-complicate validation
- Duplicate validation logic

## Testing Forms

```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

describe('LoginForm', () => {
  it('shows validation errors', async () => {
    render(<LoginForm onSubmit={vi.fn()} />);

    const submitButton = screen.getByRole('button', { name: /submit/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/invalid email/i)).toBeInTheDocument();
    });
  });

  it('submits valid data', async () => {
    const onSubmit = vi.fn();
    render(<LoginForm onSubmit={onSubmit} />);

    await userEvent.type(screen.getByLabelText(/email/i), 'test@example.com');
    await userEvent.type(screen.getByLabelText(/password/i), 'password123');

    fireEvent.click(screen.getByRole('button', { name: /submit/i }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });
    });
  });
});
```

<!-- AUTO-GENERATED: END -->
