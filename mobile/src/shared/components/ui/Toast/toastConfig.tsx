import React from "react";
import { View, ActivityIndicator } from "react-native";
import { Text } from "@shared/components/ui/Text";
import type { ToastConfigParams } from "react-native-toast-message";
import { StyleSheet, useUnistyles } from "react-native-unistyles";
import { Icon, IconName } from "@shared/components/ui/Icon";

type ToastType = "success" | "error" | "warning" | "info" | "primary";

interface BaseToastProps {
  type: ToastType;
  props: ToastConfigParams<any>;
}

interface LoadingToastProps {
  props: ToastConfigParams<any>;
}

const ICON_MAP: Record<ToastType, IconName> = {
  success: "check-circle",
  error: "close-circle",
  warning: "alert-circle",
  info: "information",
  primary: "star",
};

/**
 * Base toast component for success, error, warning, info, and primary types
 */
const BaseToast: React.FC<BaseToastProps> = ({ type, props }) => {
  const { theme } = useUnistyles();
  const { text1, text2 } = props;

  const getTypeColor = () => {
    switch (type) {
      case "success":
        return theme.colors.success;
      case "error":
        return theme.colors.error;
      case "warning":
        return theme.colors.warning;
      case "info":
        return theme.colors.info;
      case "primary":
        return theme.colors.primary;
    }
  };

  const typeColor = getTypeColor();
  const iconName = ICON_MAP[type];

  return (
    <View style={[stylesheet.container, { borderLeftColor: typeColor }]}>
      <View
        style={[stylesheet.background, { backgroundColor: theme.colors.card }]}
      />

      <Icon
        name={iconName}
        size="md"
        color={type}
        style={{ marginHorizontal: theme.spacing(2) }}
      />

      <View style={stylesheet.contentContainer}>
        {text1 && (
          <Text variant="body" weight="medium" style={stylesheet.title}>
            {text1}
          </Text>
        )}
        {text2 && (
          <Text variant="bodySmall" weight="regular" style={stylesheet.message}>
            {text2}
          </Text>
        )}
      </View>
    </View>
  );
};

/**
 * Loading toast component with spinner
 */
const LoadingToast: React.FC<LoadingToastProps> = ({ props }) => {
  const { theme } = useUnistyles();
  const { text1, text2 } = props;

  return (
    <View style={[stylesheet.container, stylesheet.loadingContainer]}>
      <View
        style={[stylesheet.background, { backgroundColor: theme.colors.card }]}
      />

      <View style={stylesheet.iconContainer}>
        <ActivityIndicator size="small" color={theme.colors.primary} />
      </View>

      <View style={stylesheet.contentContainer}>
        {text1 && (
          <Text variant="body" weight="medium" style={stylesheet.title}>
            {text1}
          </Text>
        )}
        {text2 && (
          <Text variant="bodySmall" weight="regular" style={stylesheet.message}>
            {text2}
          </Text>
        )}
      </View>
    </View>
  );
};

const stylesheet = StyleSheet.create((theme) => ({
  container: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: theme.spacing(4),
    marginTop: theme.spacing(4),
    borderRadius: theme.radius.md,
    borderLeftWidth: 4,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  loadingContainer: {
    borderLeftWidth: 0,
  },
  background: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  iconContainer: {
    padding: theme.spacing(3),
    justifyContent: "center",
    alignItems: "center",
  },
  contentContainer: {
    flex: 1,
    paddingVertical: theme.spacing(3),
    paddingRight: theme.spacing(3),
    gap: theme.spacing(1),
  },
  title: {
    color: theme.colors.text.primary,
  },
  message: {
    color: theme.colors.text.secondary,
  },
  closeButton: {
    padding: theme.spacing(2),
    justifyContent: "center",
    alignItems: "center",
    width: 32,
    height: 32,
  },
}));

/**
 * Toast configuration object for react-native-toast-message
 */
export const toastConfig = {
  success: (props: ToastConfigParams<any>) => (
    <BaseToast type="success" props={props} />
  ),
  error: (props: ToastConfigParams<any>) => (
    <BaseToast type="error" props={props} />
  ),
  warning: (props: ToastConfigParams<any>) => (
    <BaseToast type="warning" props={props} />
  ),
  info: (props: ToastConfigParams<any>) => (
    <BaseToast type="info" props={props} />
  ),
  primary: (props: ToastConfigParams<any>) => (
    <BaseToast type="primary" props={props} />
  ),
  loading: (props: ToastConfigParams<any>) => <LoadingToast props={props} />,
};
