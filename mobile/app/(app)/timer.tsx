import { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, SafeAreaView } from 'react-native';
import { router } from 'expo-router';
import { X } from 'lucide-react-native';
import { COLORS, SPACING, TYPE, SHADOWS } from '@/config/designTokens';
import { useTimerStore } from '@/stores/timerStore';
import { formatSeconds } from '@/utils/formatTime';
import { useTimer } from '@/hooks/useTimer';

export default function TimerScreen() {
  const {
    activeTaskId,
    activeTaskType,
    activeTaskTitle,
    allocatedMinutes,
    isRunning,
    getElapsedSeconds,
    stopTimer,
  } = useTimer();

  const [elapsed, setElapsed] = useState(getElapsedSeconds());
  // Prevents the isRunning effect from double-navigating when a handler already did it
  const handledNavRef = useRef(false);

  useEffect(() => {
    const id = setInterval(() => setElapsed(getElapsedSeconds()), 1000);
    return () => clearInterval(id);
  }, []);

  // Fallback: navigate away if timer was stopped externally (e.g. notification tap)
  useEffect(() => {
    if (!isRunning && !handledNavRef.current) {
      if (router.canGoBack()) router.back();
      else router.replace('/(app)/today');
    }
  }, [isRunning]);

  const progress = allocatedMinutes
    ? Math.min(elapsed / (allocatedMinutes * 60), 1)
    : 0;

  const handleStop = useCallback(() => {
    handledNavRef.current = true;
    const { elapsedMinutes } = stopTimer();
    if (activeTaskType === 'goal' && activeTaskId) {
      router.replace({
        pathname: '/(app)/goal/[id]',
        params: { id: activeTaskId, elapsedMinutes: String(elapsedMinutes) },
      });
    } else {
      if (router.canGoBack()) router.back();
      else router.replace('/(app)/today');
    }
  }, [activeTaskId, activeTaskType, stopTimer]);

  const handleDiscard = useCallback(() => {
    Alert.alert(
      'Discard Timer?',
      'Timer will be stopped without saving. Are you sure?',
      [
        { text: 'Keep Running', style: 'cancel' },
        {
          text: 'Discard',
          style: 'destructive',
          onPress: () => {
            handledNavRef.current = true;
            useTimerStore.getState().stop();
            if (router.canGoBack()) router.back();
            else router.replace('/(app)/today');
          },
        },
      ],
    );
  }, []);

  const handleMinimize = useCallback(() => {
    if (router.canGoBack()) router.back();
    else router.replace('/(app)/today');
  }, []);

  if (!isRunning) return null;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topBar}>
        <TouchableOpacity
          onPress={handleMinimize}
          style={styles.closeBtn}
          accessibilityLabel="Minimize timer"
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <X size={22} color={COLORS.teal600} />
        </TouchableOpacity>
      </View>

      <View style={styles.body}>
        <Text style={styles.taskType}>
          {activeTaskType === 'goal' ? 'GOAL' : 'FOCUS SESSION'}
        </Text>

        <Text style={styles.taskTitle} numberOfLines={3}>
          {activeTaskTitle}
        </Text>

        <Text style={styles.clock}>{formatSeconds(elapsed)}</Text>

        {allocatedMinutes !== null && (
          <View style={styles.progressSection}>
            <Text style={styles.progressLabel}>
              {Math.round(elapsed / 60)} / {allocatedMinutes} min
            </Text>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
            </View>
          </View>
        )}
      </View>

      <View style={styles.footer}>
        {activeTaskType === 'goal' ? (
          <TouchableOpacity
            onPress={handleStop}
            style={styles.stopBtn}
            activeOpacity={0.85}
            accessibilityLabel="Stop and save timer"
          >
            <Text style={styles.stopLabel}>■  STOP &amp; SAVE</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            onPress={handleStop}
            style={styles.stopBtn}
            activeOpacity={0.85}
            accessibilityLabel="Stop timer"
          >
            <Text style={styles.stopLabel}>■  STOP</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          onPress={handleDiscard}
          style={styles.discardBtn}
          activeOpacity={0.85}
        >
          <Text style={styles.discardLabel}>Discard</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.neutral0,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: SPACING.s4,
  },
  closeBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    backgroundColor: COLORS.teal50,
  },
  body: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.s8,
  },
  taskType: {
    ...TYPE.label,
    color: COLORS.teal600,
    marginBottom: SPACING.s4,
  },
  taskTitle: {
    ...TYPE.h1,
    color: COLORS.teal900,
    textAlign: 'center',
    marginBottom: SPACING.s10,
    lineHeight: 40,
  },
  clock: {
    fontSize: 64,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
    color: COLORS.teal700,
    letterSpacing: 2,
    marginBottom: SPACING.s8,
  },
  progressSection: {
    width: '100%',
    alignItems: 'center',
    gap: SPACING.s2,
  },
  progressLabel: {
    ...TYPE.small,
    color: COLORS.neutral400,
  },
  progressTrack: {
    width: '100%',
    height: 8,
    backgroundColor: COLORS.teal100,
    borderRadius: 9999,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.teal600,
    borderRadius: 9999,
  },
  footer: {
    paddingHorizontal: SPACING.s6,
    paddingBottom: SPACING.s10,
    gap: SPACING.s3,
  },
  stopBtn: {
    backgroundColor: COLORS.teal700,
    borderRadius: 10,
    paddingVertical: SPACING.s4,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.sm,
  },
  stopLabel: {
    ...TYPE.button,
    color: COLORS.neutral0,
    fontSize: 16,
    letterSpacing: 1,
  },
  discardBtn: {
    paddingVertical: SPACING.s3,
    alignItems: 'center',
  },
  discardLabel: {
    ...TYPE.small,
    color: COLORS.neutral400,
  },
});
