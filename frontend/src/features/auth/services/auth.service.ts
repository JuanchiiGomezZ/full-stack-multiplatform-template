import { apiClient, getApiErrorMessage } from "@/shared/lib/api";
import type {
  User,
  LoginCredentials,
  RegisterCredentials,
  AuthResponse,
} from "../types/auth.types";

/**
 * Auth API Endpoints
 */
const AUTH_ENDPOINTS = {
  login: "/auth/login",
  register: "/auth/register",
  logout: "/auth/logout",
  me: "/auth/me",
  refresh: "/auth/refresh",
} as const;

/**
 * Auth Service
 *
 * Handles all authentication API calls.
 */
export const authService = {
  /**
   * Login with email and password
   */
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>(
      AUTH_ENDPOINTS.login,
      credentials
    );
    return response.data;
  },

  /**
   * Register a new user
   */
  async register(credentials: RegisterCredentials): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>(
      AUTH_ENDPOINTS.register,
      credentials
    );
    return response.data;
  },

  /**
   * Logout the current user
   */
  async logout(): Promise<void> {
    await apiClient.post(AUTH_ENDPOINTS.logout);
  },

  /**
   * Get the current authenticated user
   */
  async getCurrentUser(): Promise<User> {
    const response = await apiClient.get<User>(AUTH_ENDPOINTS.me);
    return response.data;
  },

  /**
   * Refresh the access token
   */
  async refreshToken(): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>(AUTH_ENDPOINTS.refresh);
    return response.data;
  },
};

export { getApiErrorMessage };
