import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

// expo-task-manager / expo-background-fetch require a custom native build and
// are NOT available in Expo Go. All nudge scheduling is done via expo-notifications
// DateTrigger which fires natively without any JS thread involvement.

const NUDGE_CHANNEL_ID = 'task_nudge';

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

/**
 * Schedule up to 2 OS nudge notifications per unattended goal.
 * Checks pending notifications first — if slots are already scheduled they
 * are left untouched (enforces the 2-per-task cap naturally).
 * For attended goals (entry logged or timer running) any pending slots
 * are cancelled immediately.
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
      const toCancel = all.filter((n) => n.identifier.startsWith(`rex-nudge-${goal.id}-`));
      await Promise.all(toCancel.map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier)));
      continue;
    }

    const endDate = parseHHMMToDate(goal.endTime);
    if (now >= endDate) continue;

    const startDate  = parseHHMMToDate(goal.startTime);
    const firstFire  = now < startDate ? startDate : new Date(now.getTime() + 60_000);
    const secondFire = new Date(firstFire.getTime() + 3 * 60_000);

    const slot0 = `rex-nudge-${goal.id}-0`;
    const slot1 = `rex-nudge-${goal.id}-1`;

    if (!pendingIds.has(slot0) && firstFire < endDate)  await scheduleNudgeSlot(goal, slot0, firstFire);
    if (!pendingIds.has(slot1) && secondFire < endDate) await scheduleNudgeSlot(goal, slot1, secondFire);
  }
}
