// ErrorState Component - Displays error state with retry option
// Used when API calls or operations fail

import { View, type ViewProps } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { Text } from "./Text";
import { Button } from "./Button";
import { Icon, type IconName } from "./Icon";

type ErrorType =
  | "network"
  | "server"
  | "notfound"
  | "unauthorized"
  | "forbidden"
  | "generic";
type ErrorStateSize = "sm" | "md" | "lg";

interface ErrorStateProps extends ViewProps {
  type?: ErrorType;
  title?: string;
  message?: string;
  onRetry?: () => void;
  retryLabel?: string;
  onAction?: () => void;
  actionLabel?: string;
  showIcon?: boolean;
  size?: ErrorStateSize;
  fullHeight?: boolean;
}

const errorTypeConfig: Record<
  ErrorType,
  { icon: IconName; defaultTitle: string; defaultMessage: string }
> = {
  network: {
    icon: "cloud-off-outline",
    defaultTitle: "Sin conexión",
    defaultMessage:
      "No pudimos conectarnos al servidor. Verifica tu conexión a internet e intenta nuevamente.",
  },
  server: {
    icon: "server-outline",
    defaultTitle: "Error del servidor",
    defaultMessage:
      "Ocurrió un error en el servidor. Por favor, intenta nuevamente más tarde.",
  },
  notfound: {
    icon: "file-search-outline",
    defaultTitle: "No encontrado",
    defaultMessage: "El contenido que buscas no existe o fue eliminado.",
  },
  unauthorized: {
    icon: "lock-outline",
    defaultTitle: "No autorizado",
    defaultMessage: "Tu sesión expiró. Por favor, inicia sesión nuevamente.",
  },
  forbidden: {
    icon: "cancel",
    defaultTitle: "Acceso denegado",
    defaultMessage: "No tienes permisos para acceder a este contenido.",
  },
  generic: {
    icon: "alert-circle-outline",
    defaultTitle: "Algo salió mal",
    defaultMessage:
      "Ocurrió un error inesperado. Por favor, intenta nuevamente.",
  },
};

const sizeIconSizes: Record<ErrorStateSize, "lg" | "xl" | "2xl"> = {
  sm: "lg",
  md: "xl",
  lg: "2xl",
};

export function ErrorState({
  type = "generic",
  title,
  message,
  onRetry,
  retryLabel = "Reintentar",
  onAction,
  actionLabel,
  showIcon = true,
  size = "md",
  fullHeight = true,
  style,
  ...props
}: ErrorStateProps) {
  const config = errorTypeConfig[type];
  const displayTitle = title || config.defaultTitle;
  const displayMessage = message || config.defaultMessage;
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
      {showIcon && <Icon name={config.icon} size={iconSize} color="error" withBackground/>}

      <View style={styles.textContainer}>
        <Text variant="h3" weight="semibold" style={styles.textCenter}>
          {displayTitle}
        </Text>
        <Text variant="body" color="muted" style={styles.textCenter}>
          {displayMessage}
        </Text>
      </View>

      {(onRetry || onAction) && (
        <View style={styles.buttonContainer}>
          {onRetry && (
            <Button variant="outline" title={retryLabel} onPress={onRetry} />
          )}
          {onAction && actionLabel && (
            <Button variant="primary" title={actionLabel} onPress={onAction} />
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

export type { ErrorStateProps, ErrorType, ErrorStateSize };
