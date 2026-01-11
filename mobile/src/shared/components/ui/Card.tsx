import { View } from "react-native";
import type { ViewStyle } from "react-native";
import type { ReactNode } from "react";
import { StyleSheet } from "react-native-unistyles";

interface CardProps {
  children: ReactNode;
  style?: ViewStyle;
  contentStyle?: ViewStyle;
}

export function Card({ children, style, contentStyle }: CardProps) {
  return (
    <View style={[styles.card, style]}>
      <View style={[styles.content, contentStyle]}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  card: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  content: {
    padding: theme.spacing(4),
  },
}));
