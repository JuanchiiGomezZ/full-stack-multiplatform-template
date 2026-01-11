// EmptyState Component - Displays empty state with icon and message
// Used when lists or screens have no data

import { View, type ViewProps } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { Text } from "./Text";
import { Button } from "./Button";
import { Icon, type IconName, type IconColor } from "./Icon";

type EmptyStateVariant =
  | "primary"
  | "text"
  | "success"
  | "warning"
  | "error"
  | "info";
type EmptyStateSize = "sm" | "md" | "lg";

interface EmptyStateProps extends ViewProps {
  icon?: IconName;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
  variant?: EmptyStateVariant;
  size?: EmptyStateSize;
  fullHeight?: boolean;
}

const variantIconColors: Record<EmptyStateVariant, IconColor> = {
  primary: "primary",
  text: "muted",
  success: "success",
  warning: "warning",
  error: "error",
  info: "info",
};

const variantDefaultIcons: Record<EmptyStateVariant, IconName> = {
  primary: "inbox-outline",
  text: "inbox-outline",
  success: "check-circle-outline",
  warning: "alert-outline",
  error: "alert-circle-outline",
  info: "information-outline",
};

const sizeIconSizes: Record<EmptyStateSize, "lg" | "xl" | "2xl"> = {
  sm: "lg",
  md: "xl",
  lg: "2xl",
};

export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
  variant = "text",
  size = "md",
  fullHeight = true,
  style,
  ...props
}: EmptyStateProps) {
  const iconName = icon || variantDefaultIcons[variant];
  const iconColor = variantIconColors[variant];
  const iconSize = sizeIconSizes[size];

  return (
    <View
      style={[
        styles.container,
        fullHeight && styles.containerFullHeight,
        style,
      ]}
      {...props}
    >
      <Icon name={iconName} size={iconSize} color={iconColor} withBackground />

      <View style={styles.textContainer}>
        <Text variant="h3" weight="semibold" style={styles.textCenter}>
          {title}
        </Text>
        {description && (
          <Text variant="body" color="muted" style={styles.textCenter}>
            {description}
          </Text>
        )}
      </View>

      {(actionLabel || secondaryActionLabel) && (
        <View style={styles.buttonContainer}>
          {actionLabel && onAction && (
            <Button variant="primary" title={actionLabel} onPress={onAction} />
          )}
          {secondaryActionLabel && onSecondaryAction && (
            <Button
              variant="outline"
              title={secondaryActionLabel}
              onPress={onSecondaryAction}
            />
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  container: {
    justifyContent: "center",
    alignItems: "center",
    padding: theme.spacing(6),
    gap: theme.spacing(4),
  },
  containerFullHeight: {
    flex: 1,
  },
  iconDefault: {
    backgroundColor: `${theme.colors.muted}40`,
  },
  iconSearch: {
    backgroundColor: `${theme.colors.primary}15`,
  },
  iconFilter: {
    backgroundColor: `${theme.colors.secondary}15`,
  },
  iconError: {
    backgroundColor: `${theme.colors.error}15`,
  },
  iconInfo: {
    backgroundColor: `${theme.colors.info}15`,
  },
  textContainer: {
    gap: theme.spacing(2),
    alignItems: "center",
    maxWidth: 320,
  },
  textCenter: {
    textAlign: "center",
  },
  buttonContainer: {
    flexDirection: "row",
    gap: theme.spacing(3),
    marginTop: theme.spacing(2),
  },
}));

export type { EmptyStateProps, EmptyStateVariant, EmptyStateSize };
