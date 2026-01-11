import { useAuth } from "@/features/auth";
import { useForm } from "@/shared/hooks";
import { loginSchema, type LoginFormData } from "@/features/auth/schemas/auth.schema";
import { Controller } from "react-hook-form";
import { router } from "expo-router";
import { StyleSheet } from "react-native-unistyles";
import { View } from "react-native";
import { Button, TextInput, Text, ScreenWrapper } from "@/shared/components/ui";
import { useTranslation } from "react-i18next";

export default function LoginScreen() {
  const { t } = useTranslation("auth");
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm({ schema: loginSchema });

  const { login, isLoggingIn, loginError } = useAuth();

  const onSubmit = async (data: LoginFormData) => {
    try {
      await login(data);
    } catch {
      // Error is handled by the hook
    }
  };

  return (
    <ScreenWrapper centered={{ y: true }}>
      <Text variant="h1">{t("login.title")}</Text>
      <Text variant="body" color="secondary">
        {t("login.subtitle")}
      </Text>
      <Controller
        control={control}
        name="email"
        render={({ field: { onChange, onBlur, value } }) => (
          <TextInput
            label={t("labels.email")}
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            autoCapitalize="none"
            keyboardType="email-address"
            placeholder={t("login.email_placeholder")}
            error={errors.email?.message}
          />
        )}
      />

      <Controller
        control={control}
        name="password"
        render={({ field: { onChange, onBlur, value } }) => (
          <TextInput
            label={t("labels.password")}
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            secureTextEntry
            placeholder={t("login.password_placeholder")}
            error={errors.password?.message}
          />
        )}
      />

      {loginError && (
        <Text variant="caption" color="error" style={styles.error}>
          {loginError.message}
        </Text>
      )}

      <Button title={t("login.button")} onPress={handleSubmit(onSubmit)} loading={isLoggingIn} />

      <View style={styles.linkContainer}>
        <Text variant="body" color="primary">
          {t("login.no_account")}{" "}
        </Text>
        <Text variant="body" color="primary" onPress={() => router.push("/(auth)/register")}>
          {t("login.sign_up")}
        </Text>
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create((theme) => ({
  buttonContainer: {
    marginTop: theme.spacing(2), // 8px
  },
  button: {
    width: "100%",
  },
  linkContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: theme.spacing(6), // 24px
  },
  error: {
    marginBottom: theme.spacing(3),
    textAlign: "center",
  },
}));
