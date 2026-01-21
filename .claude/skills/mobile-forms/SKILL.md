---
name: mobile-forms
description: >
  Implements React Hook Form with Zod validation patterns.
  Trigger: When creating forms, handling validation, or input management.
license: MIT
metadata:
  author: juanma-gomez
  version: "1.0"
  scope: [mobile]
  auto_invoke: "form, validation, zod, input, submit, react hook form"
allowed-tools: Read, Edit, Write, Glob, Grep
---

## When to Use

- Creating any form (login, register, edit)
- Adding validation rules
- Handling form submission
- Managing form state

---

## Critical Rules - NON-NEGOTIABLE

### Form Library

- **ALWAYS**: React Hook Form + Zod
- **ALWAYS**: `zodResolver` for validation
- **ALWAYS**: `Controller` for controlled inputs
- **NEVER**: Manual form state management
- **NEVER**: class-validator or yup

### Schema Location

- **ALWAYS**: Schemas in `features/{name}/schemas/`
- **ALWAYS**: Export schema AND type
- **NEVER**: Define schemas inline in components

### Error Handling

- **ALWAYS**: Show field-level errors
- **ALWAYS**: Toast on submission error
- **NEVER**: Silent form failures

---

## Decision Tree

```
New form? → Create schema first
Need validation? → Add to Zod schema
Conditional field? → Use .optional() or .refine()
Async validation? → Use .refine() with async
Password match? → Use .refine() at object level
```

---

## Workflow

### 1. Create Schema

**File:** `features/{name}/schemas/{name}.schema.ts`

### 2. Create Form Component

Use `useForm` with `zodResolver`.

### 3. Add Fields with Controller

Wrap inputs with `Controller`.

### 4. Handle Submit

Connect to mutation or API call.

---

## Code Examples

### Zod Schema

**File:** `features/auth/schemas/auth.schema.ts`

```typescript
import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export type LoginFormData = z.infer<typeof loginSchema>;

export const registerSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Minimum 8 characters'),
  confirmPassword: z.string(),
  firstName: z.string().min(2, 'Minimum 2 characters'),
  lastName: z.string().min(2, 'Minimum 2 characters'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export type RegisterFormData = z.infer<typeof registerSchema>;
```

### Basic Form

```typescript
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { TextInput, Button } from '@/shared/components/ui';
import { loginSchema, type LoginFormData } from '../schemas/auth.schema';

export function LoginForm() {
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    console.log(data);
  };

  return (
    <>
      <Controller
        control={control}
        name="email"
        render={({ field: { value, onChange, onBlur } }) => (
          <TextInput
            label="Email"
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            error={errors.email?.message}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        )}
      />

      <Controller
        control={control}
        name="password"
        render={({ field: { value, onChange, onBlur } }) => (
          <TextInput
            label="Password"
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            error={errors.password?.message}
            secureTextEntry
          />
        )}
      />

      <Button
        onPress={handleSubmit(onSubmit)}
        loading={isSubmitting}
      >
        Login
      </Button>
    </>
  );
}
```

### Form with Mutation

```typescript
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { useLogin } from '../hooks/useAuth';
import { loginSchema, type LoginFormData } from '../schemas/auth.schema';

export function LoginForm() {
  const loginMutation = useLogin();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    loginMutation.mutate(data, {
      onSuccess: () => {
        router.replace('/(tabs)/dashboard');
      },
    });
  };

  return (
    <>
      <Controller
        control={control}
        name="email"
        render={({ field: { value, onChange, onBlur } }) => (
          <TextInput
            label="Email"
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            error={errors.email?.message}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        )}
      />

      <Controller
        control={control}
        name="password"
        render={({ field: { value, onChange, onBlur } }) => (
          <TextInput
            label="Password"
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            error={errors.password?.message}
            secureTextEntry
          />
        )}
      />

      <Button
        onPress={handleSubmit(onSubmit)}
        loading={loginMutation.isPending}
      >
        Login
      </Button>
    </>
  );
}
```

### Common Zod Patterns

```typescript
import { z } from 'zod';

// Required string
name: z.string().min(1, 'Required'),

// Email
email: z.string().email('Invalid email'),

// Password with rules
password: z
  .string()
  .min(8, 'Minimum 8 characters')
  .regex(/[A-Z]/, 'Must contain uppercase')
  .regex(/[0-9]/, 'Must contain number'),

// Optional
middleName: z.string().optional(),

// Number
age: z.coerce.number().int().min(18).max(120),

// Enum
role: z.enum(['USER', 'ADMIN']),

// Boolean
acceptTerms: z.boolean().refine((val) => val === true, {
  message: 'You must accept the terms',
}),

// URL
website: z.string().url('Invalid URL').optional().or(z.literal('')),

// Phone (custom)
phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number'),

// Date
birthDate: z.coerce.date(),

// Array
tags: z.array(z.string()).min(1, 'At least one tag required'),
```

### Password Match Validation

```typescript
const registerSchema = z.object({
  password: z.string().min(8),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});
```

### Conditional Validation

```typescript
const profileSchema = z.object({
  hasCompany: z.boolean(),
  companyName: z.string().optional(),
}).refine(
  (data) => !data.hasCompany || (data.hasCompany && data.companyName),
  {
    message: 'Company name is required',
    path: ['companyName'],
  }
);
```

### Form with Multiple Fields

```typescript
export function RegisterForm() {
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
    reset,
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
      firstName: '',
      lastName: '',
    },
  });

  // Watch a field value
  const password = watch('password');

  // Reset form
  const handleReset = () => {
    reset();
  };

  return (
    // ... form fields
  );
}
```

### TextInput Component with Error

```typescript
// shared/components/ui/TextInput.tsx
interface TextInputProps {
  label?: string;
  error?: string;
  // ... other props
}

export function TextInput({ label, error, ...props }: TextInputProps) {
  const { styles, theme } = useStyles(stylesheet);

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <RNTextInput
        style={[styles.input, error && styles.inputError]}
        placeholderTextColor={theme.colors.text.muted}
        {...props}
      />
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}
```

---

## Commands

```bash
# Create schema file
touch mobile/src/features/{name}/schemas/{name}.schema.ts

# Check existing schemas
ls mobile/src/features/auth/schemas/
```

---

## Checklist

- [ ] Schema defined in `schemas/` folder
- [ ] Type exported with schema
- [ ] `zodResolver` used in `useForm`
- [ ] All inputs use `Controller`
- [ ] Errors displayed on fields
- [ ] Submit button shows loading state
- [ ] Form connected to mutation

---

## Resources

- **Auth Schemas**: `mobile/src/features/auth/schemas/`
- **TextInput Component**: `mobile/src/shared/components/ui/TextInput.tsx`
- **React Hook Form Docs**: https://react-hook-form.com/
- **Zod Docs**: https://zod.dev/
