import { StyleSheet, useUnistyles } from "react-native-unistyles";
import { Text as RNText } from "react-native";
import type { TextStyle, StyleProp } from "react-native";

type TextVariant = "h1" | "h2" | "h3" | "h4" | "body" | "bodySmall" | "caption" | "overline";
type TextColor =
  | "primary"
  | "secondary"
  | "tertiary"
  | "inverse"
  | "muted"
  | "success"
  | "warning"
  | "error";
export type TextWeight =
  | "thin"
  | "extralight"
  | "light"
  | "regular"
  | "medium"
  | "semibold"
  | "bold"
  | "extrabold"
  | "black";

interface TextProps {
  children: React.ReactNode;
  variant?: TextVariant;
  color?: TextColor;
  weight?: TextWeight;
  style?: StyleProp<TextStyle>;
  numberOfLines?: number;
  selectable?: boolean;
  onPress?: () => void;
}

// Map variants to their default font weights
const variantWeightMap: Record<TextVariant, TextWeight> = {
  h1: "bold",
  h2: "bold",
  h3: "bold",
  h4: "bold",
  body: "regular",
  bodySmall: "regular",
  caption: "regular",
  overline: "medium",
};

export function Text({
  children,
  variant = "body",
  color = "primary",
  weight,
  style,
  numberOfLines,
  selectable = false,
  onPress,
}: TextProps) {
  const { theme } = useUnistyles();

  // Use provided weight or fall back to variant's default weight
  const fontWeight = weight || variantWeightMap[variant];
  const fontFamilyStyle = { fontFamily: theme.fontFamily[fontWeight] };

  return (
    <RNText
      style={[
        styles.text,
        styles[`variant_${variant}`],
        styles[`color_${color}`],
        fontFamilyStyle,
        style,
      ]}
      numberOfLines={numberOfLines}
      selectable={selectable}
      onPress={onPress}
    >
      {children}
    </RNText>
  );
}

const styles = StyleSheet.create((theme) => ({
  text: {
    fontFamily: theme.fontFamily.regular,
  },
  variant_h1: {
    fontSize: theme.fontSize["3xl"],
    lineHeight: theme.fontSize["3xl"] * 1.3,
  },
  variant_h2: {
    fontSize: theme.fontSize["2xl"],
    lineHeight: theme.fontSize["2xl"] * 1.3,
  },
  variant_h3: {
    fontSize: theme.fontSize.xl,
    lineHeight: theme.fontSize.xl * 1.3,
  },
  variant_h4: {
    fontSize: theme.fontSize.lg,
    lineHeight: theme.fontSize.lg * 1.3,
  },
  variant_body: {
    fontSize: theme.fontSize.base,
    lineHeight: theme.fontSize.base * 1.5,
  },
  variant_bodySmall: {
    fontSize: theme.fontSize.sm,
    lineHeight: theme.fontSize.sm * 1.5,
  },
  variant_caption: {
    fontSize: theme.fontSize.xs,
    lineHeight: theme.fontSize.xs * 1.5,
  },
  variant_overline: {
    fontSize: 10,
    lineHeight: 14,
  },
  color_primary: {
    color: theme.colors.text.primary,
  },
  color_secondary: {
    color: theme.colors.text.secondary,
  },
  color_tertiary: {
    color: theme.colors.text.tertiary,
  },
  color_inverse: {
    color: theme.colors.text.inverse,
  },
  color_muted: {
    color: theme.colors.text.muted,
  },
  color_success: {
    color: theme.colors.success,
  },
  color_warning: {
    color: theme.colors.warning,
  },
  color_error: {
    color: theme.colors.error,
  },
}));
