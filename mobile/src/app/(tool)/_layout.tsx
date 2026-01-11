'use client';

import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useLogout } from '@/features/auth/hooks/useAuth';

export default function ToolLayout() {
  const logoutMutation = useLogout();

  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        headerRight: () => (
          <Ionicons
            name="log-out-outline"
            size={24}
            color="#ff3b30"
            style={{ marginRight: 15 }}
            onPress={() => {
              if (!logoutMutation.isPending) {
                logoutMutation.mutate();
              }
            }}
          />
        ),
        tabBarStyle: {
          borderTopWidth: 1,
          borderTopColor: '#eee',
        },
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="settings" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
