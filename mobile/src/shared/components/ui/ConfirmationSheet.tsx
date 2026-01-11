import { View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { BottomSheet } from "./BottomSheet";
import { Text } from "./Text";
import { Icon, IconName } from "./Icon";
import { Button } from "./Button";
import { useCallback } from "react";
import type { ComponentProps } from "react";
import type { ViewStyle } from "react-native";

type IconColor = "primary" | "success" | "warning" | "error";
type ConfirmationVariant = "default" | "destructive" | "success" | "warning";
type ButtonVariant = ComponentProps<typeof Button>["variant"];

interface CustomButton {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  loading?: boolean;
  disabled?: boolean;
}

interface ConfirmationSheetProps {
  /** Controls visibility of the sheet */
  isOpen: boolean;
  /** Callback when sheet closes */
  onClose: () => void;
  /** Sheet title */
  title: string;
  /** Description text */
  description?: string;
  /** Confirm button text */
  confirmText?: string;
  /** Cancel button text */
  cancelText?: string;
  /** Variant determines the color scheme */
  variant?: ConfirmationVariant;
  /** Icon to display (optional) */
  icon?: IconName;
  /** Callback when confirmed */
  onConfirm?: () => void;
  /** Show cancel button (default: true) */
  showCancel?: boolean;
  /** Loading state for confirm button */
  loading?: boolean;
  /** Custom style for the container */
  style?: ViewStyle;
  /** Custom buttons to render instead of default confirm/cancel buttons */
  customButtons?: CustomButton[];
}

const variantConfig: Record<
  ConfirmationVariant,
  { icon: IconName; iconColor: IconColor; bgColor: string }
> = {
  default: {
    icon: "information",
    iconColor: "primary",
    bgColor: "rgba(0, 122, 255, 0.1)",
  },
  destructive: {
    icon: "alert-circle",
    iconColor: "error",
    bgColor: "rgba(255, 59, 48, 0.1)",
  },
  success: {
    icon: "check-circle",
    iconColor: "success",
    bgColor: "rgba(52, 199, 89, 0.1)",
  },
  warning: {
    icon: "alert",
    iconColor: "warning",
    bgColor: "rgba(255, 149, 0, 0.1)",
  },
};

const variantButtonMap: Record<ConfirmationVariant, ButtonVariant> = {
  default: "primary",
  destructive: "destructive",
  success: "primary",
  warning: "primary",
};

export function ConfirmationSheet({
  isOpen,
  onClose,
  title,
  description,
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  variant = "default",
  icon,
  onConfirm,
  showCancel = true,
  loading = false,
  style,
  customButtons,
}: ConfirmationSheetProps) {
  const config = variantConfig[variant];

  const handleConfirm = useCallback(() => {
    onConfirm?.();
  }, [onConfirm]);

  const displayIcon = icon || config.icon;

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} enableDynamicSizing>
      <View style={[styles.container, style]}>
        {/* Header with Icon */}
        <View style={styles.header}>
          <View
            style={[styles.iconContainer, { backgroundColor: config.bgColor }]}
          >
            <Icon name={displayIcon} size="xl" color={config.iconColor} />
          </View>
          <Text variant="h3" style={styles.title}>
            {title}
          </Text>
          {description && (
            <Text variant="body" color="secondary" style={styles.description}>
              {description}
            </Text>
          )}
        </View>

        {/* Buttons */}
        <View style={styles.buttonsContainer}>
          {customButtons ? (
            customButtons.map((button, index) => (
              <Button
                key={index}
                title={button.label}
                onPress={button.onPress}
                variant={button.variant}
                loading={button.loading}
                disabled={button.disabled}
                style={styles.button}
              />
            ))
          ) : (
            <>
              <Button
                title={confirmText}
                variant={variantButtonMap[variant]}
                onPress={handleConfirm}
                loading={loading}
                style={styles.button}
              />

              {showCancel && (
                <Button
                  title={cancelText}
                  variant="outline"
                  onPress={onClose}
                  style={styles.button}
                />
              )}
            </>
          )}
        </View>
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create((theme) => ({
  container: {
    paddingBottom: theme.spacing(4),
  },
  header: {
    alignItems: "center",
    paddingTop: theme.spacing(2),
    paddingBottom: theme.spacing(6),
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: theme.spacing(4),
  },
  title: {
    textAlign: "center",
    marginBottom: theme.spacing(2),
  },
  description: {
    textAlign: "center",
    lineHeight: 22,
  },
  buttonsContainer: {
    gap: theme.spacing(3),
  },
  button: {
    height: 52,
    borderRadius: theme.radius.xl,
  },
}));
