import { MaterialCommunityIcons } from "@expo/vector-icons";
import type { ComponentProps } from "react";
import { useUnistyles } from "react-native-unistyles";

type MaterialCommunityIconsProps = ComponentProps<
  typeof MaterialCommunityIcons
>;
export type IconName = MaterialCommunityIconsProps["name"];

export type IconColor =
  | "text"
  | "primary"
  | "muted"
  | "success"
  | "warning"
  | "error"
  | "info"
  | "foreground"
  | "background";

export type IconSize = "xs" | "sm" | "md" | "lg" | "xl" | "2xl";

interface IconProps
  extends Omit<MaterialCommunityIconsProps, "color" | "size"> {
  color?: IconColor;
  size?: IconSize;
  /** Adds a rounded background with the same color at 15% opacity */
  withBackground?: boolean;
}

const getColorValue = (
  color: IconColor,
  themeColors: {
    text: { primary: string };
    primary: string;
    muted: string;
    success: string;
    warning: string;
    error: string;
    info: string;
    foreground: string;
    background: string;
  }
): string => {
  const colorMap: Record<IconColor, string> = {
    text: themeColors.text.primary,
    primary: themeColors.primary,
    muted: themeColors.muted,
    success: themeColors.success,
    warning: themeColors.warning,
    error: themeColors.error,
    info: themeColors.info,
    foreground: themeColors.foreground,
    background: themeColors.background,
  };

  return colorMap[color];
};

/** Converts a hex color to rgba with given opacity */
const hexToRgba = (hex: string, opacity: number): string => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return hex;

  const r = parseInt(result[1], 16);
  const g = parseInt(result[2], 16);
  const b = parseInt(result[3], 16);

  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};

export function Icon({
  color = "text",
  size = "md",
  withBackground = false,
  ...props
}: IconProps) {
  const { theme } = useUnistyles();
  const colorValue = getColorValue(color, theme.colors);
  const sizeValue = theme.iconSizes[size];

  const padding = withBackground ? sizeValue * 0.35 : 0;

  return (
    <MaterialCommunityIcons
      color={colorValue}
      size={sizeValue}
      style={
        withBackground
          ? {
              backgroundColor: hexToRgba(colorValue, 0.15),
              borderRadius: (sizeValue + padding * 2) / 2,
              padding,
            }
          : undefined
      }
      {...props}
    />
  );
}
