// DatePicker Component - Using BottomSheet for iOS
// Date picker with native date selection

import { View, TouchableOpacity, Platform } from "react-native";
import type { ViewStyle } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import type { DateTimePickerEvent } from "@react-native-community/datetimepicker";
import { StyleSheet, useUnistyles } from "react-native-unistyles";
import { Text, Icon, BottomSheet, InputTrigger } from "@/shared/components/ui";
import type { IconName } from "@/shared/components/ui/Icon";
import { formatDate } from "@/shared/utils/format";
import { useState, useCallback, useEffect } from "react";

// ==================== TYPES ====================

type DatePickerMode = "date" | "time" | "datetime";

interface DatePickerProps {
  /** Picker label */
  label?: string;
  /** Placeholder text */
  placeholder?: string;
  /** Current value */
  value: Date | null;
  /** Change callback */
  onChange: (date: Date | null) => void;
  /** Minimum date */
  minimumDate?: Date;
  /** Maximum date */
  maximumDate?: Date;
  /** Date format for display */
  format?: string;
  /** Error message */
  error?: string;
  /** Disabled state */
  disabled?: boolean;
  /** Mode: date, time, or datetime */
  mode?: DatePickerMode;
  /** Custom style */
  style?: ViewStyle;
}

// ==================== COMPONENT ====================

export function DatePicker({
  label,
  placeholder = "Seleccionar fecha...",
  value,
  onChange,
  minimumDate,
  maximumDate,
  format = "dd/MM/yyyy",
  error,
  disabled = false,
  mode = "date",
  style,
}: DatePickerProps) {
  const { theme } = useUnistyles();
  const [isOpen, setIsOpen] = useState(false);
  const [tempDate, setTempDate] = useState(value || new Date());

  // Sync tempDate when value changes or sheet opens
  useEffect(() => {
    if (isOpen) {
      setTempDate(value || new Date());
    }
  }, [isOpen, value]);

  // Handle date change from picker
  const handleChange = useCallback(
    (event: DateTimePickerEvent, selectedDate?: Date) => {
      if (Platform.OS === "android") {
        setIsOpen(false);
        if (event.type === "set" && selectedDate) {
          onChange(selectedDate);
        }
      } else {
        // iOS - update temp date
        if (selectedDate) {
          setTempDate(selectedDate);
        }
      }
    },
    [onChange]
  );

  // Confirm selection (iOS)
  const handleConfirm = useCallback(() => {
    onChange(tempDate);
    setIsOpen(false);
  }, [onChange, tempDate]);

  // Cancel selection (iOS)
  const handleCancel = useCallback(() => {
    setTempDate(value || new Date());
    setIsOpen(false);
  }, [value]);

  // Clear value
  const handleClear = useCallback(() => {
    onChange(null);
  }, [onChange]);

  // Get display format based on mode
  const getDisplayFormat = useCallback(() => {
    if (mode === "time") return "HH:mm";
    if (mode === "datetime") return "dd/MM/yyyy HH:mm";
    return format;
  }, [mode, format]);

  // Format displayed value
  const displayValue = value ? formatDate(value, getDisplayFormat()) : null;

  // Get icon based on mode
  const getIcon = (): IconName => {
    if (mode === "time") return "clock-outline";
    return "calendar-outline";
  };

  return (
    <View style={style}>
      {/* Picker Trigger */}
      <InputTrigger
        label={label}
        placeholder={placeholder}
        value={displayValue}
        error={error}
        disabled={disabled}
        onPress={() => setIsOpen(true)}
        accessibilityLabel={label || "Seleccionar fecha"}
        leftContent={<Icon name={getIcon()} size="sm" color="muted" />}
        rightContent={
          value && !disabled ? (
            <TouchableOpacity
              onPress={handleClear}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Icon name="close-circle" size="sm" color="muted" />
            </TouchableOpacity>
          ) : undefined
        }
      />

      {/* Android DateTimePicker (inline modal) */}
      {Platform.OS === "android" && isOpen && (
        <DateTimePicker
          value={tempDate}
          mode={mode === "datetime" ? "date" : mode}
          display="default"
          onChange={handleChange}
          minimumDate={minimumDate}
          maximumDate={maximumDate}
        />
      )}

      {/* iOS DateTimePicker (BottomSheet) */}
      {Platform.OS === "ios" && (
        <BottomSheet isOpen={isOpen} onClose={handleCancel} enableDynamicSizing>
          {/* Header */}
          <View style={styles.sheetHeader}>
            <TouchableOpacity onPress={handleCancel} style={styles.headerButton}>
              <Text color="muted" weight="medium">
                Cancelar
              </Text>
            </TouchableOpacity>
            <Text variant="body" weight="semibold">
              {label || "Seleccionar"}
            </Text>
            <TouchableOpacity onPress={handleConfirm} style={styles.headerButton}>
              <Text weight="medium" style={{ color: theme.colors.primary }}>
                Confirmar
              </Text>
            </TouchableOpacity>
          </View>

          {/* Picker */}
          <View style={styles.pickerContainer}>
            <DateTimePicker
              value={tempDate}
              mode={mode === "datetime" ? "date" : mode}
              display="spinner"
              onChange={handleChange}
              minimumDate={minimumDate}
              maximumDate={maximumDate}
              style={{ height: 180, width: "100%" }}
            />

            {/* Additional time picker for datetime mode */}
            {mode === "datetime" && (
              <DateTimePicker
                value={tempDate}
                mode="time"
                display="spinner"
                onChange={handleChange}
                style={{ height: 180, width: "100%" }}
              />
            )}
          </View>
        </BottomSheet>
      )}
    </View>
  );
}

// ==================== STYLES ====================

const styles = StyleSheet.create((theme) => ({
  // Bottom sheet styles
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: theme.spacing(3),
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    marginBottom: theme.spacing(4),
  },
  headerButton: {
    paddingHorizontal: theme.spacing(2),
    paddingVertical: theme.spacing(1),
  },
  pickerContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: theme.spacing(6),
  },
}));

// ==================== CONVENIENCE VARIANTS ====================

/**
 * Date only picker
 */
export function DateOnlyPicker(props: Omit<DatePickerProps, "mode">) {
  return <DatePicker mode="date" {...props} />;
}

/**
 * Time only picker
 */
export function TimePicker(props: Omit<DatePickerProps, "mode" | "format">) {
  return <DatePicker mode="time" placeholder="Seleccionar hora..." {...props} />;
}

/**
 * DateTime picker
 */
export function DateTimePicker2(props: Omit<DatePickerProps, "mode">) {
  return <DatePicker mode="datetime" {...props} />;
}

// ==================== EXPORTS ====================

export type { DatePickerProps, DatePickerMode };
