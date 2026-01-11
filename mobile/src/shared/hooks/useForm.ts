import { useForm as useReactHookForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";

export function useForm<T extends z.ZodType<any, any, any>>(props: {
  schema: T;
  defaultValues?: z.infer<T>;
  mode?: "onSubmit" | "onChange" | "onBlur" | "onTouched" | "all";
}) {
  return useReactHookForm<z.infer<T>>({
    resolver: zodResolver(props.schema) as any,
    mode: props.mode ?? "onChange",
    defaultValues: props.defaultValues,
  });
}
