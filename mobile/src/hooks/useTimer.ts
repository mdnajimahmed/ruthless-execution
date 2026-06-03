import { useEffect, useRef, useCallback } from 'react';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import { useTimerStore } from '@/stores/timerStore';

// Sound and 2-min-before alert are handled by useTimerNotification (OS-scheduled notification)
// This hook only manages keep-awake and exposes timer controls to the timer screen

export function useTimer() {
  const {
    activeTaskId,
    activeTaskType,
    activeTaskTitle,
    allocatedMinutes,
    startedAt,
    getElapsedSeconds,
    stop,
  } = useTimerStore();

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!startedAt) return;

    activateKeepAwakeAsync();

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      deactivateKeepAwake();
    };
  }, [startedAt]);

  const stopTimer = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    deactivateKeepAwake();
    return stop();
  }, [stop]);

  return {
    activeTaskId,
    activeTaskType,
    activeTaskTitle,
    allocatedMinutes,
    isRunning: !!startedAt,
    getElapsedSeconds,
    stopTimer,
  };
}
