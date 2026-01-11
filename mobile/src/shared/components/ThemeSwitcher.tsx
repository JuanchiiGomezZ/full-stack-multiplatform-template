import { View, Pressable } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { Text } from "./ui/Text";
import { useTheme } from "@shared/hooks";

interface ThemeSwitcherProps {
  variant?: "toggle" | "selector";
}

/**
 * Theme Switcher Component
 *
 * @example Toggle variant (simple switch)
 * <ThemeSwitcher variant="toggle" />
 *
 * @example Selector variant (light/dark/system options)
 * <ThemeSwitcher variant="selector" />
 */
export function ThemeSwitcher({ variant = "selector" }: ThemeSwitcherProps) {
  const { mode, setThemeMode, toggleTheme } = useTheme();

  if (variant === "toggle") {
    return (
      <Pressable style={styles.toggleButton} onPress={toggleTheme}>
        <Text variant="body">
          {mode === "system"
            ? "🌓 System"
            : mode === "light"
            ? "☀️ Light"
            : "🌙 Dark"}
        </Text>
      </Pressable>
    );
  }

  return (
    <View style={styles.container}>
      <Text variant="h4" style={styles.title}>
        Theme
      </Text>

      <View style={styles.optionsContainer}>
        <ThemeOption
          label="☀️ Light"
          description="Light mode"
          isSelected={mode === "light"}
          onPress={() => setThemeMode("light")}
        />

        <ThemeOption
          label="🌙 Dark"
          description="Dark mode"
          isSelected={mode === "dark"}
          onPress={() => setThemeMode("dark")}
        />

        <ThemeOption
          label="🌓 System"
          description="Follow system setting"
          isSelected={mode === "system"}
          onPress={() => setThemeMode("system")}
        />
      </View>
    </View>
  );
}

interface ThemeOptionProps {
  label: string;
  description: string;
  isSelected: boolean;
  onPress: () => void;
}

function ThemeOption({
  label,
  description,
  isSelected,
  onPress,
}: ThemeOptionProps) {
  return (
    <Pressable
      style={[styles.option, isSelected && styles.optionSelected]}
      onPress={onPress}
    >
      <View style={styles.optionContent}>
        <Text variant="body" color={isSelected ? "primary" : "secondary"}>
          {label}
        </Text>
        <Text variant="caption" color="tertiary">
          {description}
        </Text>
      </View>

      <View style={[styles.radio, isSelected && styles.radioSelected]}>
        {isSelected && <View style={styles.radioInner} />}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create((theme) => ({
  container: {
    gap: theme.spacing(3),
  },
  title: {
    marginBottom: theme.spacing(2),
  },
  optionsContainer: {
    gap: theme.spacing(2),
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: theme.spacing(4),
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.md,
    borderWidth: 2,
    borderColor: theme.colors.border,
  },
  optionSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.muted,
  },
  optionContent: {
    gap: theme.spacing(1),
  },
  radio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: theme.colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  radioSelected: {
    borderColor: theme.colors.primary,
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: theme.colors.primary,
  },
  toggleButton: {
    padding: theme.spacing(3),
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: "center",
  },
}));
