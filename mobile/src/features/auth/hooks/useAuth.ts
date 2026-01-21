import { useCallback } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import { authApi } from "../services/auth.service";
import { useAuthStore, selectIsAuthenticated } from "../stores/auth.store";
import type { User } from "../types/auth.types";

// Query Keys
export const authQueryKeys = {
  all: ["auth"] as const,
  me: ["auth", "me"] as const,
};

// Error handler helper
const getErrorMessage = (error: unknown): string => {
  const err = error as { response?: { data?: { message?: string } } };
  return err.response?.data?.message || "An error occurred";
};

// Navigate to onboarding
const navigateToOnboarding = (): void => {
  console.log("[useAuth] navigateToOnboarding called");
  // Small delay to ensure state has propagated
  setTimeout(() => {
    router.replace("/(onboarding)");
  }, 50);
};

// Navigate to home
const navigateToHome = (): void => {
  console.log("[useAuth] navigateToHome called");
  setTimeout(() => {
    router.replace("/(tabs)/home");
  }, 50);
};

// Navigate to login
const navigateToLogin = (): void => {
  setTimeout(() => {
    router.replace("/(auth)/login");
  }, 50);
};

// ============ HOOKS ============

export function useLoginWithGoogle() {
  const queryClient = useQueryClient();
  const login = useAuthStore((state) => state.login);

  return useMutation({
    mutationFn: authApi.loginWithGoogle,
    onSuccess: (data) => {
      login(data.user, data.accessToken, data.refreshToken);
      queryClient.invalidateQueries({ queryKey: authQueryKeys.all });

      if (data.user.hasCompletedOnboarding) {
        navigateToHome();
      } else {
        navigateToOnboarding();
      }
    },
    onError: (error) => {
      throw new Error(getErrorMessage(error));
    },
  });
}

export function useLogin() {
  const queryClient = useQueryClient();
  const login = useAuthStore((state) => state.login);

  return useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      authApi.login(email, password),
    onSuccess: (data) => {
      login(data.user, data.accessToken, data.refreshToken);
      queryClient.invalidateQueries({ queryKey: authQueryKeys.all });

      if (data.user.hasCompletedOnboarding) {
        navigateToHome();
      } else {
        navigateToOnboarding();
      }
    },
    onError: (error) => {
      throw new Error(getErrorMessage(error));
    },
  });
}

export function useRegister() {
  const queryClient = useQueryClient();
  const login = useAuthStore((state) => state.login);

  return useMutation({
    mutationFn: ({
      email,
      password,
      firstName,
      lastName,
    }: {
      email: string;
      password: string;
      firstName?: string;
      lastName?: string;
    }) => authApi.register(email, password, firstName, lastName),
    onSuccess: (data) => {
      login(data.user, data.accessToken, data.refreshToken);
      queryClient.invalidateQueries({ queryKey: authQueryKeys.all });

      if (data.user.hasCompletedOnboarding) {
        navigateToHome();
      } else {
        navigateToOnboarding();
      }
    },
    onError: (error) => {
      throw new Error(getErrorMessage(error));
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  const logout = useAuthStore((state) => state.logout);
  const refreshToken = useAuthStore((state) => state.refreshToken);

  return useMutation({
    mutationFn: async () => {
      if (refreshToken) {
        try {
          await authApi.logout(refreshToken);
        } catch {
          // Continue with logout even if server call fails
        }
      }
    },
    onSuccess: () => {
      logout();
      queryClient.clear();
      navigateToLogin();
    },
    onSettled: () => {
      logout();
      queryClient.clear();
      navigateToLogin();
    },
  });
}

export function useCurrentUser() {
  const isAuthenticated = useAuthStore(selectIsAuthenticated);
  const updateUser = useAuthStore((state) => state.updateUser);

  return useQuery<User>({
    queryKey: authQueryKeys.me,
    queryFn: authApi.getMe,
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useCompleteOnboarding() {
  const queryClient = useQueryClient();
  const updateUser = useAuthStore((state) => state.updateUser);

  return useMutation({
    mutationFn: authApi.completeOnboarding,
    onSuccess: (user) => {
      updateUser({ hasCompletedOnboarding: true });
      queryClient.invalidateQueries({ queryKey: authQueryKeys.all });
      navigateToHome();
    },
    onError: (error) => {
      throw new Error(getErrorMessage(error));
    },
  });
}

// ============ COMPOSABLE HOOKS ============

export function useAuth() {
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore(selectIsAuthenticated);

  const loginWithGoogleMutation = useLoginWithGoogle();
  const loginMutation = useLogin();
  const registerMutation = useRegister();
  const logoutMutation = useLogout();

  return {
    // State
    user,
    isAuthenticated,

    // Actions
    loginWithGoogle: loginWithGoogleMutation.mutateAsync,
    login: loginMutation.mutateAsync,
    register: registerMutation.mutateAsync,
    logout: logoutMutation.mutateAsync,

    // Mutation states
    isLoggingIn: loginWithGoogleMutation.isPending || loginMutation.isPending,
    isRegistering: registerMutation.isPending,
    isLoggingOut: logoutMutation.isPending,

    // Error states
    loginError: loginWithGoogleMutation.error || loginMutation.error,
    registerError: registerMutation.error,
    logoutError: logoutMutation.error,
  };
}

// ============ PROTECTED ROUTE HOOK ============

export function useProtectedRoute(redirectTo: "/(auth)/login" | "/(onboarding)" = "/(auth)/login") {
  const isAuthenticated = useAuthStore(selectIsAuthenticated);
  const user = useAuthStore((state) => state.user);

  const redirect = useCallback(() => {
    if (!isAuthenticated) {
      router.replace(redirectTo);
      return;
    }

    // Redirect to onboarding if not completed
    if (user && !user.hasCompletedOnboarding && redirectTo !== "/(onboarding)") {
      router.replace("/(onboarding)");
    }
  }, [isAuthenticated, user, redirectTo]);

  return {
    isAuthenticated,
    redirect,
  };
}
