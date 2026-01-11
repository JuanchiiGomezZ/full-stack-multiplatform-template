import { useEffect, useState, useCallback } from "react";
import { router, useRootNavigationState } from "expo-router";
import { useAuthStore, selectIsAuthenticated } from "@/features/auth/stores/auth.store";
import { ScreenWrapper } from "@/shared/components/ui";

export default function Index() {
  const isAuthenticated = useAuthStore(selectIsAuthenticated);
  const isLoading = useAuthStore((state) => state.isLoading);
  const rootNavigationState = useRootNavigationState();
  const [isLayoutReady, setIsLayoutReady] = useState(false);

  // Callback que se llama cuando el navigator está listo
  const onNavigationStateChange = useCallback(() => {
    if (rootNavigationState?.key != null) {
      setIsLayoutReady(true);
    }
  }, [rootNavigationState?.key]);

  useEffect(() => {
    onNavigationStateChange();
  }, [onNavigationStateChange]);

  useEffect(() => {
    // Solo navegar cuando:
    // 1. El layout esté listo
    // 2. La carga auth haya terminado
    if (!isLayoutReady || isLoading) return;

    // Usar setTimeout para asegurar que el navigator está completamente listo
    const timer = setTimeout(() => {
      if (isAuthenticated) {
        //TODO: Navigate to dashboard
      } else {
        router.replace("/(auth)/login");
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [isLayoutReady, isLoading, isAuthenticated]);

  return <ScreenWrapper loading centered />;
}
