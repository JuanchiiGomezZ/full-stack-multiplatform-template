// InputTrigger Component
// Reusable trigger button styled like TextInput for Select, DatePicker, etc.

import { Pressable, View } from "react-native";
import type { ViewStyle, StyleProp } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { Text } from "./Text";

type InputTriggerVariant = "default" | "outlined";

interface InputTriggerProps {
  /** Trigger label */
  label?: string;
  /** Placeholder text when no value */
  placeholder?: string;
  /** Display value */
  value?: string | null;
  /** Error message */
  error?: string;
  /** Disabled state */
  disabled?: boolean;
  /** Variant style */
  variant?: InputTriggerVariant;
  /** Required field indicator */
  required?: boolean;
  /** Custom container style */
  style?: StyleProp<ViewStyle>;
  /** On press handler */
  onPress?: () => void;
  /** Left content (icon, etc.) */
  leftContent?: React.ReactNode;
  /** Right content (icon, chevron, etc.) */
  rightContent?: React.ReactNode;
  /** Accessibility label */
  accessibilityLabel?: string;
}

export function InputTrigger({
  label,
  placeholder = "Select...",
  value,
  error,
  disabled = false,
  variant = "default",
  required = false,
  style,
  onPress,
  leftContent,
  rightContent,
  accessibilityLabel,
}: InputTriggerProps) {
  const hasValue = value !== null && value !== undefined && value !== "";

  return (
    <View style={[styles.container, style]}>
      {/* Label */}
      {label && (
        <Text style={styles.label}>
          {label}
          {required && <Text style={styles.required}> *</Text>}
        </Text>
      )}

      {/* Trigger */}
      <Pressable
        onPress={disabled ? undefined : onPress}
        disabled={disabled}
        style={[
          styles.trigger,
          styles[`trigger_${variant}`],
          error && styles.trigger_error,
          disabled && styles.trigger_disabled,
        ]}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel || label}
        accessibilityState={{ disabled }}
      >
        {/* Left Content */}
        {leftContent && <View style={styles.leftContent}>{leftContent}</View>}

        {/* Value / Placeholder */}
        <Text style={[styles.valueText, !hasValue && styles.placeholderText]} numberOfLines={1}>
          {hasValue ? value : placeholder}
        </Text>

        {/* Right Content */}
        {rightContent && <View style={styles.rightContent}>{rightContent}</View>}
      </Pressable>

      {/* Error */}
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  container: {
    marginBottom: theme.spacing(4),
  },
  label: {
    fontSize: theme.fontSize.sm,
    fontWeight: "500",
    color: theme.colors.text.primary,
    marginBottom: theme.spacing(2),
  },
  required: {
    color: theme.colors.error,
  },
  trigger: {
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: theme.spacing(4),
    borderRadius: theme.radius.md,
  },
  trigger_default: {
    backgroundColor: theme.colors.muted,
  },
  trigger_outlined: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  trigger_error: {
    borderWidth: 1,
    borderColor: theme.colors.error,
  },
  trigger_disabled: {
    opacity: 0.5,
  },
  leftContent: {
    marginRight: theme.spacing(3),
  },
  valueText: {
    flex: 1,
    fontSize: theme.fontSize.base,
    color: theme.colors.text.primary,
  },
  placeholderText: {
    color: theme.colors.text.muted,
  },
  rightContent: {
    marginLeft: theme.spacing(2),
  },
  error: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.error,
    marginTop: theme.spacing(1),
    marginLeft: theme.spacing(1),
  },
}));

export type { InputTriggerProps, InputTriggerVariant };
