/**
 * Storage utilities using MMKV for general data and SecureStore for sensitive data
 * All operations are synchronous for better performance
 */

import { MMKV } from "react-native-mmkv";
import * as SecureStore from "expo-secure-store";
import { STORAGE_KEYS } from "@/constants";
import { ThemeMode } from "../hooks";

// ==================== MMKV INSTANCE ====================

const mmkv = new MMKV();

// ==================== MMKV OPERATIONS (General Storage) ====================

const generalStorage = {
  getString: (key: string): string | undefined => {
    try {
      return mmkv.getString(key);
    } catch (error) {
      console.error(`[MMKV] getString error for key "${key}":`, error);
      return undefined;
    }
  },

  set: (key: string, value: string): void => {
    try {
      mmkv.set(key, value);
    } catch (error) {
      console.error(`[MMKV] set error for key "${key}":`, error);
    }
  },

  getNumber: (key: string): number | undefined => {
    try {
      return mmkv.getNumber(key);
    } catch (error) {
      console.error(`[MMKV] getNumber error for key "${key}":`, error);
      return undefined;
    }
  },

  setNumber: (key: string, value: number): void => {
    try {
      mmkv.set(key, value);
    } catch (error) {
      console.error(`[MMKV] setNumber error for key "${key}":`, error);
    }
  },

  getBoolean: (key: string): boolean | undefined => {
    try {
      return mmkv.getBoolean(key);
    } catch (error) {
      console.error(`[MMKV] getBoolean error for key "${key}":`, error);
      return undefined;
    }
  },

  setBoolean: (key: string, value: boolean): void => {
    try {
      mmkv.set(key, value);
    } catch (error) {
      console.error(`[MMKV] setBoolean error for key "${key}":`, error);
    }
  },

  remove: (key: string): void => {
    try {
      mmkv.delete(key);
    } catch (error) {
      console.error(`[MMKV] remove error for key "${key}":`, error);
    }
  },

  clearAll: (): void => {
    try {
      mmkv.clearAll();
    } catch (error) {
      console.error("[MMKV] clearAll error:", error);
    }
  },

  getAllKeys: (): string[] => {
    try {
      return mmkv.getAllKeys();
    } catch (error) {
      console.error("[MMKV] getAllKeys error:", error);
      return [];
    }
  },
};

// ==================== SECURE STORE OPERATIONS (Sensitive Data) ====================

const secureStorage = {
  getString: async (key: string): Promise<string | null> => {
    try {
      return await SecureStore.getItemAsync(key);
    } catch (error) {
      console.error(`[SecureStore] getString error for key "${key}":`, error);
      return null;
    }
  },

  set: async (key: string, value: string): Promise<void> => {
    try {
      await SecureStore.setItemAsync(key, value);
    } catch (error) {
      console.error(`[SecureStore] set error for key "${key}":`, error);
    }
  },

  remove: async (key: string): Promise<void> => {
    try {
      await SecureStore.deleteItemAsync(key);
    } catch (error) {
      console.error(`[SecureStore] remove error for key "${key}":`, error);
    }
  },
};

// ==================== GENERAL STORAGE (MMKV) ====================

export const storage = {
  // String operations
  getString: generalStorage.getString,
  set: generalStorage.set,

  // Number operations
  getNumber: generalStorage.getNumber,
  setNumber: generalStorage.setNumber,

  // Boolean operations
  getBoolean: generalStorage.getBoolean,
  setBoolean: generalStorage.setBoolean,

  // Utility operations
  remove: generalStorage.remove,
  clearAll: generalStorage.clearAll,
  getAllKeys: generalStorage.getAllKeys,

  // Object operations (JSON)
  getObject: <T>(key: string): T | null => {
    try {
      const value = generalStorage.getString(key);
      if (!value) return null;
      return JSON.parse(value) as T;
    } catch (error) {
      console.error(`[Storage] getObject error for key "${key}":`, error);
      return null;
    }
  },

  setObject: <T>(key: string, value: T): void => {
    try {
      generalStorage.set(key, JSON.stringify(value));
    } catch (error) {
      console.error(`[Storage] setObject error for key "${key}":`, error);
    }
  },
};

// ==================== SECURE STORAGE (Tokens) ====================

export const secureStorageApi = {
  // Access Token
  getAccessToken: async (): Promise<string | null> => {
    return secureStorage.getString(STORAGE_KEYS.ACCESS_TOKEN);
  },

  setAccessToken: async (token: string): Promise<void> => {
    await secureStorage.set(STORAGE_KEYS.ACCESS_TOKEN, token);
  },

  removeAccessToken: async (): Promise<void> => {
    await secureStorage.remove(STORAGE_KEYS.ACCESS_TOKEN);
  },

  // Refresh Token
  getRefreshToken: async (): Promise<string | null> => {
    return secureStorage.getString(STORAGE_KEYS.REFRESH_TOKEN);
  },

  setRefreshToken: async (token: string): Promise<void> => {
    await secureStorage.set(STORAGE_KEYS.REFRESH_TOKEN, token);
  },

  removeRefreshToken: async (): Promise<void> => {
    await secureStorage.remove(STORAGE_KEYS.REFRESH_TOKEN);
  },

  // User data (encrypted)
  getUser: async (): Promise<string | null> => {
    return secureStorage.getString(STORAGE_KEYS.USER);
  },

  setUser: async (userData: string): Promise<void> => {
    await secureStorage.set(STORAGE_KEYS.USER, userData);
  },

  removeUser: async (): Promise<void> => {
    await secureStorage.remove(STORAGE_KEYS.USER);
  },

  // Clear all auth data
  clearAuthData: async (): Promise<void> => {
    await Promise.all([
      secureStorage.remove(STORAGE_KEYS.ACCESS_TOKEN),
      secureStorage.remove(STORAGE_KEYS.REFRESH_TOKEN),
      secureStorage.remove(STORAGE_KEYS.USER),
    ]);
  },
};

// ==================== APP PREFERENCES (MMKV) ====================

export const preferences = {
  // Theme
  getTheme: (): ThemeMode | null => {
    const theme = generalStorage.getString(STORAGE_KEYS.THEME);
    return theme === "light" || theme === "dark" ? theme : null;
  },

  setTheme: (theme: ThemeMode): void => {
    generalStorage.set(STORAGE_KEYS.THEME, theme);
  },

  removeTheme: (): void => {
    generalStorage.remove(STORAGE_KEYS.THEME);
  },

  // Onboarding
  hasSeenOnboarding: (): boolean => {
    return (
      generalStorage.getBoolean(STORAGE_KEYS.ONBOARDING_COMPLETED) ?? false
    );
  },

  setOnboardingCompleted: (completed: boolean): void => {
    generalStorage.setBoolean(STORAGE_KEYS.ONBOARDING_COMPLETED, completed);
  },
};

// ==================== ZUSTAND STORAGE ADAPTER ====================

/**
 * Zustand persist middleware adapter for MMKV
 * Use: createJSONStorage(() => zustandStorage)
 */
export const zustandStorage = {
  getItem: (name: string): string | null => {
    return generalStorage.getString(name) ?? null;
  },
  setItem: (name: string, value: string): void => {
    generalStorage.set(name, value);
  },
  removeItem: (name: string): void => {
    generalStorage.remove(name);
  },
};

// Export MMKV instance for advanced usage
export { mmkv };
