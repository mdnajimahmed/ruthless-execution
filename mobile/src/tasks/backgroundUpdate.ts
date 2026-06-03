import { Platform } from 'react-native';
import * as TaskManager from 'expo-task-manager';
import * as BackgroundFetch from 'expo-background-fetch';
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
      sound: 'default',
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

// ─── core scheduling ─────────────────────────────────────────────────────────

/**
 * Each unattended goal gets exactly 2 nudge slots: rex-nudge-{goalId}-0 and -1.
 * We check pending notifications first — if a slot is already pending we don't
 * reschedule it. This enforces the 2-per-task cap naturally: once both fire,
 * there are no more identifiers to schedule.
 *
 * For attended goals we cancel any remaining pending slots immediately.
 */
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
      // Goal is attended — cancel any pending nudge slots
      const toCancel = all.filter((n) => n.identifier.startsWith(`rex-nudge-${goal.id}-`));
      await Promise.all(toCancel.map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier)));
      continue;
    }

    const endDate = parseHHMMToDate(goal.endTime);
    if (now >= endDate) continue; // window has passed

    const startDate = parseHHMMToDate(goal.startTime);
    // First nudge: at startTime if future, otherwise 1 min from now
    const firstFire = now < startDate ? startDate : new Date(now.getTime() + 60_000);
    const secondFire = new Date(firstFire.getTime() + 3 * 60_000);

    const slot0 = `rex-nudge-${goal.id}-0`;
    const slot1 = `rex-nudge-${goal.id}-1`;

    // Only schedule slots that aren't already pending — this enforces the 2-cap
    if (!pendingIds.has(slot0) && firstFire < endDate) {
      await scheduleNudgeSlot(goal, slot0, firstFire);
    }
    if (!pendingIds.has(slot1) && secondFire < endDate) {
      await scheduleNudgeSlot(goal, slot1, secondFire);
    }
  }
}

// ─── background task ─────────────────────────────────────────────────────────

// defineTask MUST be called at module level
TaskManager.defineTask(BACKGROUND_NUDGE_TASK, async () => {
  try {
    const today = todayDateString();
    const weekend = isWeekend();
    const activeTaskId = await readActiveTaskIdFromStorage();

    let allGoals: any[];
    let entries: any[];

    try {
      // Fresh data from API — most reliable
      [allGoals, entries] = await Promise.all([
        getGoals({ completed: false }),
        getDayEntriesByDateRange(today, today),
      ]);
      // Keep cache fresh for next time network is unavailable
      persistGoalsForBackground(allGoals);
      persistEntriesForBackground(entries);
    } catch {
      // Network unavailable — fall back to last cached data
      [allGoals, entries] = await Promise.all([
        readGoalsFromStorage(),
        readEntriesFromStorage(),
      ]);
    }

    // Filter to today's goals that are in or starting within the next 15 min
    const now = new Date();
    const windowEnd = new Date(now.getTime() + 15 * 60_000);

    const relevantGoals = allGoals.filter((g) => {
      if (g.completedAt) return false;
      if (!g.isWeekdayGoal && !g.isWeekendGoal) return true; // every-day goal
      return weekend ? g.isWeekendGoal : g.isWeekdayGoal;
    }).filter((g) => {
      const startDate = parseHHMMToDate(g.startTime);
      const endDate   = parseHHMMToDate(g.endTime);
      // In window now, or starting within the next 15 min
      return now < endDate && startDate < windowEnd;
    });

    await rescheduleAllNudges(relevantGoals, entries, activeTaskId);
    return BackgroundFetch.BackgroundFetchResult.NewData;
  } catch {
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

export async function registerBackgroundNudgeTask(): Promise<void> {
  try {
    const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_NUDGE_TASK);
    if (!isRegistered) {
      await BackgroundFetch.registerTaskAsync(BACKGROUND_NUDGE_TASK, {
        minimumInterval: 15 * 60, // OS minimum
        stopOnTerminate: false,
        startOnBoot: true,
      });
    }
  } catch {
    // Background fetch not supported on this device
  }
}
