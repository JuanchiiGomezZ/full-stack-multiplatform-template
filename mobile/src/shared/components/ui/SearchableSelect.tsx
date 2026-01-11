import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { View, Animated, TouchableOpacity, TextInput as RNTextInput } from "react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";
import { BottomSheetFlatList, BottomSheetTextInput } from "@gorhom/bottom-sheet";
import { Icon } from "./Icon";
import type { IconName } from "./Icon";
import { Text } from "./Text";
import { InputTrigger } from "./InputTrigger";
import type { ViewStyle, StyleProp } from "react-native";
import { BottomSheet } from "./BottomSheet";

/** Option type for SearchableSelect component */
export interface SearchableSelectOption<T = string> {
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

interface SearchableSelectProps<T = string> {
  /** Select label */
  label?: string;
  /** Placeholder when no value selected */
  placeholder?: string;
  /** Search input placeholder */
  searchPlaceholder?: string;
  /** Current value */
  value: T | null;
  /** Options to display */
  options: SearchableSelectOption<T>[];
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
  /** Empty state message when no results */
  emptyMessage?: string;
}

export function SearchableSelect<T extends string | number>({
  label,
  placeholder = "Select an option",
  searchPlaceholder = "Search...",
  value,
  options,
  onChange,
  error,
  disabled = false,
  style,
  modalTitle,
  allowClear = true,
  emptyMessage = "No results found",
}: SearchableSelectProps<T>) {
  const { theme } = useUnistyles();
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const searchInputRef = useRef<RNTextInput>(null);

  // Get selected option
  const selectedOption = options.find((opt) => opt.value === value);

  // Filter options based on search query
  const filteredOptions = useMemo(() => {
    if (!searchQuery.trim()) return options;

    const query = searchQuery.toLowerCase().trim();
    return options.filter(
      (opt) =>
        opt.label.toLowerCase().includes(query) || opt.description?.toLowerCase().includes(query)
    );
  }, [options, searchQuery]);

  // Handle selection
  const handleSelect = useCallback(
    (optionValue: T) => {
      onChange(optionValue);
      setIsOpen(false);
      setSearchQuery("");
    },
    [onChange]
  );

  // Handle clear
  const handleClear = useCallback(() => {
    onChange(null as any);
    setIsOpen(false);
    setSearchQuery("");
  }, [onChange]);

  // Open/close handlers
  const open = useCallback(() => {
    if (!disabled) {
      setIsOpen(true);
    }
  }, [disabled]);

  const close = useCallback(() => {
    setIsOpen(false);
    setSearchQuery("");
  }, []);

  // Clear search
  const clearSearch = useCallback(() => {
    setSearchQuery("");
    searchInputRef.current?.focus();
  }, []);

  // Animated rotation for chevron
  const rotation = useState(() => new Animated.Value(0))[0];

  useEffect(() => {
    Animated.timing(rotation, {
      toValue: isOpen ? 180 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [isOpen, rotation]);

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
      <BottomSheet isOpen={isOpen} onClose={close} snapPoints={["60%", "85%"]}>
        {/* Sheet Header */}
        <View style={styles.sheetHeader}>
          <Text variant="body" weight="semibold" style={styles.sheetTitle}>
            {modalTitle ?? label ?? "Select an option"}
          </Text>
        </View>

        {/* Search Input */}
        <View style={styles.searchContainer}>
          <Icon name="magnify" size="sm" color="muted" />
          <BottomSheetTextInput
            ref={searchInputRef as any}
            style={[styles.searchInput, { color: theme.colors.text.primary }]}
            placeholder={searchPlaceholder}
            placeholderTextColor={theme.colors.text.muted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={clearSearch}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Icon name="close-circle" size="sm" color="muted" />
            </TouchableOpacity>
          )}
        </View>

        {/* Options List */}
        <BottomSheetFlatList
          data={filteredOptions}
          keyExtractor={(item: SearchableSelectOption<T>) => String(item.value)}
          renderItem={({ item }: { item: SearchableSelectOption<T> }) => (
            <SearchableSelectOptionRow
              item={item}
              isSelected={value === item.value}
              onSelect={() => handleSelect(item.value)}
              searchQuery={searchQuery}
            />
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          bounces={true}
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Icon name="magnify-close" size="xl" color="muted" />
              <Text variant="body" color="muted" style={styles.emptyText}>
                {emptyMessage}
              </Text>
            </View>
          }
          ListFooterComponent={
            allowClear && value !== null ? (
              <TouchableOpacity
                style={styles.clearButton}
                onPress={handleClear}
                accessibilityRole="button"
              >
                <Icon name="close-circle" color="text" size="sm" />
                <Text variant="body" color="tertiary" style={styles.clearText}>
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

// Helper to highlight matching text
function HighlightedText({
  text,
  highlight,
  isSelected,
}: {
  text: string;
  highlight: string;
  isSelected: boolean;
}) {
  const { theme } = useUnistyles();

  if (!highlight.trim()) {
    return (
      <Text variant="body" weight={isSelected ? "semibold" : "medium"}>
        {text}
      </Text>
    );
  }

  const parts = text.split(new RegExp(`(${highlight})`, "gi"));

  return (
    <Text variant="body" weight={isSelected ? "semibold" : "medium"}>
      {parts.map((part, index) =>
        part.toLowerCase() === highlight.toLowerCase() ? (
          <Text key={index} weight="bold" style={{ color: theme.colors.primary }}>
            {part}
          </Text>
        ) : (
          part
        )
      )}
    </Text>
  );
}

// Option row component
function SearchableSelectOptionRow<T>({
  item,
  isSelected,
  onSelect,
  searchQuery,
}: {
  item: SearchableSelectOption<T>;
  isSelected: boolean;
  onSelect: () => void;
  searchQuery: string;
}) {
  const scale = useState(() => new Animated.Value(1))[0];

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
            <HighlightedText text={item.label} highlight={searchQuery} isSelected={isSelected} />
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
  // Sheet Header
  sheetHeader: {
    paddingBottom: theme.spacing(4),
    paddingTop: theme.spacing(2),
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.divider,
    marginBottom: theme.spacing(3),
  },
  sheetTitle: {
    textAlign: "left",
    fontSize: theme.fontSize.lg,
    color: theme.colors.text.primary,
  },

  // Search
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.muted,
    borderRadius: theme.radius.lg,
    paddingHorizontal: theme.spacing(4),
    marginBottom: theme.spacing(4),
    minHeight: 48,
    gap: theme.spacing(3),
  },
  searchInput: {
    flex: 1,
    fontSize: theme.fontSize.base,
    fontFamily: theme.fontFamily.regular,
    paddingVertical: theme.spacing(3),
  },

  // List
  listContent: {
    paddingBottom: 20,
  },

  // Empty state
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: theme.spacing(10),
  },
  emptyText: {
    marginTop: theme.spacing(3),
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
  },
  optionRowSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primary + "0A",
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
  optionDescription: {
    marginTop: 2,
  },

  // Radio Button Styles
  radioContainer: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: theme.colors.border,
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
    justifyContent: "flex-end",
    paddingVertical: theme.spacing(4),
    marginTop: theme.spacing(2),
  },
  clearText: {
    marginLeft: theme.spacing(2),
  },
}));
