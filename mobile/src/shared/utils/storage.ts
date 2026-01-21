/**
 * Storage utilities using MMKV for all data (tokens, user data, preferences)
 * All operations are synchronous for better performance
 */

import { MMKV } from "react-native-mmkv";
import type { ThemeMode } from "../hooks";

// ==================== MMKV INSTANCE ====================

const mmkv = new MMKV();

// ==================== MMKV OPERATIONS ====================

const storage = {
  getString: (key: string): string | undefined => {
    try {
      return mmkv.getString(key);
    } catch (error) {
      console.error(`[Storage] getString error for key "${key}":`, error);
      return undefined;
    }
  },

  set: (key: string, value: string): void => {
    try {
      mmkv.set(key, value);
    } catch (error) {
      console.error(`[Storage] set error for key "${key}":`, error);
    }
  },

  getNumber: (key: string): number | undefined => {
    try {
      return mmkv.getNumber(key);
    } catch (error) {
      console.error(`[Storage] getNumber error for key "${key}":`, error);
      return undefined;
    }
  },

  setNumber: (key: string, value: number): void => {
    try {
      mmkv.set(key, value);
    } catch (error) {
      console.error(`[Storage] setNumber error for key "${key}":`, error);
    }
  },

  getBoolean: (key: string): boolean | undefined => {
    try {
      return mmkv.getBoolean(key);
    } catch (error) {
      console.error(`[Storage] getBoolean error for key "${key}":`, error);
      return undefined;
    }
  },

  setBoolean: (key: string, value: boolean): void => {
    try {
      mmkv.set(key, value);
    } catch (error) {
      console.error(`[Storage] setBoolean error for key "${key}":`, error);
    }
  },

  remove: (key: string): void => {
    try {
      mmkv.delete(key);
    } catch (error) {
      console.error(`[Storage] remove error for key "${key}":`, error);
    }
  },

  clearAll: (): void => {
    try {
      mmkv.clearAll();
    } catch (error) {
      console.error("[Storage] clearAll error:", error);
    }
  },

  getAllKeys: (): string[] => {
    try {
      return mmkv.getAllKeys();
    } catch (error) {
      console.error("[Storage] getAllKeys error:", error);
      return [];
    }
  },

  // Object operations (JSON)
  getObject: <T>(key: string): T | null => {
    try {
      const value = mmkv.getString(key);
      if (!value) return null;
      return JSON.parse(value) as T;
    } catch (error) {
      console.error(`[Storage] getObject error for key "${key}":`, error);
      return null;
    }
  },

  setObject: <T>(key: string, value: T): void => {
    try {
      mmkv.set(key, JSON.stringify(value));
    } catch (error) {
      console.error(`[Storage] setObject error for key "${key}":`, error);
    }
  },
};

// ==================== AUTH STORAGE ====================

export const authStorage = {
  getAuthData: (): { user: unknown; accessToken: string; refreshToken: string } | null => {
    return storage.getObject("auth-storage");
  },

  setAuthData: (data: { user: unknown; accessToken: string; refreshToken: string }): void => {
    storage.setObject("auth-storage", data);
  },

  clearAuthData: (): void => {
    storage.remove("auth-storage");
  },
};

// ==================== PREFERENCES ====================

export const preferences = {
  // Theme
  getTheme: (): ThemeMode | null => {
    const theme = storage.getString("theme");
    return theme === "light" || theme === "dark" ? theme : null;
  },

  setTheme: (theme: ThemeMode): void => {
    storage.set("theme", theme);
  },

  removeTheme: (): void => {
    storage.remove("theme");
  },

  // Onboarding
  hasSeenOnboarding: (): boolean => {
    return storage.getBoolean("onboarding_completed") ?? false;
  },

  setOnboardingCompleted: (completed: boolean): void => {
    storage.setBoolean("onboarding_completed", completed);
  },
};

// ==================== ZUSTAND STORAGE ADAPTER ====================

/**
 * Zustand persist middleware adapter for MMKV
 * Use: createJSONStorage(() => zustandStorage)
 */
export const zustandStorage = {
  getItem: (name: string): string | null => {
    const value = storage.getString(name) ?? null;
    console.log("[zustandStorage] getItem:", name, "value length:", value?.length ?? 0);
    if (value && name === "auth-storage") {
      try {
        const parsed = JSON.parse(value);
        console.log("[zustandStorage] auth-storage content:", {
          hasState: !!parsed?.state,
          hasUser: !!parsed?.state?.user,
          isAuthenticated: parsed?.state?.isAuthenticated,
          user: parsed?.state?.user,
        });
      } catch (e) {
        console.error("[zustandStorage] Failed to parse:", e);
      }
    }
    return value;
  },
  setItem: (name: string, value: string): void => {
    console.log("[zustandStorage] setItem:", name, "value length:", value?.length ?? 0);
    storage.set(name, value);
  },
  removeItem: (name: string): void => {
    console.log("[zustandStorage] removeItem:", name);
    storage.remove(name);
  },
};

// Export MMKV instance for advanced usage
export { mmkv };
