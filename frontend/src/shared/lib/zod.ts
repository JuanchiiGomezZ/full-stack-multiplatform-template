import { z } from "zod";

/**
 * Common Zod schemas for reuse across the application
 */

/**
 * Email schema with proper validation
 */
export const emailSchema = z.string().email("Invalid email address");

/**
 * Password schema with minimum requirements
 */
export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[0-9]/, "Password must contain at least one number");

/**
 * Simple password schema (less strict)
 */
export const simplePasswordSchema = z
  .string()
  .min(6, "Password must be at least 6 characters");

/**
 * Phone number schema
 */
export const phoneSchema = z
  .string()
  .regex(/^\+?[1-9]\d{1,14}$/, "Invalid phone number");

/**
 * URL schema
 */
export const urlSchema = z.string().url("Invalid URL");

/**
 * Non-empty string schema
 */
export const requiredString = z.string().min(1, "This field is required");

/**
 * Pagination schema
 */
export const paginationSchema = z.object({
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(10),
});

export type PaginationParams = z.infer<typeof paginationSchema>;
