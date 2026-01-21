import '@/shared/i18n';
import { useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from '@/features/auth/stores/auth.store';
import { zustandStorage } from '@/shared/utils/storage';
import { configureGoogleSignIn } from '@/shared/lib/google-signin';
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
      UnistylesRuntime.setAdaptiveThemes(false);
      UnistylesRuntime.setTheme(savedTheme);
    }
  }, []);

  return <>{children}</>;
}

// Hook para inicializar auth desde MMKV storage
function useInitializeAuth() {
  const { setUser } = useAuthStore();

  useEffect(() => {
    const initializeAuth = () => {
      try {
        const rawData = zustandStorage.getItem('auth-storage');
        if (!rawData) return;

        const parsed = JSON.parse(rawData) as { state: { user: User; accessToken: string; refreshToken: string } };
        if (parsed.state?.user && parsed.state?.accessToken) {
          setUser(parsed.state.user);
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        zustandStorage.removeItem('auth-storage');
      }
    };

    initializeAuth();
  }, [setUser]);
}

// Hook para inicializar Google Sign-In
function useInitializeGoogleSignIn() {
  useEffect(() => {
    configureGoogleSignIn();
  }, []);
}

function AuthInitializer({ children }: { children: React.ReactNode }) {
  useInitializeAuth();
  useInitializeGoogleSignIn();
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
