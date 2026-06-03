import { useEffect, useMemo } from 'react';
import { Tabs, router } from 'expo-router';
import { View, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Sun, Grid2x2, Target, LogOut } from 'lucide-react-native';
import { COLORS, TYPE } from '@/config/designTokens';
import { useAuthStore } from '@/stores/authStore';
import { FloatingTimerPill } from '@/components/FloatingTimerPill';
import { useTimerNotification } from '@/hooks/useTimerNotification';
import { useNotificationSetup } from '@/hooks/useNotificationSetup';
import { useGoals } from '@/hooks/useGoals';
import { useDayEntriesByDate } from '@/hooks/useDayEntries';
import { todayString, isWeekend } from '@/utils/formatDate';

export default function AppLayout() {
  const insets = useSafeAreaInsets();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const clearAuth = useAuthStore((s) => s.clearAuth);

  const handleLogout = () => {
    Alert.alert('Sign out', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: () => clearAuth() },
    ]);
  };
  const { data: goals } = useGoals(false);
  const { data: todayEntries } = useDayEntriesByDate(todayString());

  const todayGoals = useMemo(() => {
    const weekend = isWeekend(todayString());
    return (goals ?? []).filter((g) => {
      if (g.completedAt) return false;
      if (!g.isWeekdayGoal && !g.isWeekendGoal) return true;
      return weekend ? g.isWeekendGoal : g.isWeekdayGoal;
    });
  }, [goals]);

  useNotificationSetup();
  useTimerNotification(todayGoals, todayEntries ?? []);

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/(auth)');
    }
  }, [isAuthenticated]);

  if (!isAuthenticated) return null;

  return (
    <View style={styles.container}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: COLORS.teal700,
          tabBarInactiveTintColor: COLORS.neutral400,
          tabBarStyle: [styles.tabBar, { height: 64 + insets.bottom, paddingBottom: insets.bottom }],
          tabBarLabelStyle: { ...TYPE.label, fontSize: 10, marginBottom: 2 },
        }}
      >
        <Tabs.Screen
          name="today"
          options={{
            title: 'TODAY',
            tabBarIcon: ({ color, size }) => <Sun size={size} color={color} />,
          }}
        />
        <Tabs.Screen
          name="matrix"
          options={{
            title: 'MATRIX',
            tabBarIcon: ({ color, size }) => <Grid2x2 size={size} color={color} />,
          }}
        />
        <Tabs.Screen
          name="goals"
          options={{
            title: 'GOALS',
            tabBarIcon: ({ color, size }) => <Target size={size} color={color} />,
          }}
        />
        <Tabs.Screen
          name="logout"
          options={{
            title: 'SIGN OUT',
            tabBarIcon: ({ color, size }) => <LogOut size={size} color={color} />,
            tabBarButton: (props) => (
              <TouchableOpacity
                {...(props as any)}
                onPress={handleLogout}
                style={props.style}
                accessibilityLabel="Sign out"
              />
            ),
          }}
        />
        <Tabs.Screen name="add-goal" options={{ href: null }} />
        <Tabs.Screen name="timer" options={{ href: null }} />
        <Tabs.Screen name="task/[id]" options={{ href: null }} />
        <Tabs.Screen name="goal/[id]" options={{ href: null }} />
      </Tabs>
      <FloatingTimerPill />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tabBar: {
    backgroundColor: COLORS.neutral0,
    borderTopWidth: 1,
    borderTopColor: COLORS.teal100,
    paddingTop: 8,
  },
});
