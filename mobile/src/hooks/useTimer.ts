import { useEffect, useRef, useCallback } from 'react';
import { useAudioPlayer } from 'expo-audio';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import { useTimerStore } from '@/stores/timerStore';

const ALERT_SOUND = require('../../assets/sounds/alert.mp3');

// Alert fires 2 minutes before allocated time runs out
const ALERT_BEFORE_SECONDS = 2 * 60;

export function useTimer() {
  const {
    activeTaskId,
    activeTaskType,
    activeTaskTitle,
    allocatedMinutes,
    startedAt,
    hasBeepedAtFive,
    hasBeepedAtEnd,
    getElapsedSeconds,
    stop,
  } = useTimerStore();

  const player = useAudioPlayer(ALERT_SOUND);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const playAlert = useCallback(async () => {
    player.seekTo(0);
    player.play();
  }, [player]);

  useEffect(() => {
    if (!startedAt) return;

    activateKeepAwakeAsync();

    intervalRef.current = setInterval(() => {
      if (!allocatedMinutes) return;

      const elapsed = getElapsedSeconds();
      const twoMinThreshold = (allocatedMinutes * 60) - ALERT_BEFORE_SECONDS;

      // Read from store directly — closure over hasBeepedAtFive is stale across ticks
      if (!useTimerStore.getState().hasBeepedAtFive && elapsed >= twoMinThreshold && twoMinThreshold > 0) {
        useTimerStore.setState({ hasBeepedAtFive: true });
        playAlert();
      }

      // End-of-time alert — disabled for now, keep for later
      // const endThreshold = allocatedMinutes * 60;
      // if (!hasBeepedAtEnd && elapsed >= endThreshold) {
      //   useTimerStore.setState({ hasBeepedAtEnd: true });
      //   playAlert();
      // }
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      deactivateKeepAwake();
    };
  }, [startedAt, allocatedMinutes]);

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
