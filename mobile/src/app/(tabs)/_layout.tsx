import { useEffect } from "react";
import { router, Tabs } from "expo-router";
import {
  useAuthStore,
  selectIsAuthenticated,
  selectHasHydrated,
} from "@/features/auth/stores/auth.store";

export default function TabsLayout() {
  const isAuthenticated = useAuthStore(selectIsAuthenticated);
  const hasHydrated = useAuthStore(selectHasHydrated);
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    if (!hasHydrated) return;

    // Redirect to login if not authenticated
    if (!isAuthenticated) {
      router.replace("/(auth)/login");
      return;
    }

    // Redirect to onboarding if not completed
    if (user && !user.hasCompletedOnboarding) {
      router.replace("/(onboarding)");
    }
  }, [hasHydrated, isAuthenticated, user?.hasCompletedOnboarding]);

  // Don't render protected screens if not hydrated or not authenticated
  if (!hasHydrated || !isAuthenticated) {
    return null;
  }

  // Don't render tabs if onboarding not completed
  if (user && !user.hasCompletedOnboarding) {
    return null;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: "Home",
          tabBarIcon: () => null,
        }}
      />
    </Tabs>
  );
}
