import "@shared/i18n"; // Inicializar i18next
import { useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from '@/features/auth/stores/auth.store';
import * as SecureStore from 'expo-secure-store';
import { STORAGE_KEYS } from '@/constants';
import type { User } from '@/features/auth/types/auth.types';
import { UnistylesRuntime } from 'react-native-unistyles';
import { preferences } from '@/shared/utils';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// Theme Initializer - Aplica el tema guardado lo antes posible
function ThemeInitializer({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const savedTheme = preferences.getTheme();

    if (savedTheme && savedTheme !== 'system') {
      // Desactivar adaptive themes y aplicar tema manual
      UnistylesRuntime.setAdaptiveThemes(false);
      UnistylesRuntime.setTheme(savedTheme);
    }
  }, []);

  return <>{children}</>;
}

// Hook simple para inicializar auth desde storage
function useInitializeAuth() {
  const { setUser, setLoading } = useAuthStore();

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const userData = await SecureStore.getItemAsync(STORAGE_KEYS.USER);
        const accessToken = await SecureStore.getItemAsync(STORAGE_KEYS.ACCESS_TOKEN);

        if (userData && accessToken) {
          const storedUser = JSON.parse(userData) as User;
          setUser(storedUser);
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        await SecureStore.deleteItemAsync(STORAGE_KEYS.ACCESS_TOKEN);
        await SecureStore.deleteItemAsync(STORAGE_KEYS.REFRESH_TOKEN);
        await SecureStore.deleteItemAsync(STORAGE_KEYS.USER);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, [setUser, setLoading]);
}

function AuthInitializer({ children }: { children: React.ReactNode }) {
  useInitializeAuth();
  return <>{children}</>;
}

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeInitializer>
        <AuthInitializer>{children}</AuthInitializer>
      </ThemeInitializer>
    </QueryClientProvider>
  );
}

export { queryClient };
