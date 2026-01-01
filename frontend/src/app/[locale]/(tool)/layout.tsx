'use client';

/**
 * Tool Layout (CSR)
 *
 * This layout is for the protected application area.
 * It's a Client Component for interactivity.
 */
import { useHasHydrated } from '@/features/auth';

export default function ToolLayout({ children }: { children: React.ReactNode }) {
  const hasHydrated = useHasHydrated();

  // Prevent hydration mismatch by not rendering until hydrated
  if (!hasHydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="border-primary h-8 w-8 animate-spin rounded-full border-2 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Add your app header/nav/sidebar here */}
      <main className="flex-1">{children}</main>
    </div>
  );
}
