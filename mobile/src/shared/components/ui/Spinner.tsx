import { ActivityIndicator } from "react-native";
import { useUnistyles } from "react-native-unistyles";

type SpinnerSize = "sm" | "md" | "lg";
type SpinnerColor = "primary" | "muted";

interface SpinnerProps {
  size?: SpinnerSize;
  color?: SpinnerColor;
}

const sizeMap: Record<SpinnerSize, "small" | "large"> = {
  sm: "small",
  md: "small",
  lg: "large",
};

export function Spinner({ size = "md", color = "primary" }: SpinnerProps) {
  const { theme } = useUnistyles();

  const colorValue =
    color === "primary" ? theme.colors.primary : theme.colors.text.muted;

  return <ActivityIndicator size={sizeMap[size]} color={colorValue} />;
}
