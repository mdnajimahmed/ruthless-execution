import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type TimerTaskType = 'goal' | 'eisenhower';

interface TimerStartParams {
  taskId: string;
  taskType: TimerTaskType;
  taskTitle: string;
  allocatedMinutes: number | null;
}

interface TimerState {
  activeTaskId: string | null;
  activeTaskType: TimerTaskType | null;
  activeTaskTitle: string;
  allocatedMinutes: number | null;
  startedAt: number | null;
  hasBeepedAtFive: boolean;
  hasBeepedAtEnd: boolean;

  start: (params: TimerStartParams) => void;
  stop: () => { elapsedMinutes: number };
  getElapsedSeconds: () => number;
  isRunning: () => boolean;
}

export const useTimerStore = create<TimerState>()(
  persist(
    (set, get) => ({
      activeTaskId: null,
      activeTaskType: null,
      activeTaskTitle: '',
      allocatedMinutes: null,
      startedAt: null,
      hasBeepedAtFive: false,
      hasBeepedAtEnd: false,

      start: ({ taskId, taskType, taskTitle, allocatedMinutes }) => {
        set({
          activeTaskId: taskId,
          activeTaskType: taskType,
          activeTaskTitle: taskTitle,
          allocatedMinutes,
          startedAt: Date.now(),
          hasBeepedAtFive: false,
          hasBeepedAtEnd: false,
        });
      },

      stop: () => {
        const { startedAt } = get();
        const elapsed = startedAt ? Math.floor((Date.now() - startedAt) / 1000) : 0;
        const elapsedMinutes = Math.round(elapsed / 60);
        set({
          activeTaskId: null,
          activeTaskType: null,
          activeTaskTitle: '',
          allocatedMinutes: null,
          startedAt: null,
          hasBeepedAtFive: false,
          hasBeepedAtEnd: false,
        });
        return { elapsedMinutes };
      },

      getElapsedSeconds: () => {
        const { startedAt } = get();
        if (!startedAt) return 0;
        return Math.floor((Date.now() - startedAt) / 1000);
      },

      isRunning: () => get().startedAt !== null,
    }),
    {
      name: 'rex-timer',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
