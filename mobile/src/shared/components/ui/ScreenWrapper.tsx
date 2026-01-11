import { View, ScrollView, ActivityIndicator } from "react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { ReactNode } from "react";
import type { ViewStyle } from "react-native";

interface CenteredOptions {
  /** Center content horizontally */
  x?: boolean;
  /** Center content vertically */
  y?: boolean;
}

type SafeAreaEdge = "top" | "bottom" | "left" | "right";

interface ScreenWrapperProps {
  children?: ReactNode;
  /** Enable vertical scrolling */
  scroll?: boolean;
  /** Center content. Can be boolean (both axes) or object { x, y } */
  centered?: boolean | CenteredOptions;
  /** Show loading spinner instead of children */
  loading?: boolean;
  /** Which safe area edges to apply padding for. Default: ["top"] */
  edges?: SafeAreaEdge[];
  /** Additional style for the container */
  style?: ViewStyle;
  /** Additional style for the content container (only applies when scroll is true) */
  contentContainerStyle?: ViewStyle;
}

const getCenteredStyle = (
  centered: boolean | CenteredOptions | undefined
): ViewStyle => {
  if (!centered) return {};

  if (centered === true) {
    return { justifyContent: "center", alignItems: "center" };
  }

  return {
    ...(centered.y && { justifyContent: "center" }),
    ...(centered.x && { alignItems: "center" }),
  };
};

export function ScreenWrapper({
  children,
  scroll = false,
  centered,
  loading = false,
  edges = ["top"],
  style,
  contentContainerStyle,
}: ScreenWrapperProps) {
  const { theme } = useUnistyles();
  const insets = useSafeAreaInsets();

  const safeAreaStyle: ViewStyle = {
    paddingTop: edges.includes("top") ? insets.top : 0,
    paddingBottom: edges.includes("bottom") ? insets.bottom : 0,
    paddingLeft: edges.includes("left") ? insets.left : 0,
    paddingRight: edges.includes("right") ? insets.right : 0,
  };

  const centeredStyle = getCenteredStyle(centered);

  if (loading) {
    return (
      <View style={[styles.container, styles.centered, safeAreaStyle, style]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (scroll) {
    return (
      <ScrollView
        style={[styles.container, safeAreaStyle, style]}
        contentContainerStyle={[
          styles.content,
          centered && { flexGrow: 1, ...centeredStyle },
          contentContainerStyle,
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {children}
      </ScrollView>
    );
  }

  return (
    <View style={[styles.container, safeAreaStyle, style]}>
      <View style={[styles.content, centeredStyle]}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: theme.spacing(6), // 24px
  },
  centered: {
    justifyContent: "center",
    alignItems: "center",
  },
}));
