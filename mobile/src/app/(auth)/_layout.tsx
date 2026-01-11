import { useEffect } from 'react';
import { router, Stack } from 'expo-router';
import { useAuthStore, selectIsAuthenticated, selectIsLoading } from '@/features/auth/stores/auth.store';

export default function AuthLayout() {
  const isAuthenticated = useAuthStore(selectIsAuthenticated);
  const isLoading = useAuthStore(selectIsLoading);

  useEffect(() => {
    // Redirect to dashboard if already authenticated
    if (!isLoading && isAuthenticated) {
      //TODO: Navigate to dashboard
    }
  }, [isLoading, isAuthenticated]);

  // Don't render auth screens if loading or already authenticated
  if (isLoading || isAuthenticated) {
    return null;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'fade',
      }}
    >
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
    </Stack>
  );
}
