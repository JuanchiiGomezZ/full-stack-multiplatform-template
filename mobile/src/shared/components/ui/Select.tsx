import { useState } from "react";
import { View, Animated, TouchableOpacity } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { BottomSheetFlatList } from "@gorhom/bottom-sheet";
import { Icon, IconName } from "./Icon";
import { Text } from "./Text";
import { InputTrigger } from "./InputTrigger";
import type { ViewStyle, StyleProp } from "react-native";
import { BottomSheet } from "./BottomSheet";
import { useTheme } from "@react-navigation/native";

/** Option type for Select component */
export interface SelectOption<T = string> {
  /** Option value */
  value: T;
  /** Option label to display */
  label: string;
  /** Option is disabled */
  disabled?: boolean;
  /** Optional description shown below label */
  description?: string;
  /** Optional icon name */
  icon?: IconName;
}

interface SelectProps<T = string> {
  /** Select label */
  label?: string;
  /** Placeholder when no value selected */
  placeholder?: string;
  /** Current value */
  value: T | null;
  /** Options to display */
  options: SelectOption<T>[];
  /** Change callback */
  onChange: (value: T) => void;
  /** Error message */
  error?: string;
  /** Disabled state */
  disabled?: boolean;
  /** Custom style */
  style?: StyleProp<ViewStyle>;
  /** Modal title */
  modalTitle?: string;
  /** Allow clearing/deselecting the selected option (default: true) */
  allowClear?: boolean;
}

export function Select<T extends string | number>({
  label,
  placeholder = "Select an option",
  value,
  options,
  onChange,
  error,
  disabled = false,
  style,
  modalTitle,
  allowClear = true,
}: SelectProps<T>) {
  const [isOpen, setIsOpen] = useState(false);

  // Get selected option
  const selectedOption = options.find((opt) => opt.value === value);

  // Handle selection
  const handleSelect = (optionValue: T) => {
    onChange(optionValue);
    setIsOpen(false);
  };

  // Handle clear
  const handleClear = () => {
    onChange(null as any);
    setIsOpen(false);
  };

  // Open/close handlers
  const open = () => !disabled && setIsOpen(true);
  const close = () => setIsOpen(false);

  // Animated rotation for chevron
  const rotation = useState(() => new Animated.Value(0))[0];
  Animated.timing(rotation, {
    toValue: isOpen ? 180 : 0,
    duration: 200,
    useNativeDriver: true,
  }).start();

  const spin = rotation.interpolate({
    inputRange: [0, 180],
    outputRange: ["0deg", "180deg"],
  });

  return (
    <View style={style}>
      {/* Trigger */}
      <InputTrigger
        label={label}
        placeholder={placeholder}
        value={selectedOption?.label || null}
        error={error}
        disabled={disabled}
        onPress={open}
        accessibilityLabel={selectedOption?.label ?? label}
        rightContent={
          <Animated.View style={{ transform: [{ rotate: spin }] }}>
            <Icon name="chevron-down" size="sm" color="muted" />
          </Animated.View>
        }
      />

      {/* BottomSheet */}
      <BottomSheet
        isOpen={isOpen}
        onClose={close}
        snapPoints={["50%", "75%"]}
        enableDynamicSizing={true}
      >
        {/* Sheet Header */}
        <View style={styles.sheetHeader}>
          <Text variant="body" weight="semibold" style={styles.sheetTitle}>
            {modalTitle ?? label ?? "Select an option"}
          </Text>
        </View>

        {/* Options List */}
        <BottomSheetFlatList
          data={options}
          keyExtractor={(item: SelectOption<T>) => String(item.value)}
          renderItem={({ item }: { item: SelectOption<T> }) => (
            <SelectOptionRow
              item={item}
              isSelected={value === item.value}
              onSelect={() => handleSelect(item.value)}
            />
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          bounces={true}
          ListFooterComponent={
            allowClear && value !== null ? (
              <TouchableOpacity
                style={styles.clearButton}
                onPress={handleClear}
                accessibilityRole="button"
              >
                <Icon name="close-circle" color="text" size="sm" />
                <Text variant="body" color="tertiary">
                  Clear selection
                </Text>
              </TouchableOpacity>
            ) : null
          }
        />
      </BottomSheet>
    </View>
  );
}

// Option row component
function SelectOptionRow<T>({
  item,
  isSelected,
  onSelect,
}: {
  item: SelectOption<T>;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const scale = useState(() => new Animated.Value(1))[0];
  const theme = useTheme();
  const handlePress = () => {
    Animated.sequence([
      Animated.timing(scale, {
        toValue: 0.98,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(scale, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(onSelect);
  };

  return (
    <TouchableOpacity
      style={[
        styles.optionRow,
        isSelected && styles.optionRowSelected,
        item.disabled && styles.optionRowDisabled,
      ]}
      onPress={item.disabled ? undefined : handlePress}
      disabled={item.disabled}
      activeOpacity={0.7}
      accessibilityState={{ selected: isSelected }}
    >
      <Animated.View style={{ transform: [{ scale }], width: "100%" }}>
        <View style={styles.optionContent}>
          {/* Icon (if any) */}
          {item.icon && (
            <Icon
              name={item.icon}
              size="md"
              color={item.disabled ? "muted" : isSelected ? "primary" : "text"}
              style={styles.optionIcon}
            />
          )}

          {/* Label & Description */}
          <View style={styles.optionTextContainer}>
            <Text
              variant="body"
              weight={isSelected ? "semibold" : "medium"}
              style={[
                isSelected && { color: theme.colors.primary },
                item.disabled ? styles.optionLabelDisabled : undefined,
              ]}
            >
              {item.label}
            </Text>
            {item.description && (
              <Text variant="caption" color="tertiary" style={styles.optionDescription}>
                {item.description}
              </Text>
            )}
          </View>

          {/* Selection indicator (Radio style) */}
          <View style={[styles.radioContainer, isSelected && styles.radioContainerSelected]}>
            {isSelected && <View style={styles.radioInner} />}
          </View>
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create((theme) => ({
  // BottomSheet
  sheetBackground: {
    backgroundColor: theme.colors.card,
    borderTopLeftRadius: theme.radius.xl,
    borderTopRightRadius: theme.radius.xl,
  },
  sheetHandle: {
    backgroundColor: theme.colors.divider,
    width: 32,
    height: 4,
    borderRadius: 2,
    marginTop: theme.spacing(2),
  },
  sheetHeader: {
    paddingHorizontal: theme.spacing(6),
    paddingBottom: theme.spacing(4),
    paddingTop: theme.spacing(2),
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.divider,
    marginBottom: theme.spacing(2),
  },
  sheetTitle: {
    textAlign: "left",
    fontSize: theme.fontSize.lg,
    color: theme.colors.text.primary,
  },

  // List
  listContent: {
    paddingHorizontal: theme.spacing(4),
    paddingBottom: theme.spacing(safeAreaBottom ?? 8), // Assuming safeAreaBottom might be available or fallback
  },

  // Option Row
  optionRow: {
    minHeight: 60,
    justifyContent: "center",
    marginBottom: theme.spacing(3),
    borderRadius: theme.radius.xl,
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: theme.spacing(4),

    // Shadow for unselected items to give depth if desired, generally flat for lists is cleaner but let's follow a "card" look if it's a list.
    // Actually, let's keep it clean list style based on the "Select" typically being a list.
    // Reverting to simple list item style but with rounded border for the selected state maybe?
    // Let's go with a card style for each option as it looks more "modern mobile" in some contexts,
    // OR just simple rows. The "Design" prompt usually implies something distinctive.
    // I will stick to a clean row with border logic.
  },
  optionRowSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primary + "0A", // Very slight tint
    borderWidth: 2,
  },
  optionRowDisabled: {
    opacity: 0.5,
    backgroundColor: theme.colors.muted,
  },
  optionContent: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
  },
  optionIcon: {
    marginRight: theme.spacing(3),
  },
  optionTextContainer: {
    flex: 1,
    marginRight: theme.spacing(3),
  },
  optionLabel: {
    color: theme.colors.text.primary,
  },
  optionLabelDisabled: {
    color: theme.colors.text.muted,
  },
  optionDescription: {
    marginTop: 2,
  },

  // Radio Button Styles
  radioContainer: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: theme.colors.border, // Default border
    alignItems: "center",
    justifyContent: "center",
  },
  radioContainerSelected: {
    borderColor: theme.colors.primary,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: theme.colors.primary,
  },

  // Clear button
  clearButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end", // Align right generally looks better for actions often
    paddingVertical: theme.spacing(4),
    marginTop: theme.spacing(2),
    paddingHorizontal: theme.spacing(4),
  },
  clearText: {
    marginLeft: theme.spacing(2),
  },
}));

// Helper for safe area if needed, otherwise rely on contentContainer padding
const safeAreaBottom = 20; // Simplified fallback, ideally from useSafeAreaInsets
