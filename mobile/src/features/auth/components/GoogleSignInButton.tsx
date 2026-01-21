import { useCallback } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useUnistyles } from 'react-native-unistyles';
import { Pressable } from '@/shared/components/ui/Pressable';
import { GoogleIcon } from '@/shared/components/icons/GoogleIcon';
import { useLoginWithGoogle } from '../hooks/useAuth';

interface GoogleSignInButtonProps {
  onError?: (error: Error) => void;
}

export function GoogleSignInButton({ onError }: GoogleSignInButtonProps) {
  const { t } = useTranslation('auth');
  const { theme } = useUnistyles();
  const loginWithGoogle = useLoginWithGoogle();

  const handlePress = useCallback(async () => {
    try {
      await loginWithGoogle.mutateAsync();
    } catch (error) {
      onError?.(new Error(error as string));
    }
  }, [loginWithGoogle, onError]);

  return (
    <Pressable
      style={[
        styles.container,
        { backgroundColor: theme.colors.background },
      ]}
      onPress={handlePress}
      disabled={loginWithGoogle.isPending}
    >
      {loginWithGoogle.isPending ? (
        <ActivityIndicator color={theme.colors.text.primary} />
      ) : (
        <>
          <GoogleIcon width={24} height={24} />
          <Text style={[styles.text, { color: theme.colors.text.primary }]}>
            {t('auth.sign_in_with_google')}
          </Text>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  text: {
    fontSize: 16,
    fontWeight: '600',
  },
});
