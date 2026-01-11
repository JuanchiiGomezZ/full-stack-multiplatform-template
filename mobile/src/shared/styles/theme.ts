export const lightTheme = {
  colors: {
    // Base
    background: "#FFFFFF",
    foreground: "#F5F5F5",
    card: "#FFFFFF",
    muted: "#F5F5F5",

    // Text
    text: {
      primary: "#000000",
      secondary: "#666666",
      tertiary: "#999999",
      inverse: "#FFFFFF",
      muted: "#999999",
    },

    // Brand
    primary: "#007AFF",
    primaryForeground: "#FFFFFF",
    secondary: "#5856D6",

    // Semantic
    success: "#34C759",
    warning: "#FF9500",
    error: "#FF3B30",
    info: "#007AFF",

    // UI
    border: "#E5E5E5",
    divider: "#E5E5E5",
    overlay: "rgba(0, 0, 0, 0.5)",
  },

  // Spacing system (4pt grid)
  spacing: (multiplier: number) => multiplier * 4,

  // Border radius
  radius: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    full: 9999,
  },

  // Typography
  fontSize: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    "2xl": 24,
    "3xl": 30,
  },

  fontFamily: {
    thin: "Poppins-Thin",
    extralight: "Poppins-ExtraLight",
    light: "Poppins-Light",
    regular: "Poppins-Regular",
    medium: "Poppins-Medium",
    semibold: "Poppins-SemiBold",
    bold: "Poppins-Bold",
    extrabold: "Poppins-ExtraBold",
    black: "Poppins-Black",
  },

  fontWeight: {
    thin: "100",
    extralight: "200",
    light: "300",
    regular: "400",
    medium: "500",
    semibold: "600",
    bold: "700",
    extrabold: "800",
    black: "900",
  },

  iconSizes: {
    xs: 16,
    sm: 20,
    md: 24,
    lg: 32,
    xl: 40,
    "2xl": 48,
  },
} as const;

export const darkTheme = {
  colors: {
    // Base
    background: "#000000",
    foreground: "#1C1C1E",
    card: "#1C1C1E",
    muted: "#2C2C2E",

    // Text
    text: {
      primary: "#FFFFFF",
      secondary: "#EBEBF5",
      tertiary: "#EBEBF599", // 60% opacity
      inverse: "#000000",
      muted: "#8E8E93",
    },

    // Brand (adjusted for dark mode)
    primary: "#0A84FF",
    primaryForeground: "#FFFFFF",
    secondary: "#5E5CE6",

    // Semantic (adjusted for dark mode)
    success: "#30D158",
    warning: "#FF9F0A",
    error: "#FF453A",
    info: "#0A84FF",

    // UI
    border: "#38383A",
    divider: "#38383A",
    overlay: "rgba(0, 0, 0, 0.7)",
  },

  spacing: (multiplier: number) => multiplier * 4,

  radius: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    full: 9999,
  },

  fontSize: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    "2xl": 24,
    "3xl": 30,
  },

  fontFamily: {
    thin: "Poppins-Thin",
    extralight: "Poppins-ExtraLight",
    light: "Poppins-Light",
    regular: "Poppins-Regular",
    medium: "Poppins-Medium",
    semibold: "Poppins-SemiBold",
    bold: "Poppins-Bold",
    extrabold: "Poppins-ExtraBold",
    black: "Poppins-Black",
  },

  iconSizes: {
    xs: 16,
    sm: 20,
    md: 24,
    lg: 32,
    xl: 40,
    "2xl": 48,
  },

  fontWeight: {
    thin: "100",
    extralight: "200",
    light: "300",
    regular: "400",
    medium: "500",
    semibold: "600",
    bold: "700",
    extrabold: "800",
    black: "900",
  },
} as const;

export const themes = {
  light: lightTheme,
  dark: darkTheme,
};

export type Theme = typeof lightTheme;
