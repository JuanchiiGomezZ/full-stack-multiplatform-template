import { useCallback, useState } from "react";
import { useUnistyles, UnistylesRuntime } from "react-native-unistyles";
import { preferences } from "@/shared/utils";

export type ThemeMode = "light" | "dark" | "system";

export function useTheme() {
  const { theme, rt } = useUnistyles();
  const [callCount, setCallCount] = useState(0);

  const [savedMode, setSavedMode] = useState<ThemeMode | null>(() => {
    // Leer tema guardado de forma síncrona al inicio
    const mode = preferences.getTheme() as ThemeMode | null;
    console.log('[DEBUG] useTheme: Initial savedMode (sync):', mode);
    console.log('[DEBUG] useTheme: rt.themeName:', rt.themeName);
    console.log('[DEBUG] useTheme: rt.hasAdaptiveThemes:', rt.hasAdaptiveThemes);
    return mode;
  });

  // Log cada vez que se renderiza el hook
  setCallCount(prev => {
    const newCount = prev + 1;
    if (newCount <= 5) {
      console.log(`[DEBUG] useTheme: Render #${newCount}, rt.themeName:`, rt.themeName, ', rt.hasAdaptiveThemes:', rt.hasAdaptiveThemes);
    }
    return newCount;
  });

  /**
   * Get current theme mode
   * Returns 'system' if adaptive themes are enabled
   * Returns 'light' or 'dark' if manually set
   */
  const getCurrentMode = (): ThemeMode => {
    if (rt.hasAdaptiveThemes) {
      return "system";
    }
    return rt.themeName as "light" | "dark";
  };

  /**
   * Set theme mode
   * @param mode - 'light', 'dark', or 'system'
   */
  const setThemeMode = useCallback((mode: ThemeMode) => {
    setSavedMode(mode);

    if (mode === "system") {
      // Enable adaptive themes (follows system)
      UnistylesRuntime.setAdaptiveThemes(true);
      preferences.removeTheme();
    } else {
      // Disable adaptive themes and set manual theme
      if (rt.hasAdaptiveThemes) {
        UnistylesRuntime.setAdaptiveThemes(false);
      }
      UnistylesRuntime.setTheme(mode);
      preferences.setTheme(mode);
    }
  }, [rt.hasAdaptiveThemes]);

  /**
   * Toggle between light and dark
   * If system mode is active, switches to manual mode first
   */
  const toggleTheme = useCallback(() => {
    const currentTheme = rt.themeName as "light" | "dark";
    const newTheme = currentTheme === "light" ? "dark" : "light";

    // Disable adaptive if enabled
    if (rt.hasAdaptiveThemes) {
      UnistylesRuntime.setAdaptiveThemes(false);
    }

    UnistylesRuntime.setTheme(newTheme);
    preferences.setTheme(newTheme);
    setSavedMode(newTheme);
  }, [rt.themeName, rt.hasAdaptiveThemes]);

  return {
    // Current theme object with colors, spacing, etc.
    theme,

    // Current theme name ('light' | 'dark')
    themeName: rt.themeName as "light" | "dark",

    // Current mode ('light' | 'dark' | 'system')
    mode: getCurrentMode(),

    // Saved mode from storage (null if never set)
    savedMode: savedMode as ThemeMode | null,

    // Whether adaptive themes (system) is enabled
    isSystemMode: rt.hasAdaptiveThemes,

    // Is dark mode currently active?
    isDark: rt.themeName === "dark",

    // Actions
    setThemeMode,
    toggleTheme,
    setLight: () => setThemeMode("light"),
    setDark: () => setThemeMode("dark"),
    setSystem: () => setThemeMode("system"),
  };
}
