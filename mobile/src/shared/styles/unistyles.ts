import { StyleSheet } from "react-native-unistyles";
import { themes } from "./theme";
import { breakpoints } from "./breakpoints";

// Type declarations for TypeScript
type AppBreakpoints = typeof breakpoints;
type AppThemes = typeof themes;

declare module "react-native-unistyles" {
  export interface UnistylesThemes extends AppThemes {}
  export interface UnistylesBreakpoints extends AppBreakpoints {}
}

// Configure Unistyles
StyleSheet.configure({
  themes: {
    light: themes.light,
    dark: themes.dark,
  },
  breakpoints,
  settings: {
    adaptiveThemes: true, // Automatically changes according to system
  },
});
