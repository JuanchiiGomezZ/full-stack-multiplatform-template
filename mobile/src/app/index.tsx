import { useEffect, useState, useCallback } from "react";
import { router, useRootNavigationState } from "expo-router";
import {
  useAuthStore,
  selectIsAuthenticated,
  selectHasHydrated,
} from "@/features/auth/stores/auth.store";
import { ScreenWrapper } from "@/shared/components/ui";

export default function Index() {
  const isAuthenticated = useAuthStore(selectIsAuthenticated);
  const hasHydrated = useAuthStore(selectHasHydrated);
  const user = useAuthStore((state) => state.user);
  const rootNavigationState = useRootNavigationState();
  const [isLayoutReady, setIsLayoutReady] = useState(false);

  const onNavigationStateChange = useCallback(() => {
    if (rootNavigationState?.key != null) {
      setIsLayoutReady(true);
    }
  }, [rootNavigationState?.key]);

  useEffect(() => {
    onNavigationStateChange();
  }, [onNavigationStateChange]);

  useEffect(() => {
    // Wait for both layout and store hydration
    if (!isLayoutReady || !hasHydrated) {
      return;
    }

    const timer = setTimeout(() => {
      if (isAuthenticated && user) {
        // Redirect based on onboarding status
        if (user.hasCompletedOnboarding) {
          router.replace("/(tabs)/home");
        } else {
          router.replace("/(onboarding)");
        }
      } else {
        router.replace("/(auth)/login");
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [isLayoutReady, hasHydrated, isAuthenticated, user]);

  return <ScreenWrapper loading centered />;
}
