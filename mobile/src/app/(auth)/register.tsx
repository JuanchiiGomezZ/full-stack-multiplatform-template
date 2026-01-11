import { useAuth } from "@/features/auth";
import { useForm } from "@/shared/hooks";
import { registerSchema, type RegisterFormData } from "@/features/auth/schemas/auth.schema";
import { Controller } from "react-hook-form";
import { router } from "expo-router";
import { useTranslation } from "react-i18next";
import { ScreenWrapper, Text, TextInput, Button } from "@/shared/components/ui";
import { StyleSheet } from "react-native-unistyles";

export default function RegisterScreen() {
  const { t } = useTranslation("auth");
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm({ schema: registerSchema });

  const { register, isRegistering, registerError } = useAuth();

  const onSubmit = async (data: RegisterFormData) => {
    try {
      await register(data);
    } catch {
      // Error is handled by the hook
    }
  };

  return (
    <ScreenWrapper centered={{ y: true }}>
      <Text variant="h1" style={styles.title}>
        {t("register.title")}
      </Text>
      <Text variant="body" color="secondary" style={styles.subtitle}>
        {t("register.subtitle")}
      </Text>

      <Controller
        control={control}
        name="firstName"
        render={({ field: { onChange, onBlur, value } }) => (
          <TextInput
            label={t("register.first_name_label")}
            placeholder={t("register.first_name_placeholder")}
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
          />
        )}
      />

      <Controller
        control={control}
        name="lastName"
        render={({ field: { onChange, onBlur, value } }) => (
          <TextInput
            label={t("register.last_name_label")}
            placeholder={t("register.last_name_placeholder")}
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
          />
        )}
      />

      <Controller
        control={control}
        name="email"
        render={({ field: { onChange, onBlur, value } }) => (
          <TextInput
            label={t("labels.email")}
            placeholder={t("login.email_placeholder")}
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            autoCapitalize="none"
            keyboardType="email-address"
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
            placeholder={t("login.password_placeholder")}
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            secureTextEntry
            error={errors.password?.message}
          />
        )}
      />

      {registerError && (
        <Text variant="caption" color="error" style={styles.errorText}>
          {registerError.message}
        </Text>
      )}

      <Button
        title={t("register.button")}
        onPress={handleSubmit(onSubmit)}
        loading={isRegistering}
        style={styles.button}
      />

      <Text variant="body" color="secondary" style={styles.linkText}>
        {t("register.have_account")}{" "}
        <Text
          variant="body"
          color="primary"
          onPress={() => router.replace("/(auth)/login" as const)}
        >
          {t("register.sign_in")}
        </Text>
      </Text>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create((theme) => ({
  title: {
    marginBottom: theme.spacing(2),
  },
  subtitle: {
    marginBottom: theme.spacing(8),
  },
  errorText: {
    marginBottom: theme.spacing(3),
    textAlign: "center",
  },
  button: {
    marginTop: theme.spacing(6),
    width: "100%",
  },
  linkText: {
    marginTop: theme.spacing(6),
    textAlign: "center",
  },
}));
