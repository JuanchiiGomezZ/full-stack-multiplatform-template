'use client';

import { useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/shared/components/ui/button';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

/**
 * Error Page
 *
 * Catches errors in the route segment and displays a fallback UI.
 */
export default function Error({ error, reset }: ErrorProps) {
  const t = useTranslations('errors');

  useEffect(() => {
    // Log error to reporting service
    console.error('Error:', error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="space-y-6 text-center">
        <h1 className="text-destructive text-6xl font-bold">Oops!</h1>
        <h2 className="text-2xl font-semibold">{t('serverError')}</h2>
        <p className="text-muted-foreground max-w-md">Something went wrong. Please try again.</p>
        {error.digest && <p className="text-muted-foreground text-xs">Error ID: {error.digest}</p>}
        <div className="flex justify-center gap-4">
          <Button onClick={reset} variant="default">
            Try Again
          </Button>
          <Button variant="outline" onClick={() => (window.location.href = '/')}>
            Go Home
          </Button>
        </div>
      </div>
    </div>
  );
}
