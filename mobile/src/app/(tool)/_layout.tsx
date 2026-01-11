import { useEffect } from "react";
import { router, Tabs } from "expo-router";
import {
  useAuthStore,
  selectIsAuthenticated,
  selectIsLoading,
} from "@/features/auth/stores/auth.store";

export default function ToolLayout() {
  const isAuthenticated = useAuthStore(selectIsAuthenticated);
  const isLoading = useAuthStore(selectIsLoading);

  useEffect(() => {
    // Redirect to login if not authenticated
    if (!isLoading && !isAuthenticated) {
      router.replace("/(auth)/login");
    }
  }, [isLoading, isAuthenticated]);

  // Don't render protected screens if loading or not authenticated
  if (isLoading || !isAuthenticated) { 
    return null;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: true,
      }}
    ></Tabs>
  );
}
