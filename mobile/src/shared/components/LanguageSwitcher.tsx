import { View, Pressable } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { Text } from "./ui/Text";
import { useLanguage, type Language } from "@shared/hooks";

interface LanguageSwitcherProps {
  variant?: "toggle" | "selector";
}

/**
 * Language Switcher Component
 *
 * @example Toggle variant (simple switch)
 * <LanguageSwitcher variant="toggle" />
 *
 * @example Selector variant (full options with radio buttons)
 * <LanguageSwitcher variant="selector" />
 */
export function LanguageSwitcher({ variant = "selector" }: LanguageSwitcherProps) {
  const { currentLanguage, changeLanguage } = useLanguage();

  if (variant === "toggle") {
    const toggleLanguage = () => {
      changeLanguage(currentLanguage === "en" ? "es" : "en");
    };

    return (
      <Pressable style={styles.toggleButton} onPress={toggleLanguage}>
        <Text variant="body">
          {currentLanguage === "en" ? "🇺🇸 English" : "🇪🇸 Español"}
        </Text>
      </Pressable>
    );
  }

  return (
    <View style={styles.container}>
      <Text variant="h4" style={styles.title}>
        Idioma / Language
      </Text>

      <View style={styles.optionsContainer}>
        <LanguageOption
          label="🇪🇸 Español"
          description="Español"
          isSelected={currentLanguage === "es"}
          onPress={() => changeLanguage("es")}
        />

        <LanguageOption
          label="🇺🇸 English"
          description="English"
          isSelected={currentLanguage === "en"}
          onPress={() => changeLanguage("en")}
        />
      </View>
    </View>
  );
}

interface LanguageOptionProps {
  label: string;
  description: string;
  isSelected: boolean;
  onPress: () => void;
}

function LanguageOption({ label, description, isSelected, onPress }: LanguageOptionProps) {
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
