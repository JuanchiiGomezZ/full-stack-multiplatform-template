import { api } from "@/shared/lib/api";
import { googleSignIn } from "@/shared/lib/google-signin";
import type { AuthResponse, TokensResponse, User } from "../types/auth.types";

export const authApi = {
  loginWithGoogle: async (): Promise<AuthResponse> => {
    // Force account picker
    await googleSignIn.signOut();
    await googleSignIn.signIn();

    // Get tokens
    const { idToken, accessToken } = await googleSignIn.getTokens();

    if (!idToken) {
      throw new Error("Login cancelled");
    }

    // Send to backend (send both for flexibility)
    const response = await api.post<AuthResponse>("/auth/google", {
      idToken,
      accessToken,
    });
    return response.data;
  },

  login: async (email: string, password: string): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>("/auth/login", { email, password });
    return response.data;
  },

  register: async (
    email: string,
    password: string,
    firstName?: string,
    lastName?: string
  ): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>("/auth/register", {
      email,
      password,
      firstName,
      lastName,
    });
    return response.data;
  },

  refresh: async (refreshToken: string): Promise<TokensResponse> => {
    const response = await api.post<TokensResponse>("/auth/refresh", { refreshToken });
    return response.data;
  },

  logout: async (refreshToken: string): Promise<void> => {
    await api.post("/auth/logout", { refreshToken });
    await googleSignIn.signOut();
  },

  getMe: async (): Promise<User> => {
    const response = await api.get<User>("/auth/me");
    return response.data;
  },

  completeOnboarding: async (): Promise<User> => {
    const response = await api.patch<User>("/auth/onboarding");
    return response.data;
  },
};
