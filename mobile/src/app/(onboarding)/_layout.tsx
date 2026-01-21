import { useEffect } from "react";
import { Stack, router } from "expo-router";
import {
  useAuthStore,
  selectIsAuthenticated,
  selectHasHydrated,
} from "@/features/auth/stores/auth.store";

export default function OnboardingLayout() {
  const isAuthenticated = useAuthStore(selectIsAuthenticated);
  const hasHydrated = useAuthStore(selectHasHydrated);
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    if (!hasHydrated) {
      return;
    }

    // Redirect to login if not authenticated
    if (!isAuthenticated) {
      router.replace("/(auth)/login");
      return;
    }

    // Redirect to tabs if already completed onboarding
    if (user?.hasCompletedOnboarding) {
      router.replace("/(tabs)/home");
    }
  }, [hasHydrated, isAuthenticated, user?.hasCompletedOnboarding]);

  // Don't render if not hydrated yet
  if (!hasHydrated) {
    return null;
  }

  // Only render for authenticated users who haven't completed onboarding
  if (!isAuthenticated || user?.hasCompletedOnboarding) {
    return null;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
      initialRouteName="index"
    >
      <Stack.Screen name="index" />
    </Stack>
  );
}
