import { useCallback } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useUnistyles } from 'react-native-unistyles';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '@/shared/components/ui/Button';
import { useCompleteOnboarding } from '@/features/auth/hooks/useAuth';
import { useAuthStore } from '@/features/auth/stores/auth.store';

export default function OnboardingScreen() {
  const { t } = useTranslation();
  const { theme } = useUnistyles();
  const completeOnboarding = useCompleteOnboarding();
  const user = useAuthStore((state) => state.user);

  const handleComplete = useCallback(async () => {
    await completeOnboarding.mutateAsync();
  }, [completeOnboarding]);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.content}>
        <Text style={[styles.title, { color: theme.colors.text.primary }]}>
          {t('onboarding.welcome')}
        </Text>
        <Text style={[styles.subtitle, { color: theme.colors.text.secondary }]}>
          {t('onboarding.description', { name: user?.firstName || '' })}
        </Text>

        <View style={styles.spacer} />

        <Button
          title={t('onboarding.get_started')}
          onPress={handleComplete}
          loading={completeOnboarding.isPending}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  spacer: {
    height: 48,
  },
});
