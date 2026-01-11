import React from "react";
import ToastComponent from "react-native-toast-message";
import { toastConfig } from "./toastConfig";

/**
 * Toast component wrapper
 * This should be rendered once at the root of your app
 */
export const Toast: React.FC = () => {
  return <ToastComponent config={toastConfig} />;
};
