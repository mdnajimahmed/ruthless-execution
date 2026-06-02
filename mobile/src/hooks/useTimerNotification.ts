import { useEffect, useRef } from 'react';
import { Platform, AppState, Vibration } from 'react-native';
import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { useTimerStore } from '@/stores/timerStore';
import { formatSeconds } from '@/utils/formatTime';
import type { Goal } from '@/types/goal';
import type { DayEntry } from '@/types/dayEntry';

const CHANNEL_ID = 'timer_v2';
const TIMER_NOTIF_ID = 'rex-timer';
const SCHEDULE_NOTIF_ID = 'rex-schedule';

// 30 seconds of pulsed vibration: 400ms on, 200ms off × 50 = 30 000ms
const NUDGE_PATTERN: number[] = [0];
for (let i = 0; i < 50; i++) NUDGE_PATTERN.push(400, 200);

const NUDGE_INTERVAL_MS = 3 * 60 * 1000; // 3 min between bursts
const NUDGE_TICK_MS = 30_000;            // re-evaluate every 30s

// ─── helpers ────────────────────────────────────────────────────────────────

function parseTimeToMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

function nowInMinutes(): number {
  const d = new Date();
  return d.getHours() * 60 + d.getMinutes();
}

type ScheduleStatus =
  | { kind: 'current'; goal: Goal; minutesLeft: number }
  | { kind: 'upcoming'; goal: Goal; minutesUntil: number }
  | { kind: 'done' };

function getScheduleStatus(goals: Goal[]): ScheduleStatus {
  const now = nowInMinutes();

  const current = goals.find((g) => {
    const start = parseTimeToMinutes(g.startTime);
    const end = parseTimeToMinutes(g.endTime);
    return now >= start && now < end;
  });
  if (current) {
    return {
      kind: 'current',
      goal: current,
      minutesLeft: parseTimeToMinutes(current.endTime) - now,
    };
  }

  const upcoming = goals
    .filter((g) => parseTimeToMinutes(g.startTime) > now)
    .sort((a, b) => parseTimeToMinutes(a.startTime) - parseTimeToMinutes(b.startTime))[0];

  if (upcoming) {
    return {
      kind: 'upcoming',
      goal: upcoming,
      minutesUntil: parseTimeToMinutes(upcoming.startTime) - now,
    };
  }

  return { kind: 'done' };
}

function getUnattendedInWindowGoals(
  goals: Goal[],
  entries: DayEntry[],
  activeTaskId: string | null,
): Goal[] {
  const now = nowInMinutes();
  return goals.filter((g) => {
    const start = parseTimeToMinutes(g.startTime);
    const end = parseTimeToMinutes(g.endTime);
    if (now < start || now >= end) return false;
    if (activeTaskId === g.id) return false;           // timer running for this goal
    const entry = entries.find((e) => e.goalId === g.id);
    return !entry;                                     // no log at all = unattended
  });
}

// ─── notification helpers ────────────────────────────────────────────────────

async function setupChannel() {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
    name: 'Timer & Schedule',
    importance: Notifications.AndroidImportance.HIGH,
    sound: null,
    vibrationPattern: [0, 250, 150, 250],
    enableVibrate: true,
    showBadge: false,
  });
}

async function requestPermissions() {
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

async function showTimerNotif(title: string, startedAt: number) {
  await Notifications.scheduleNotificationAsync({
    identifier: TIMER_NOTIF_ID,
    content: {
      title: '⏱ ' + title,
      body: formatSeconds(Math.floor((Date.now() - startedAt) / 1000)),
      sticky: true,
      priority: Notifications.AndroidNotificationPriority.LOW,
      ...(Platform.OS === 'android' && {
        android: {
          channelId: CHANNEL_ID,
          ongoing: true,
          usesChronometer: true,
          when: startedAt,
          showWhen: true,
          color: '#0f766e',
          smallIcon: 'ic_launcher',
        },
      }),
    },
    trigger: null,
  });
}

async function showScheduleNotif(status: ScheduleStatus) {
  if (status.kind === 'done') {
    await Notifications.dismissNotificationAsync(SCHEDULE_NOTIF_ID);
    return;
  }

  const { goal } = status;
  const title =
    status.kind === 'current'
      ? `🟢 ${goal.title}`
      : `⏰ ${goal.title}`;
  const body =
    status.kind === 'current'
      ? `${status.minutesLeft}m left  ·  ${goal.startTime}–${goal.endTime}`
      : `Starts in ${status.minutesUntil}m  ·  ${goal.startTime}`;

  await Notifications.scheduleNotificationAsync({
    identifier: SCHEDULE_NOTIF_ID,
    content: {
      title,
      body,
      sticky: false,
      priority: Notifications.AndroidNotificationPriority.DEFAULT,
      ...(Platform.OS === 'android' && {
        android: {
          channelId: CHANNEL_ID,
          ongoing: false,
          color: '#0f766e',
          smallIcon: 'ic_launcher',
        },
      }),
    },
    trigger: null,
  });
}

// ─── public hook ─────────────────────────────────────────────────────────────

export function useTimerNotification(todayGoals: Goal[], todayEntries: DayEntry[]) {
  const { startedAt, activeTaskTitle, activeTaskId } = useTimerStore();
  const isRunning = !!startedAt;
  const listenerRef = useRef<Notifications.Subscription | null>(null);
  const scheduleIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const nudgeIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastVibratedAtRef = useRef<number | null>(null);

  // One-time: channel + permissions + tap handler
  useEffect(() => {
    setupChannel();
    requestPermissions();

    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: false,
        shouldSetBadge: false,
      }),
    });

    listenerRef.current = Notifications.addNotificationResponseReceivedListener((res) => {
      const id = res.notification.request.identifier;
      if (id === TIMER_NOTIF_ID || id === SCHEDULE_NOTIF_ID) {
        router.push('/(app)/timer');
      }
    });

    return () => {
      listenerRef.current?.remove();
      if (scheduleIntervalRef.current) clearInterval(scheduleIntervalRef.current);
      if (nudgeIntervalRef.current) clearInterval(nudgeIntervalRef.current);
      Vibration.cancel();
    };
  }, []);

  // Timer notification — only when manually running
  useEffect(() => {
    if (isRunning && startedAt) {
      showTimerNotif(activeTaskTitle, startedAt);
    } else {
      Notifications.dismissNotificationAsync(TIMER_NOTIF_ID);
    }
  }, [isRunning, startedAt, activeTaskTitle]);

  // Schedule notification — updates every 60s
  useEffect(() => {
    if (scheduleIntervalRef.current) clearInterval(scheduleIntervalRef.current);
    if (!todayGoals.length) {
      Notifications.dismissNotificationAsync(SCHEDULE_NOTIF_ID);
      return;
    }

    const tick = () => showScheduleNotif(getScheduleStatus(todayGoals));
    tick();
    scheduleIntervalRef.current = setInterval(tick, 60_000);
    return () => {
      if (scheduleIntervalRef.current) clearInterval(scheduleIntervalRef.current);
    };
  }, [todayGoals]);

  // Nudge vibration — every 30s check; vibrate 30s every 3min for unattended in-window goals
  useEffect(() => {
    if (nudgeIntervalRef.current) clearInterval(nudgeIntervalRef.current);

    const checkAndNudge = () => {
      const unattended = getUnattendedInWindowGoals(todayGoals, todayEntries, activeTaskId);

      if (unattended.length === 0) {
        // All goals attended or outside window — silence and reset cycle
        Vibration.cancel();
        lastVibratedAtRef.current = null;
        return;
      }

      const now = Date.now();
      const last = lastVibratedAtRef.current;

      if (last === null || now - last >= NUDGE_INTERVAL_MS) {
        lastVibratedAtRef.current = now;
        Vibration.vibrate(NUDGE_PATTERN, false);
      }
    };

    checkAndNudge();
    nudgeIntervalRef.current = setInterval(checkAndNudge, NUDGE_TICK_MS);

    return () => {
      if (nudgeIntervalRef.current) clearInterval(nudgeIntervalRef.current);
      Vibration.cancel();
    };
  }, [todayGoals, todayEntries, activeTaskId]);

  // Re-evaluate immediately when app comes back to foreground
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        showScheduleNotif(getScheduleStatus(todayGoals));
      }
    });
    return () => sub.remove();
  }, [todayGoals]);
}
