import { createNavigation } from "next-intl/navigation";
import { routing } from "./routing";

/**
 * Internationalized navigation utilities
 *
 * Use these instead of next/link and next/navigation
 * for automatic locale handling.
 */
export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
