'use client';

import { View, Text, StyleSheet, ActivityIndicator, ScrollView } from 'react-native';
import { useCurrentUser, ProtectedRoute } from '@/features/auth';
import { useTranslation } from 'react-i18next';

function DashboardContent() {
  const { t } = useTranslation('dashboard');
  const { data: user, isLoading } = useCurrentUser();

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.greeting}>{t('hello')}</Text>
        <Text style={styles.title}>{user?.firstName || user?.email}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('stats.title')}</Text>
        <View style={styles.statsGrid}>
          <View style={[styles.statCard, styles.statCardBlue]}>
            <Text style={styles.statValue}>0</Text>
            <Text style={styles.statLabel}>{t('stats.total')}</Text>
          </View>
          <View style={[styles.statCard, styles.statCardGreen]}>
            <Text style={styles.statValue}>0</Text>
            <Text style={styles.statLabel}>{t('stats.completed')}</Text>
          </View>
          <View style={[styles.statCard, styles.statCardOrange]}>
            <Text style={styles.statValue}>0</Text>
            <Text style={styles.statLabel}>{t('pomodoro')}</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('recent_activity')}</Text>
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>{t('no_recent_activity')}</Text>
        </View>
      </View>
    </ScrollView>
  );
}

export default function DashboardScreen() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 20,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    marginBottom: 24,
  },
  greeting: {
    fontSize: 16,
    color: '#666',
    marginBottom: 4,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statCardBlue: {
    backgroundColor: '#007AFF',
  },
  statCardGreen: {
    backgroundColor: '#34C759',
  },
  statCardOrange: {
    backgroundColor: '#FF9500',
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  emptyState: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
  },
  emptyStateText: {
    color: '#999',
    fontSize: 14,
  },
});
