import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { zustandStorage } from "@/shared/utils/storage";
import { googleSignIn } from "@/shared/lib/google-signin";
import type { User } from "../types/auth.types";

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  _hasHydrated: boolean;

  // Actions
  setUser: (user: User | null) => void;
  setIsLoading: (loading: boolean) => void;
  login: (user: User, accessToken: string, refreshToken: string) => void;
  logout: () => Promise<void>;
  updateUser: (user: Partial<User>) => void;
  setAccessToken: (token: string) => void;
  setHasHydrated: (state: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
      _hasHydrated: false,

      setUser: (user) => set({ user }),
      setIsLoading: (loading) => set({ isLoading: loading }),
      setHasHydrated: (state) => {
        console.log("[AuthStore] Hydration state changed:", state);
        set({ _hasHydrated: state });
      },

      login: (user, accessToken, refreshToken) => {
        console.log("[AuthStore] login called with user:", {
          id: user.id,
          hasCompletedOnboarding: user.hasCompletedOnboarding,
        });
        set({
          user,
          accessToken,
          refreshToken,
          isAuthenticated: true,
        });
      },

      logout: async () => {
        await googleSignIn.signOut();
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
        });
      },

      updateUser: (userData) => {
        const currentUser = get().user;
        if (currentUser) {
          set({ user: { ...currentUser, ...userData } });
        }
      },

      setAccessToken: (token) => {
        set({ accessToken: token });
      },
    }),
    {
      name: "auth-storage",
      storage: createJSONStorage(() => zustandStorage),
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => {
        console.log("[AuthStore] Starting rehydration...");
        return (state, error) => {
          if (error) {
            console.error("[AuthStore] Rehydration error:", error);
          } else {
            console.log("[AuthStore] Rehydration complete, state:", {
              isAuthenticated: state?.isAuthenticated,
              hasUser: !!state?.user,
              user: state?.user,
              hasCompletedOnboarding: state?.user?.hasCompletedOnboarding,
            });
          }
          state?.setHasHydrated(true);
        };
      },
    }
  )
);

// Selectors
export const selectUser = (state: AuthState) => state.user;
export const selectIsAuthenticated = (state: AuthState) => state.isAuthenticated;
export const selectAccessToken = (state: AuthState) => state.accessToken;
export const selectRefreshToken = (state: AuthState) => state.refreshToken;
export const selectIsLoading = (state: AuthState) => state.isLoading;
export const selectHasHydrated = (state: AuthState) => state._hasHydrated;
