import { StyleSheet } from "react-native-unistyles";
import { TextInput as RNTextInput, View, Text } from "react-native";
import { useState, forwardRef } from "react";
import type { TextInputProps as RNTextInputProps, ViewStyle, TextStyle } from "react-native";

type TextInputVariant = "default" | "outlined";

interface TextInputProps extends Omit<RNTextInputProps, "style"> {
  label?: string;
  error?: string;
  variant?: TextInputVariant;
  containerStyle?: ViewStyle;
  inputStyle?: TextStyle;
  required?: boolean;
}

export const TextInput = forwardRef<RNTextInput, TextInputProps>(
  function TextInput(
    {
      label,
      error,
      variant = "default",
      containerStyle,
      inputStyle,
      ...props
    },
    ref
  ) {
    const [isFocused, setIsFocused] = useState(false);

    return (
      <View style={[styles.container, containerStyle]}>
        {label && (
          <Text style={styles.label}>
            {label}
            {props.required && <Text style={styles.required}> *</Text>}
          </Text>
        )}
        <RNTextInput
          ref={ref}
          style={[
            styles.input,
            styles[`input_${variant}`],
            isFocused && styles.input_focused,
            error && styles.input_error,
            inputStyle,
          ]}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholderTextColor="#999999"
          accessibilityLabel={label}
          {...props}
        />
        {error && <Text style={styles.error}>{error}</Text>}
      </View>
    );
  }
);

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
  input: {
    height: 56,
    paddingHorizontal: theme.spacing(4),
    paddingVertical: theme.spacing(3),
    borderRadius: theme.radius.md,
    fontSize: theme.fontSize.base,
    color: theme.colors.text.primary,
  },
  input_default: {
    backgroundColor: theme.colors.muted,
  },
  input_outlined: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  input_focused: {
    borderColor: theme.colors.primary,
  },
  input_error: {
    borderColor: theme.colors.error,
  },
  error: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.error,
    marginTop: theme.spacing(1),
    marginLeft: theme.spacing(1),
  },
}));
