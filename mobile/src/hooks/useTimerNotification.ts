import { useEffect, useRef } from 'react';
import { Platform, AppState } from 'react-native';
import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { useTimerStore } from '@/stores/timerStore';
import { formatSeconds } from '@/utils/formatTime';
import type { Goal } from '@/types/goal';

const CHANNEL_ID = 'timer_v2';
const TIMER_NOTIF_ID = 'rex-timer';
const SCHEDULE_NOTIF_ID = 'rex-schedule';

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

  // Is there a goal whose window we're currently inside?
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

  // Next upcoming goal sorted by startTime
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

// ─── notification helpers ────────────────────────────────────────────────────

async function setupChannel() {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
    name: 'Timer & Schedule',
    importance: Notifications.AndroidImportance.DEFAULT, // DEFAULT = status bar icon, no sound
    sound: null,           // explicitly no sound
    vibrationPattern: null,
    enableVibrate: false,
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
      priority: Notifications.AndroidNotificationPriority.LOW,
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

export function useTimerNotification(todayGoals: Goal[]) {
  const { startedAt, activeTaskTitle } = useTimerStore();
  const isRunning = !!startedAt;
  const listenerRef = useRef<Notifications.Subscription | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // One-time: channel + permissions + tap handler
  useEffect(() => {
    setupChannel();
    requestPermissions();

    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: false,
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
      if (intervalRef.current) clearInterval(intervalRef.current);
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

  // Schedule notification — always on, updates every 60s
  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (!todayGoals.length) {
      Notifications.dismissNotificationAsync(SCHEDULE_NOTIF_ID);
      return;
    }

    const tick = () => showScheduleNotif(getScheduleStatus(todayGoals));
    tick(); // immediate first render

    intervalRef.current = setInterval(tick, 60_000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [todayGoals]);

  // Clean up schedule notif when app backgrounds with nothing active
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        // Recalculate immediately when foregrounded
        showScheduleNotif(getScheduleStatus(todayGoals));
      }
    });
    return () => sub.remove();
  }, [todayGoals]);
}
