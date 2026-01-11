import { StyleSheet, View, Text } from "react-native";
import type { ViewStyle, TextStyle } from "react-native";
import type { ReactNode } from "react";

export type BadgeVariant =
  | "default"
  | "success"
  | "warning"
  | "error"
  | "info"
  | "outline"
  | "outline-primary";

export type BadgeSize = "sm" | "md" | "lg";

interface BadgeProps {
  variant?: BadgeVariant;
  size?: BadgeSize;
  icon?: ReactNode;
  iconPosition?: "left" | "right";
  children: ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export function Badge({
  variant = "default",
  size = "md",
  icon,
  iconPosition = "left",
  children,
  style,
  textStyle,
}: BadgeProps) {
  return (
    <View
      style={StyleSheet.flatten([
        styles.badge,
        badgeVariantStyles[variant],
        badgeSizeStyles[size],
        style,
      ])}
    >
      {icon && iconPosition === "left" && (
        <View style={styles.iconContainer}>{icon}</View>
      )}
      <Text
        style={StyleSheet.flatten([
          textBaseStyles,
          textVariantStyles[variant],
          textSizeStyles[size],
          textStyle,
        ])}
      >
        {children}
      </Text>
      {icon && iconPosition === "right" && (
        <View style={styles.iconContainer}>{icon}</View>
      )}
    </View>
  );
}

// Badge container styles
const styles = StyleSheet.create({
  badge: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: "transparent",
  },
  iconContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
});

// Variant styles for badge container
const badgeVariantStyles: Record<BadgeVariant, ViewStyle> = {
  default: { backgroundColor: "#F5F5F5" },
  success: { backgroundColor: "#34C759" },
  warning: { backgroundColor: "#FF9500" },
  error: { backgroundColor: "#FF3B30" },
  info: { backgroundColor: "#007AFF" },
  outline: { backgroundColor: "transparent", borderColor: "#E5E5E5" },
  "outline-primary": { backgroundColor: "transparent", borderColor: "#007AFF" },
};

// Size styles for badge container
const badgeSizeStyles: Record<BadgeSize, ViewStyle> = {
  sm: { height: 24, paddingHorizontal: 8 },
  md: { height: 32, paddingHorizontal: 12 },
  lg: { height: 40, paddingHorizontal: 16 },
};

// Text base styles
const textBaseStyles: TextStyle = {
  fontWeight: "500",
};

// Variant styles for text
const textVariantStyles: Record<BadgeVariant, TextStyle> = {
  default: { color: "#000000" },
  success: { color: "#FFFFFF" },
  warning: { color: "#FFFFFF" },
  error: { color: "#FFFFFF" },
  info: { color: "#FFFFFF" },
  outline: { color: "#000000" },
  "outline-primary": { color: "#007AFF" },
};

// Size styles for text
const textSizeStyles: Record<BadgeSize, TextStyle> = {
  sm: { fontSize: 12 },
  md: { fontSize: 14 },
  lg: { fontSize: 16 },
};

// Create text styles by combining base + variant + size
function createTextStyle(variant: BadgeVariant, size: BadgeSize): TextStyle {
  return StyleSheet.flatten([
    textBaseStyles,
    textVariantStyles[variant],
    textSizeStyles[size],
  ]);
}
