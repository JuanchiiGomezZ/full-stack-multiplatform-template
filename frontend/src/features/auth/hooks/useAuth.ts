"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAuthStore } from "../stores/auth.store";
import { authService, getApiErrorMessage } from "../services/auth.service";
import type {
  LoginCredentials,
  RegisterCredentials,
} from "../types/auth.types";

/**
 * Auth Query Keys
 */
export const authKeys = {
  all: ["auth"] as const,
  user: () => [...authKeys.all, "user"] as const,
};

/**
 * useAuth Hook
 *
 * Provides authentication state and actions.
 */
export function useAuth() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const {
    user,
    isAuthenticated,
    isLoading,
    login: setAuth,
    logout: clearAuth,
  } = useAuthStore();

  /**
   * Fetch current user
   */
  const { refetch: refetchUser } = useQuery({
    queryKey: authKeys.user(),
    queryFn: authService.getCurrentUser,
    enabled: false, // Only fetch when explicitly called
    retry: false,
  });

  /**
   * Login mutation
   */
  const loginMutation = useMutation({
    mutationFn: (credentials: LoginCredentials) =>
      authService.login(credentials),
    onSuccess: (data) => {
      setAuth(data.user);
      queryClient.setQueryData(authKeys.user(), data.user);
      toast.success("Logged in successfully");
      router.push("/tool/dashboard");
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error));
    },
  });

  /**
   * Register mutation
   */
  const registerMutation = useMutation({
    mutationFn: (credentials: RegisterCredentials) =>
      authService.register(credentials),
    onSuccess: (data) => {
      setAuth(data.user);
      queryClient.setQueryData(authKeys.user(), data.user);
      toast.success("Account created successfully");
      router.push("/tool/dashboard");
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error));
    },
  });

  /**
   * Logout mutation
   */
  const logoutMutation = useMutation({
    mutationFn: authService.logout,
    onSuccess: () => {
      clearAuth();
      queryClient.removeQueries({ queryKey: authKeys.all });
      toast.success("Logged out successfully");
      router.push("/login");
    },
    onError: () => {
      // Even if the API call fails, clear local state
      clearAuth();
      queryClient.removeQueries({ queryKey: authKeys.all });
      router.push("/login");
    },
  });

  return {
    // State
    user,
    isAuthenticated,
    isLoading,

    // Actions
    login: loginMutation.mutate,
    register: registerMutation.mutate,
    logout: logoutMutation.mutate,
    refetchUser,

    // Mutation states
    isLoggingIn: loginMutation.isPending,
    isRegistering: registerMutation.isPending,
    isLoggingOut: logoutMutation.isPending,
  };
}
