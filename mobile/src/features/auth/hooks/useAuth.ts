import { useCallback } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { STORAGE_KEYS } from "@/constants";
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

// Clear all auth storage
const clearAuthStorage = async (): Promise<void> => {
  await SecureStore.deleteItemAsync(STORAGE_KEYS.ACCESS_TOKEN);
  await SecureStore.deleteItemAsync(STORAGE_KEYS.REFRESH_TOKEN);
  await SecureStore.deleteItemAsync(STORAGE_KEYS.USER);
};

// Navigate to login
const navigateToLogin = (): void => {
  router.replace("/(auth)/login" as const);
};

// Navigate to dashboard
const navigateToDashboard = (): void => {
  //TODO: Navigate to dashboard
};

// ============ HOOKS ============

export function useLogin() {
  const queryClient = useQueryClient();
  const login = useAuthStore((state) => state.login);

  return useMutation({
    mutationFn: authApi.login,
    onSuccess: async (data) => {
      login(data.user, data.accessToken);
      await SecureStore.setItemAsync(STORAGE_KEYS.REFRESH_TOKEN, data.refreshToken);
      await queryClient.invalidateQueries({ queryKey: authQueryKeys.all });
      navigateToDashboard();
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
    mutationFn: authApi.register,
    onSuccess: async (data) => {
      login(data.user, data.accessToken);
      await SecureStore.setItemAsync(STORAGE_KEYS.REFRESH_TOKEN, data.refreshToken);
      await queryClient.invalidateQueries({ queryKey: authQueryKeys.all });
      navigateToDashboard();
    },
    onError: (error) => {
      throw new Error(getErrorMessage(error));
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  const logout = useAuthStore((state) => state.logout);

  return useMutation({
    mutationFn: async () => {
      const refreshToken = await SecureStore.getItemAsync(STORAGE_KEYS.REFRESH_TOKEN);
      if (refreshToken) {
        try {
          await authApi.logout(refreshToken);
        } catch {
          // Continue with logout even if server call fails
        }
      }
    },
    onSuccess: async () => {
      logout();
      await clearAuthStorage();
      await queryClient.clear();
      navigateToLogin();
    },
    onSettled: async () => {
      logout();
      await clearAuthStorage();
      await queryClient.clear();
      navigateToLogin();
    },
  });
}

export function useCurrentUser() {
  const isAuthenticated = useAuthStore(selectIsAuthenticated);

  return useQuery<User>({
    queryKey: authQueryKeys.me,
    queryFn: authApi.getMe,
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// ============ COMPOSABLE HOOKS ============

export function useAuth() {
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore(selectIsAuthenticated);
  const isLoading = useAuthStore((state) => state.isLoading);

  const loginMutation = useLogin();
  const registerMutation = useRegister();
  const logoutMutation = useLogout();

  return {
    // State
    user,
    isAuthenticated,
    isLoading,

    // Actions
    login: loginMutation.mutateAsync,
    register: registerMutation.mutateAsync,
    logout: logoutMutation.mutateAsync,

    // Mutation states
    isLoggingIn: loginMutation.isPending,
    isRegistering: registerMutation.isPending,
    isLoggingOut: logoutMutation.isPending,

    // Error states
    loginError: loginMutation.error,
    registerError: registerMutation.error,
    logoutError: logoutMutation.error,
  };
}

// ============ PROTECTED ROUTE HOOK ============

export function useProtectedRoute(redirectTo: "/(auth)/login" = "/(auth)/login") {
  const isAuthenticated = useAuthStore(selectIsAuthenticated);
  const isLoading = useAuthStore((state) => state.isLoading);

  const redirect = useCallback(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace(redirectTo);
    }
  }, [isLoading, isAuthenticated, redirectTo]);

  return {
    isAuthenticated,
    isLoading,
    redirect,
  };
}
