import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Play, CheckCircle, Circle } from 'lucide-react-native';
import { COLORS, RADIUS, SHADOWS, SPACING, TYPE, QUADRANT_COLORS } from '@/config/designTokens';
import type { EisenhowerTask } from '@/types/eisenhower';
import { QuadrantBadge } from './QuadrantBadge';

export interface TaskCardProps {
  task: EisenhowerTask;
  isReadOnly?: boolean;
  isTimerActive?: boolean;
  onFocus: () => void;
  onComplete: () => void;
  onPress: () => void;
}

export function TaskCard({
  task,
  isReadOnly = false,
  isTimerActive = false,
  onFocus,
  onComplete,
  onPress,
}: TaskCardProps) {
  const isCompleted = !!task.completedAt;
  const borderColor = QUADRANT_COLORS[task.quadrant].border;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      style={[styles.card, { borderLeftColor: borderColor }, isCompleted && styles.cardDone]}
    >
      <View style={styles.topRow}>
        <Text
          style={[styles.title, isCompleted && styles.titleDone]}
          numberOfLines={2}
        >
          {task.title}
        </Text>
        <TouchableOpacity
          onPress={onComplete}
          disabled={isReadOnly}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityLabel={isCompleted ? 'Mark incomplete' : 'Mark complete'}
        >
          {isCompleted
            ? <CheckCircle size={22} color={COLORS.teal600} />
            : <Circle size={22} color={COLORS.neutral400} />
          }
        </TouchableOpacity>
      </View>

      {!isCompleted && !isReadOnly && (
        <View style={styles.bottomRow}>
          <QuadrantBadge quadrant={task.quadrant} size="sm" />
          <TouchableOpacity
            onPress={onFocus}
            style={[styles.focusBtn, isTimerActive && styles.focusBtnActive]}
            accessibilityLabel="Start focus timer"
          >
            <Play size={12} color={isTimerActive ? COLORS.neutral0 : COLORS.teal700} fill={isTimerActive ? COLORS.neutral0 : COLORS.teal700} />
            <Text style={[styles.focusLabel, isTimerActive && styles.focusLabelActive]}>
              {isTimerActive ? 'Focusing' : 'Focus'}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {isCompleted && (
        <View style={styles.bottomRow}>
          <QuadrantBadge quadrant={task.quadrant} size="sm" />
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.neutral0,
    borderRadius: RADIUS.card,
    borderWidth: 1,
    borderColor: COLORS.teal100,
    borderLeftWidth: 4,
    padding: SPACING.s5,
    marginBottom: SPACING.s3,
    ...SHADOWS.sm,
  },
  cardDone: {
    opacity: 0.6,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: SPACING.s3,
    marginBottom: SPACING.s3,
  },
  title: {
    ...TYPE.body,
    color: COLORS.teal900,
    flex: 1,
    fontSize: 15,
  },
  titleDone: {
    color: COLORS.neutral400,
    textDecorationLine: 'line-through',
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  focusBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: RADIUS.button,
    borderWidth: 1,
    borderColor: COLORS.teal500,
    backgroundColor: 'transparent',
  },
  focusBtnActive: {
    backgroundColor: COLORS.teal700,
    borderColor: COLORS.teal700,
  },
  focusLabel: {
    ...TYPE.label,
    color: COLORS.teal700,
  },
  focusLabelActive: {
    color: COLORS.neutral0,
  },
});
