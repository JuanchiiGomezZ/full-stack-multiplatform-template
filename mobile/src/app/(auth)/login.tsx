import { useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { router } from 'expo-router';
import { useForm } from '@/shared/hooks';
import { loginSchema, type LoginFormData } from '@/features/auth/schemas/auth.schema';
import { useAuth, useLoginWithGoogle } from '@/features/auth/hooks/useAuth';
import { Controller } from 'react-hook-form';
import { useUnistyles } from 'react-native-unistyles';
import { Button, TextInput, Text, ScreenWrapper } from '@/shared/components/ui';
import { GoogleSignInButton } from '@/features/auth/components/GoogleSignInButton';

export default function LoginScreen() {
  const { t } = useTranslation('auth');
  const { theme } = useUnistyles();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm({ schema: loginSchema });

  const { login, isLoggingIn, loginError } = useAuth();
  const loginWithGoogle = useLoginWithGoogle();

  const onSubmit = async (data: LoginFormData) => {
    try {
      await login(data);
    } catch {
      // Error is handled by the hook
    }
  };

  const handleGoogleError = useCallback((error: Error) => {
    console.error('Google login error:', error);
  }, []);

  return (
    <ScreenWrapper centered={{ y: true }}>
      <Text variant="h1">{t('login.title')}</Text>
      <Text variant="body" color="secondary" style={styles.subtitle}>
        {t('login.subtitle')}
      </Text>

      <View style={styles.googleContainer}>
        <GoogleSignInButton onError={handleGoogleError} />
      </View>

      <View style={styles.divider}>
        <View style={[styles.dividerLine, { backgroundColor: theme.colors.border }]} />
        <Text variant="caption" color="secondary" style={styles.dividerText}>
          {t('login.or_continue_with')}
        </Text>
        <View style={[styles.dividerLine, { backgroundColor: theme.colors.border }]} />
      </View>

      <Controller
        control={control}
        name="email"
        render={({ field: { onChange, onBlur, value } }) => (
          <TextInput
            label={t('labels.email')}
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            autoCapitalize="none"
            keyboardType="email-address"
            placeholder={t('login.email_placeholder')}
            error={errors.email?.message}
          />
        )}
      />

      <Controller
        control={control}
        name="password"
        render={({ field: { onChange, onBlur, value } }) => (
          <TextInput
            label={t('labels.password')}
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            secureTextEntry
            placeholder={t('login.password_placeholder')}
            error={errors.password?.message}
          />
        )}
      />

      {loginError && (
        <Text variant="caption" color="error" style={styles.error}>
          {loginError.message}
        </Text>
      )}

      <Button
        title={t('login.button')}
        onPress={handleSubmit(onSubmit)}
        loading={isLoggingIn}
      />

      <View style={styles.linkContainer}>
        <Text variant="body" color="secondary">
          {t('login.no_account')}{' '}
        </Text>
        <Text variant="body" color="primary" onPress={() => router.replace('/(auth)/register' as string)}>
          {t('login.sign_up')}
        </Text>
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  subtitle: {
    marginBottom: 32,
  },
  googleContainer: {
    marginBottom: 24,
    width: '100%',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    paddingHorizontal: 16,
  },
  error: {
    marginBottom: 16,
    textAlign: 'center',
  },
  linkContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
  },
});
