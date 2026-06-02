import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Play, ClipboardList } from 'lucide-react-native';
import { COLORS, RADIUS, SHADOWS, SPACING, TYPE } from '@/config/designTokens';
import type { Goal } from '@/types/goal';
import type { DayEntry } from '@/types/dayEntry';
import type { HitStatus } from './HitRateBar';
import { HitRateBar } from './HitRateBar';

export interface GoalCardProps {
  goal: Goal;
  entry?: DayEntry;
  hitRate: HitStatus[];
  isReadOnly?: boolean;
  isTimerActive?: boolean;
  timeState?: 'past' | 'next' | 'upcoming';
  onRun: () => void;
  onLog: () => void;
  onPress: () => void;
}

const STATUS_COLORS: Record<string, string> = {
  hit:     COLORS.teal600,
  partial: COLORS.warningText,
  miss:    COLORS.errorText,
};

const STATUS_BG: Record<string, string> = {
  hit:     COLORS.teal50,
  partial: COLORS.warningBg,
  miss:    COLORS.errorBg,
};

export function GoalCard({
  goal,
  entry,
  hitRate,
  isReadOnly = false,
  isTimerActive = false,
  timeState,
  onRun,
  onLog,
  onPress,
}: GoalCardProps) {
  const isPast = timeState === 'past';
  const isNext = timeState === 'next';

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      style={[styles.card, isPast && styles.cardPast, isNext && styles.cardNext]}
    >
      <View style={styles.topRow}>
        <View style={[styles.timeChip, isNext && styles.timeChipNext]}>
          <Text style={[styles.timeText, isNext && styles.timeTextNext]}>{goal.startTime}–{goal.endTime}</Text>
        </View>
        <View style={styles.topRowRight}>
          {isNext && (
            <View style={styles.nextBadge}>
              <Text style={styles.nextBadgeText}>UP NEXT</Text>
            </View>
          )}
          {entry && (
            <View style={[styles.statusChip, { backgroundColor: STATUS_BG[entry.status] }]}>
              <Text style={[styles.statusLabel, { color: STATUS_COLORS[entry.status] }]}>
                {entry.status.toUpperCase()}
              </Text>
            </View>
          )}
        </View>
      </View>

      <Text style={styles.title} numberOfLines={2}>{goal.title}</Text>

      {!!goal.description && (
        <Text style={styles.description} numberOfLines={2}>{goal.description}</Text>
      )}

      <View style={styles.meta}>
        <Text style={styles.metaText}>{goal.allocatedMinutes} min allocated</Text>
        {entry && entry.actualMinutes > 0 && (
          <Text style={styles.metaText}> · {entry.actualMinutes} min logged</Text>
        )}
      </View>

      <View style={styles.bottomRow}>
        <HitRateBar entries={hitRate} />
        {!isReadOnly && (
          <View style={styles.actions}>
            <TouchableOpacity
              onPress={onLog}
              style={styles.logBtn}
              accessibilityLabel="Log day entry"
            >
              <ClipboardList size={14} color={COLORS.teal700} />
              <Text style={styles.logLabel}>Log</Text>
            </TouchableOpacity>
            {!isPast && (
              <TouchableOpacity
                onPress={onRun}
                style={[styles.runBtn, isTimerActive && styles.runBtnActive]}
                accessibilityLabel="Start timer"
              >
                <Play
                  size={12}
                  color={COLORS.neutral0}
                  fill={COLORS.neutral0}
                />
                <Text style={styles.runLabel}>{isTimerActive ? 'Running' : 'Run'}</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
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
    borderLeftColor: COLORS.teal500,
    padding: SPACING.s5,
    marginBottom: SPACING.s3,
    ...SHADOWS.sm,
  },
  cardPast: {
    opacity: 0.4,
  },
  cardNext: {
    backgroundColor: COLORS.teal50,
    borderWidth: 1.5,
    borderColor: '#f59e0b',
    borderLeftWidth: 4,
    borderLeftColor: '#d97706',
    shadowColor: '#f59e0b',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.28,
    shadowRadius: 20,
    elevation: 10,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.s2,
  },
  topRowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.s2,
  },
  timeChip: {
    backgroundColor: COLORS.teal100,
    paddingVertical: 3,
    paddingHorizontal: SPACING.s2,
    borderRadius: RADIUS.pill,
  },
  timeChipNext: {
    backgroundColor: COLORS.teal200,
  },
  timeText: {
    ...TYPE.caption,
    color: COLORS.teal700,
    fontWeight: '600',
  },
  timeTextNext: {
    color: COLORS.teal800,
  },
  nextBadge: {
    backgroundColor: COLORS.teal600,
    paddingVertical: 2,
    paddingHorizontal: SPACING.s2,
    borderRadius: RADIUS.pill,
  },
  nextBadgeText: {
    fontSize: 9,
    fontWeight: '700' as const,
    letterSpacing: 1,
    color: COLORS.neutral0,
  },
  statusChip: {
    paddingVertical: 3,
    paddingHorizontal: SPACING.s2,
    borderRadius: RADIUS.pill,
  },
  statusLabel: {
    ...TYPE.label,
    fontSize: 10,
  },
  title: {
    ...TYPE.h3,
    color: COLORS.teal900,
    marginBottom: SPACING.s1,
    fontSize: 15,
  },
  description: {
    ...TYPE.caption,
    color: COLORS.neutral400,
    marginBottom: SPACING.s2,
    lineHeight: 17,
  },
  meta: {
    flexDirection: 'row',
    marginBottom: SPACING.s3,
  },
  metaText: {
    ...TYPE.caption,
    color: COLORS.neutral400,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  actions: {
    flexDirection: 'row',
    gap: SPACING.s2,
  },
  logBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: RADIUS.button,
    borderWidth: 1,
    borderColor: COLORS.teal500,
  },
  logLabel: {
    ...TYPE.label,
    color: COLORS.teal700,
  },
  runBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: RADIUS.button,
    backgroundColor: COLORS.teal700,
  },
  runBtnActive: {
    backgroundColor: COLORS.teal800,
  },
  runLabel: {
    ...TYPE.label,
    color: COLORS.neutral0,
  },
});
