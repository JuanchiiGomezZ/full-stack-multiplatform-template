# Forms

## React Hook Form + Zod

### Basic Pattern

```tsx
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/shared/components/ui/form";

// 1. Define schema
const formSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(8, "Min 8 characters"),
});

type FormValues = z.infer<typeof formSchema>;

// 2. Create component
export function LoginForm() {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: FormValues) => {
    // Handle submission
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
                <Input type="email" {...field} />
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

## Shared Zod Schemas

Location: `src/shared/lib/zod.ts`

```typescript
import { emailSchema, passwordSchema } from "@/shared/lib/zod";

const schema = z.object({
  email: emailSchema,
  password: passwordSchema,
});
```

Available schemas:

- `emailSchema`
- `passwordSchema` (strict)
- `simplePasswordSchema` (min 6 chars)
- `phoneSchema`
- `urlSchema`
- `requiredString`
- `paginationSchema`

## Form with Async Submission

```tsx
const mutation = useCreateUser();

const onSubmit = async (data: FormValues) => {
  mutation.mutate(data);
};

<Button type="submit" disabled={mutation.isPending}>
  {mutation.isPending ? "Submitting..." : "Submit"}
</Button>;
```
