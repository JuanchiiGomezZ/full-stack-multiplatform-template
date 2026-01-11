export const breakpoints = {
  xs: 0, // Small phones (< 375px)
  sm: 375, // Standard phones (iPhone SE, etc)
  md: 414, // Large phones (iPhone Pro Max, etc)
  lg: 768, // Tablets portrait
  xl: 1024, // Tablets landscape
} as const;

export type Breakpoint = keyof typeof breakpoints;
