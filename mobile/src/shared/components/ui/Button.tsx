import { StyleSheet } from "react-native-unistyles";
import { Pressable, Text, ActivityIndicator } from "react-native";
import type { ViewStyle } from "react-native";

type ButtonVariant =
  | "primary"
  | "secondary"
  | "ghost"
  | "outline"
  | "destructive";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
}

export function Button({
  title,
  onPress,
  variant = "primary",
  size = "md",
  loading = false,
  disabled = false,
  style,
}: ButtonProps) {
  const getIndicatorColor = () => {
    if (variant === "ghost" || variant === "outline") return "#007AFF";
    return "#FFFFFF";
  };

  return (
    <Pressable
      style={[
        styles.button,
        styles[`button_${variant}`],
        styles[`button_${size}`],
        disabled && styles.disabled,
        style,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      accessibilityRole="button"
      accessibilityLabel={title}
    >
      {loading ? (
        <ActivityIndicator size="small" color={getIndicatorColor()} />
      ) : (
        <Text
          style={[
            styles.text,
            styles[`text_${variant}`],
            styles[`text_${size}`],
          ]}
        >
          {title}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create((theme) => ({
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: theme.spacing(2),
    borderRadius: theme.radius.md,
  },
  button_primary: {
    backgroundColor: theme.colors.primary,
  },
  button_secondary: {
    backgroundColor: theme.colors.secondary,
  },
  button_ghost: {
    backgroundColor: "transparent",
  },
  button_outline: {
    backgroundColor: "transparent",
    borderWidth: 1.5,
    borderColor: theme.colors.border,
  },
  button_destructive: {
    backgroundColor: theme.colors.error,
  },
  button_sm: {
    height: 36,
  },
  button_md: {
    height: 48,
  },
  button_lg: {
    height: 56,
  },
  text: {
    fontFamily: theme.fontFamily.semibold,
  },
  text_primary: {
    color: theme.colors.primaryForeground,
  },
  text_secondary: {
    color: theme.colors.text.inverse,
  },
  text_ghost: {
    color: theme.colors.primary,
  },
  text_outline: {
    color: theme.colors.text.primary,
  },
  text_destructive: {
    color: theme.colors.text.inverse,
  },
  text_sm: {
    fontSize: theme.fontSize.sm,
  },
  text_md: {
    fontSize: theme.fontSize.base,
  },
  text_lg: {
    fontSize: theme.fontSize.lg,
  },
  disabled: {
    opacity: 0.5,
  },
}));
