import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { getGoals } from '@/api/goals';
import { getDayEntriesByDateRange } from '@/api/dayEntries';
import {
  readActiveTaskIdFromStorage,
  readGoalsFromStorage,
  readEntriesFromStorage,
  persistGoalsForBackground,
  persistEntriesForBackground,
} from '@/utils/goalStorage';

export const BACKGROUND_NUDGE_TASK = 'rex-background-nudge';
const NUDGE_CHANNEL_ID = 'task_nudge';

// ─── helpers ────────────────────────────────────────────────────────────────

function todayDateString(): string {
  return new Date().toISOString().split('T')[0];
}

function isWeekend(): boolean {
  const day = new Date().getDay();
  return day === 0 || day === 6;
}

function parseHHMMToDate(hhMM: string): Date {
  const [h, m] = hhMM.split(':').map(Number);
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d;
}

async function scheduleNudgeSlot(goal: any, identifier: string, fireAt: Date): Promise<void> {
  await Notifications.scheduleNotificationAsync({
    identifier,
    content: {
      title: '⚠️ Task unattended',
      body: `${goal.title} — tap to log or start`,
      sound: true,
      ...(Platform.OS === 'android' && {
        android: { channelId: NUDGE_CHANNEL_ID, color: '#f59e0b', smallIcon: 'ic_launcher' },
      }),
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: fireAt,
    },
  });
}

// ─── core scheduling (used by both foreground hook and background task) ───────

export async function rescheduleAllNudges(
  goals: any[],
  entries: any[],
  activeTaskId: string | null,
): Promise<void> {
  const now = new Date();
  const all = await Notifications.getAllScheduledNotificationsAsync();
  const pendingIds = new Set(all.map((n) => n.identifier));

  for (const goal of goals) {
    const hasEntry = entries.some((e: any) => e.goalId === goal.id);
    const isActive = activeTaskId === goal.id;

    if (hasEntry || isActive) {
      const toCancel = all.filter((n) => n.identifier.startsWith(`rex-nudge-${goal.id}-`));
      await Promise.all(toCancel.map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier)));
      continue;
    }

    const endDate = parseHHMMToDate(goal.endTime);
    if (now >= endDate) continue;

    const startDate = parseHHMMToDate(goal.startTime);
    const firstFire  = now < startDate ? startDate : new Date(now.getTime() + 60_000);
    const secondFire = new Date(firstFire.getTime() + 3 * 60_000);

    const slot0 = `rex-nudge-${goal.id}-0`;
    const slot1 = `rex-nudge-${goal.id}-1`;

    if (!pendingIds.has(slot0) && firstFire < endDate)  await scheduleNudgeSlot(goal, slot0, firstFire);
    if (!pendingIds.has(slot1) && secondFire < endDate) await scheduleNudgeSlot(goal, slot1, secondFire);
  }
}

// ─── background task — graceful degradation if native modules unavailable ────

export async function registerBackgroundNudgeTask(): Promise<void> {
  try {
    const TaskManager    = require('expo-task-manager');
    const BackgroundFetch = require('expo-background-fetch');

    // defineTask must be called before registerTaskAsync
    if (!TaskManager.isTaskDefined(BACKGROUND_NUDGE_TASK)) {
      TaskManager.defineTask(BACKGROUND_NUDGE_TASK, async () => {
        try {
          const today   = todayDateString();
          const weekend = isWeekend();
          const activeTaskId = await readActiveTaskIdFromStorage();

          let allGoals: any[], entries: any[];
          try {
            [allGoals, entries] = await Promise.all([
              getGoals({ completed: false }),
              getDayEntriesByDateRange(today, today),
            ]);
            persistGoalsForBackground(allGoals);
            persistEntriesForBackground(entries);
          } catch {
            [allGoals, entries] = await Promise.all([
              readGoalsFromStorage(),
              readEntriesFromStorage(),
            ]);
          }

          const now       = new Date();
          const windowEnd = new Date(now.getTime() + 15 * 60_000);

          const relevantGoals = allGoals
            .filter((g: any) => {
              if (g.completedAt) return false;
              if (!g.isWeekdayGoal && !g.isWeekendGoal) return true;
              return weekend ? g.isWeekendGoal : g.isWeekdayGoal;
            })
            .filter((g: any) => {
              const startDate = parseHHMMToDate(g.startTime);
              const endDate   = parseHHMMToDate(g.endTime);
              return now < endDate && startDate < windowEnd;
            });

          await rescheduleAllNudges(relevantGoals, entries, activeTaskId);
          return BackgroundFetch.BackgroundFetchResult.NewData;
        } catch {
          return BackgroundFetch.BackgroundFetchResult.Failed;
        }
      });
    }

    const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_NUDGE_TASK);
    if (!isRegistered) {
      await BackgroundFetch.registerTaskAsync(BACKGROUND_NUDGE_TASK, {
        minimumInterval: 15 * 60,
        stopOnTerminate: false,
        startOnBoot: true,
      });
    }
  } catch {
    // expo-task-manager / expo-background-fetch not available (e.g. Expo Go)
    // Background nudge rescheduling won't run — foreground hook still works
  }
}
