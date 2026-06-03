import { Platform } from 'react-native';
import * as TaskManager from 'expo-task-manager';
import * as BackgroundFetch from 'expo-background-fetch';
import * as Notifications from 'expo-notifications';
import {
  readGoalsFromStorage,
  readEntriesFromStorage,
  readActiveTaskIdFromStorage,
} from '@/utils/goalStorage';

export const BACKGROUND_NUDGE_TASK = 'rex-background-nudge';

const NUDGE_CHANNEL_ID = 'task_nudge';
const MAX_NUDGE_SLOTS = 6; // 6 × 3 min = 18 min coverage per reschedule cycle

function parseHHMMToDate(hhMM: string): Date {
  const [h, m] = hhMM.split(':').map(Number);
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d;
}

export async function rescheduleAllNudges(
  goals: any[],
  entries: any[],
  activeTaskId: string | null,
): Promise<void> {
  // Cancel all pending nudge notifications in one pass
  const all = await Notifications.getAllScheduledNotificationsAsync();
  await Promise.all(
    all
      .filter((n) => n.identifier.startsWith('rex-nudge-'))
      .map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier)),
  );

  const now = new Date();

  for (const goal of goals) {
    const hasEntry = entries.some((e: any) => e.goalId === goal.id);
    const isActive = activeTaskId === goal.id;
    if (hasEntry || isActive) continue;

    const endDate = parseHHMMToDate(goal.endTime);
    if (now >= endDate) continue;

    const startDate = parseHHMMToDate(goal.startTime);
    // First slot: at startTime if future, otherwise 1 min from now
    const firstFire = now < startDate
      ? startDate
      : new Date(now.getTime() + 60_000);

    let slot = 0;
    let fireAt = new Date(firstFire);

    while (fireAt < endDate && slot < MAX_NUDGE_SLOTS) {
      await Notifications.scheduleNotificationAsync({
        identifier: `rex-nudge-${goal.id}-${slot}`,
        content: {
          title: '⚠️ Task unattended',
          body: `${goal.title} — tap to log or start`,
          sound: 'default',
          ...(Platform.OS === 'android' && {
            android: {
              channelId: NUDGE_CHANNEL_ID,
              color: '#f59e0b',
              smallIcon: 'ic_launcher',
            },
          }),
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: new Date(fireAt),
        },
      });
      slot++;
      fireAt = new Date(fireAt.getTime() + 3 * 60_000);
    }
  }
}

// Must be defined at module level before registerTaskAsync is called
TaskManager.defineTask(BACKGROUND_NUDGE_TASK, async () => {
  try {
    const [goals, entries, activeTaskId] = await Promise.all([
      readGoalsFromStorage(),
      readEntriesFromStorage(),
      readActiveTaskIdFromStorage(),
    ]);
    await rescheduleAllNudges(goals, entries, activeTaskId);
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
        minimumInterval: 15 * 60, // OS minimum — 15 min
        stopOnTerminate: false,
        startOnBoot: true,
      });
    }
  } catch {
    // Device doesn't support background fetch — silent fail
  }
}
