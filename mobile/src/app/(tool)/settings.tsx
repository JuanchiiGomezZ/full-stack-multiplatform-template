'use client';

import { View, Text, StyleSheet } from 'react-native';
import { useCurrentUser } from '@/features/auth';
import { LanguageSwitcher } from '@shared/components/LanguageSwitcher';
import { useTranslation } from 'react-i18next';

export default function SettingsScreen() {
  const { t } = useTranslation('settings');
  const { data: user } = useCurrentUser();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('title')}</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('sections.account')}</Text>
        <Text style={styles.item}>{t('account.email')}: {user?.email}</Text>
        <Text style={styles.item}>Role: {user?.role}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('sections.preferences')}</Text>
        <LanguageSwitcher variant="selector" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 30,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
    color: '#333',
  },
  item: {
    fontSize: 16,
    paddingVertical: 8,
    color: '#666',
  },
});
