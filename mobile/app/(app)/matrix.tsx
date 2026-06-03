import { useState, useCallback } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, RefreshControl,
} from 'react-native';
import { router } from 'expo-router';
import { Plus } from 'lucide-react-native';
import { COLORS, SPACING, TYPE, SHADOWS, QUADRANT_COLORS } from '@/config/designTokens';
import { TaskCard } from '@/components/TaskCard';
import { SkeletonCard } from '@/components/SkeletonCard';
import { EmptyState } from '@/components/EmptyState';
import {
  useEisenhowerTasks,
  useCompleteEisenhowerTask,
  useUncompleteEisenhowerTask,
} from '@/hooks/useEisenhower';
import { useTimerStore } from '@/stores/timerStore';
import type { Quadrant } from '@/types/eisenhower';
import type { EisenhowerTask } from '@/types/eisenhower';

const QUADRANTS: Quadrant[] = ['do-first', 'schedule', 'delegate', 'eliminate'];

export default function MatrixScreen() {
  const [activeQuadrant, setActiveQuadrant] = useState<Quadrant>('do-first');
  const [showCompleted, setShowCompleted] = useState(false);

  const { data: tasks, isLoading, refetch } = useEisenhowerTasks(activeQuadrant);
  const { mutate: complete } = useCompleteEisenhowerTask();
  const { mutate: uncomplete } = useUncompleteEisenhowerTask();
  const { activeTaskId, start } = useTimerStore();

  const activeTasks = (tasks ?? []).filter((t) => !t.completedAt);
  const completedTasks = (tasks ?? []).filter((t) => !!t.completedAt);

  const handleFocus = (task: EisenhowerTask) => {
    start({
      taskId: task.id,
      taskType: 'eisenhower',
      taskTitle: task.title,
      allocatedMinutes: null,
    });
    router.push('/(app)/timer');
  };

  const handleComplete = (task: EisenhowerTask) => {
    if (task.completedAt) {
      uncomplete(task.id);
    } else {
      complete(task.id);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>MATRIX</Text>
        <TouchableOpacity
          onPress={() => router.push({
            pathname: '/(app)/task/[id]',
            params: { id: 'new', quadrant: activeQuadrant },
          })}
          style={styles.addBtn}
          accessibilityLabel="Add task"
        >
          <Plus size={20} color={COLORS.neutral0} />
        </TouchableOpacity>
      </View>

      <View style={styles.tabs}>
        {QUADRANTS.map((q) => {
          const isActive = q === activeQuadrant;
          const color = QUADRANT_COLORS[q];
          return (
            <TouchableOpacity
              key={q}
              onPress={() => setActiveQuadrant(q)}
              style={[styles.tab, isActive && { borderBottomColor: color.border, borderBottomWidth: 2 }]}
              accessibilityLabel={`${color.label} quadrant`}
            >
              <Text style={[styles.tabLabel, { color: isActive ? color.badgeText : COLORS.neutral400 }]}>
                {color.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={COLORS.teal600} />
        }
      >
        {isLoading && (
          <>
            <SkeletonCard />
            <SkeletonCard />
          </>
        )}

        {!isLoading && activeTasks.length === 0 && (
          <EmptyState
            title="No tasks here"
            subtitle="Add a task to this quadrant."
          />
        )}

        {!isLoading && activeTasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            isTimerActive={activeTaskId === task.id}
            onFocus={() => handleFocus(task)}
            onComplete={() => handleComplete(task)}
            onPress={() => router.push({
              pathname: '/(app)/task/[id]',
              params: { id: task.id },
            })}
          />
        ))}

        {!isLoading && completedTasks.length > 0 && (
          <>
            <TouchableOpacity
              onPress={() => setShowCompleted((v) => !v)}
              style={styles.completedToggle}
            >
              <Text style={styles.completedToggleText}>
                ✓ Completed ({completedTasks.length})  {showCompleted ? '▲' : '▼'}
              </Text>
            </TouchableOpacity>

            {showCompleted && completedTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                isReadOnly={false}
                onFocus={() => {}}
                onComplete={() => handleComplete(task)}
                onPress={() => router.push({
                  pathname: '/(app)/task/[id]',
                  params: { id: task.id },
                })}
              />
            ))}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
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
  tabs: {
    flexDirection: 'row',
    backgroundColor: COLORS.neutral0,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.teal100,
  },
  tab: {
    flex: 1,
    paddingVertical: SPACING.s3,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabLabel: {
    ...TYPE.label,
    fontSize: 9,
  },
  scroll: {
    padding: SPACING.s4,
    paddingBottom: SPACING.s16,
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
