import { useState, useCallback } from 'react';
import {
  View, ScrollView, Text, StyleSheet, SafeAreaView, RefreshControl,
} from 'react-native';
import { router } from 'expo-router';
import {
  Gesture, GestureDetector,
} from 'react-native-gesture-handler';
import Animated, { runOnJS } from 'react-native-reanimated';
import { COLORS, SPACING, TYPE } from '@/config/designTokens';
import { DateNavHeader } from '@/components/DateNavHeader';
import { StatsBanner } from '@/components/StatsBanner';
import { GoalCard } from '@/components/GoalCard';
import { SkeletonCard } from '@/components/SkeletonCard';
import { EmptyState } from '@/components/EmptyState';
import { useGoals } from '@/hooks/useGoals';
import { useDayEntriesByDate } from '@/hooks/useDayEntries';
import { useTimerStore } from '@/stores/timerStore';
import {
  todayString, subtractDay, addDay, isWeekend,
} from '@/utils/formatDate';
import type { DayEntry } from '@/types/dayEntry';
import type { Goal } from '@/types/goal';
import type { HitStatus } from '@/components/HitRateBar';

export default function TodayScreen() {
  const [viewDate, setViewDate] = useState(todayString());
  const isReadOnly = viewDate < todayString();
  const canGoNext = viewDate < todayString();

  const { data: goals, isLoading: goalsLoading, refetch: refetchGoals } = useGoals(false);
  const { data: entries, isLoading: entriesLoading, refetch: refetchEntries } = useDayEntriesByDate(viewDate);
  const { activeTaskId } = useTimerStore();

  const isLoading = goalsLoading || entriesLoading;

  const goToPrev = useCallback(() => setViewDate((d) => subtractDay(d)), []);
  const goToNext = useCallback(() => {
    if (canGoNext) setViewDate((d) => addDay(d));
  }, [canGoNext]);

  const swipeGesture = Gesture.Pan()
    .activeOffsetX([-30, 30])   // only activate after 30px horizontal movement
    .failOffsetY([-8, 8])       // fail (hand off to ScrollView) if user moves vertically first
    .onEnd((e) => {
      if (e.translationX < -60) runOnJS(goToPrev)();
      else if (e.translationX > 60) runOnJS(goToNext)();
    });

  const onRefresh = useCallback(async () => {
    await Promise.all([refetchGoals(), refetchEntries()]);
  }, [refetchGoals, refetchEntries]);

  const isViewingToday = viewDate === todayString();

  const weekend = isWeekend(viewDate);
  const todayGoals = (goals ?? [])
    .filter((g) => {
      if (g.completedAt) return false;
      if (!g.isWeekdayGoal && !g.isWeekendGoal) return true;
      return weekend ? g.isWeekendGoal : g.isWeekdayGoal;
    })
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  const currentHHMM = (() => {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  })();

  const nextGoalId = isViewingToday
    ? todayGoals.find((g) => g.endTime > currentHHMM)?.id
    : null;

  function getTimeState(goal: Goal): 'past' | 'next' | 'upcoming' | undefined {
    if (!isViewingToday) return undefined;
    if (goal.endTime <= currentHHMM) return 'past';
    if (goal.id === nextGoalId) return 'next';
    return 'upcoming';
  }

  const entryMap = new Map<string, DayEntry>();
  (entries ?? []).forEach((e) => entryMap.set(e.goalId, e));

  const stats = {
    hit: (entries ?? []).filter((e) => e.status === 'hit').length,
    partial: (entries ?? []).filter((e) => e.status === 'partial').length,
    miss: (entries ?? []).filter((e) => e.status === 'miss').length,
    minutesFocused: (entries ?? []).reduce((acc, e) => acc + e.actualMinutes, 0),
  };

  const handleRun = (goal: Goal) => {
    if (activeTaskId && activeTaskId !== goal.id) {
      return;
    }
    useTimerStore.getState().start({
      taskId: goal.id,
      taskType: 'goal',
      taskTitle: goal.title,
      allocatedMinutes: goal.allocatedMinutes,
    });
    router.push('/(app)/timer');
  };

  const handleLog = (goal: Goal) => {
    router.push({ pathname: '/(app)/goal/[id]', params: { id: goal.id } });
  };

  const handleGoalPress = (goal: Goal) => {
    router.push({ pathname: '/(app)/goal/[id]', params: { id: goal.id } });
  };

  return (
    <SafeAreaView style={styles.safe}>
      <DateNavHeader
        date={viewDate}
        onPrev={goToPrev}
        onNext={goToNext}
        canGoNext={canGoNext}
      />

      <StatsBanner
        hit={stats.hit}
        partial={stats.partial}
        miss={stats.miss}
        minutesFocused={stats.minutesFocused}
      />

      <GestureDetector gesture={swipeGesture}>
        <Animated.View style={styles.flex}>
          <ScrollView
            contentContainerStyle={styles.scroll}
            refreshControl={
              <RefreshControl
                refreshing={isLoading}
                onRefresh={onRefresh}
                tintColor={COLORS.teal600}
              />
            }
          >
            <Text style={styles.sectionLabel}>GOALS TODAY</Text>

            {isLoading && (
              <>
                <SkeletonCard lines={3} />
                <SkeletonCard lines={3} />
              </>
            )}

            {!isLoading && todayGoals.length === 0 && (
              <EmptyState
                title="No goals for today"
                subtitle={isReadOnly ? undefined : 'Add goals on the Goals tab.'}
              />
            )}

            {!isLoading && todayGoals.map((goal) => {
              const entry = entryMap.get(goal.id);
              return (
                <GoalCard
                  key={goal.id}
                  goal={goal}
                  entry={entry}
                  hitRate={buildHitRate(entry)}
                  isReadOnly={isReadOnly}
                  isTimerActive={activeTaskId === goal.id}
                  timeState={getTimeState(goal)}
                  onRun={() => handleRun(goal)}
                  onLog={() => handleLog(goal)}
                  onPress={() => handleGoalPress(goal)}
                />
              );
            })}
          </ScrollView>
        </Animated.View>
      </GestureDetector>
    </SafeAreaView>
  );
}

function buildHitRate(entry: DayEntry | undefined): HitStatus[] {
  if (!entry) return Array(7).fill('none');
  const status: HitStatus = entry.status === 'hit' ? 'hit'
    : entry.status === 'partial' ? 'partial' : 'miss';
  return Array(7).fill('none').map((_, i) => i === 6 ? status : 'none');
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.teal50 },
  flex: { flex: 1 },
  scroll: {
    padding: SPACING.s4,
    paddingBottom: SPACING.s16,
  },
  sectionLabel: {
    ...TYPE.label,
    color: COLORS.teal600,
    marginBottom: SPACING.s3,
    marginTop: SPACING.s2,
  },
});
