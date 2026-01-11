import { useEffect } from 'react';
import { router } from 'expo-router';
import { useAuthStore, selectIsAuthenticated } from '../stores/auth.store';

interface ProtectedRouteProps {
  children: React.ReactNode;
  redirectTo?: '/(auth)/login';
}

export function ProtectedRoute({
  children,
  redirectTo = '/(auth)/login',
}: ProtectedRouteProps) {
  const isAuthenticated = useAuthStore(selectIsAuthenticated);
  const isLoading = useAuthStore((state) => state.isLoading);

  useEffect(() => {
    // Only redirect after loading is complete
    if (!isLoading && !isAuthenticated) {
      router.replace(redirectTo);
    }
  }, [isLoading, isAuthenticated, redirectTo]);

  // Show nothing while loading, then show content if authenticated
  if (!isLoading && !isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}

// Guest route - redirects if already authenticated
interface GuestRouteProps {
  children: React.ReactNode;
  redirectTo?: '/(tool)/dashboard';
}

export function GuestRoute({
  children,
  redirectTo = '/(tool)/dashboard',
}: GuestRouteProps) {
  const isAuthenticated = useAuthStore(selectIsAuthenticated);
  const isLoading = useAuthStore((state) => state.isLoading);

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace(redirectTo);
    }
  }, [isLoading, isAuthenticated, redirectTo]);

  if (!isLoading && isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
