import { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, SafeAreaView, RefreshControl,
} from 'react-native';
import { router } from 'expo-router';
import { Plus } from 'lucide-react-native';
import { COLORS, SPACING, TYPE, SHADOWS } from '@/config/designTokens';
import { GoalCard } from '@/components/GoalCard';
import { SkeletonCard } from '@/components/SkeletonCard';
import { EmptyState } from '@/components/EmptyState';
import { useGoals } from '@/hooks/useGoals';
import { useDayEntriesForGoal } from '@/hooks/useDayEntries';
import { useTimerStore } from '@/stores/timerStore';
import { todayString } from '@/utils/formatDate';
import type { Goal } from '@/types/goal';
import type { HitStatus } from '@/components/HitRateBar';
import type { DayEntry } from '@/types/dayEntry';

export default function GoalsScreen() {
  const { data: goals, isLoading, refetch } = useGoals(false);
  const { activeTaskId } = useTimerStore();
  const today = todayString();

  const activeGoals = (goals ?? []).filter((g) => !g.completedAt);
  const completedGoals = (goals ?? []).filter((g) => !!g.completedAt);
  const [showCompleted, setShowCompleted] = useState(false);

  const handleRun = useCallback((goal: Goal) => {
    useTimerStore.getState().start({
      taskId: goal.id,
      taskType: 'goal',
      taskTitle: goal.title,
      allocatedMinutes: goal.allocatedMinutes,
    });
    router.push('/(app)/timer');
  }, []);

  const handleLog = useCallback((goal: Goal) => {
    router.push({ pathname: '/(app)/goal/[id]', params: { id: goal.id } });
  }, []);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>GOALS</Text>
        <TouchableOpacity
          onPress={() => router.push('/(app)/add-goal')}
          style={styles.addBtn}
          accessibilityLabel="Add goal"
        >
          <Plus size={20} color={COLORS.neutral0} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={COLORS.teal600} />
        }
      >
        {isLoading && (
          <>
            <SkeletonCard lines={3} />
            <SkeletonCard lines={3} />
          </>
        )}

        {!isLoading && activeGoals.length === 0 && (
          <EmptyState title="No active goals" subtitle="Tap + to add your first goal." />
        )}

        {!isLoading && activeGoals.length > 0 && (
          <>
            <Text style={styles.sectionLabel}>ACTIVE</Text>
            {activeGoals.map((goal) => (
              <GoalCardWithEntries
                key={goal.id}
                goal={goal}
                isTimerActive={activeTaskId === goal.id}
                onRun={() => handleRun(goal)}
                onLog={() => handleLog(goal)}
              />
            ))}
          </>
        )}

        {!isLoading && completedGoals.length > 0 && (
          <>
            <TouchableOpacity
              onPress={() => setShowCompleted((v) => !v)}
              style={styles.completedToggle}
            >
              <Text style={styles.completedToggleText}>
                ✓ Completed ({completedGoals.length})  {showCompleted ? '▲' : '▼'}
              </Text>
            </TouchableOpacity>
            {showCompleted && completedGoals.map((goal) => (
              <GoalCardWithEntries
                key={goal.id}
                goal={goal}
                isReadOnly
                onRun={() => {}}
                onLog={() => handleLog(goal)}
              />
            ))}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function GoalCardWithEntries({
  goal,
  isTimerActive = false,
  isReadOnly = false,
  onRun,
  onLog,
}: {
  goal: Goal;
  isTimerActive?: boolean;
  isReadOnly?: boolean;
  onRun: () => void;
  onLog: () => void;
}) {
  const { data: allEntries } = useDayEntriesForGoal(goal.id);
  const today = todayString();

  const todayEntry = allEntries?.find((e) => e.date === today);

  const hitRate: HitStatus[] = buildHitRate(allEntries ?? []);

  return (
    <GoalCard
      goal={goal}
      entry={todayEntry}
      hitRate={hitRate}
      isReadOnly={isReadOnly}
      isTimerActive={isTimerActive}
      onRun={onRun}
      onLog={onLog}
      onPress={onLog}
    />
  );
}

function buildHitRate(entries: DayEntry[]): HitStatus[] {
  const sorted = [...entries]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 7);

  const result: HitStatus[] = sorted.map((e) =>
    e.status === 'hit' ? 'hit'
      : e.status === 'partial' ? 'partial'
      : 'miss',
  );

  while (result.length < 7) result.push('none');
  return result.reverse() as HitStatus[];
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.teal50 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.teal700,
    paddingHorizontal: SPACING.s4,
    paddingVertical: SPACING.s4,
    ...SHADOWS.sm,
  },
  headerTitle: {
    ...TYPE.label,
    color: COLORS.neutral0,
    fontSize: 14,
  },
  addBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.teal600,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    padding: SPACING.s4,
    paddingBottom: SPACING.s16,
  },
  sectionLabel: {
    ...TYPE.label,
    color: COLORS.teal600,
    marginBottom: SPACING.s3,
  },
  completedToggle: {
    paddingVertical: SPACING.s3,
    marginBottom: SPACING.s2,
  },
  completedToggleText: {
    ...TYPE.small,
    color: COLORS.neutral400,
  },
});
