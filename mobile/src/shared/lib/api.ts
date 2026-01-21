import axios from "axios";
import { API_URL } from "@/constants";
import { useAuthStore } from "@/features/auth/stores/auth.store";

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor - add auth token
api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().accessToken;

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - unwrap response data and handle 401 errors with token refresh
api.interceptors.response.use(
  (response) => {
    // Backend wraps responses in { data, success, timestamp }
    // Unwrap to return just the data
    if (
      response.data &&
      typeof response.data === "object" &&
      "data" in response.data &&
      "success" in response.data
    ) {
      response.data = response.data.data;
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Handle 401 - token expired
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = useAuthStore.getState().refreshToken;

        if (!refreshToken) {
          throw new Error("No refresh token");
        }

        // Try to refresh tokens
        const response = await axios.post(`${API_URL}/auth/refresh`, {
          refreshToken,
        });

        const { accessToken, refreshToken: newRefreshToken } = response.data;

        // Update store with new tokens
        useAuthStore.getState().setAccessToken(accessToken);
        useAuthStore.getState().login(useAuthStore.getState().user!, accessToken, newRefreshToken);

        // Retry original request
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh failed - logout
        await useAuthStore.getState().logout();
      }
    }

    return Promise.reject(error);
  }
);
