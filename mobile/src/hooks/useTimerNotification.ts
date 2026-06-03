import { useEffect, useRef } from 'react';
import { Platform, AppState, Vibration } from 'react-native';
import * as Notifications from 'expo-notifications';
import { useAudioPlayer } from 'expo-audio';
import { router } from 'expo-router';
import { useTimerStore } from '@/stores/timerStore';
import { formatSeconds } from '@/utils/formatTime';
import type { Goal } from '@/types/goal';
import type { DayEntry } from '@/types/dayEntry';

const TIMER_CHANNEL_ID = 'timer_v2';
const NUDGE_CHANNEL_ID = 'task_nudge';
const TIMER_NOTIF_ID   = 'rex-timer';
const SCHEDULE_NOTIF_ID = 'rex-schedule';
const NUDGE_NOTIF_ID   = 'rex-nudge';

const ALERT_SOUND = require('../../assets/sounds/alert.mp3');

// 30 seconds of pulsed vibration: 400ms on / 200ms off × 50 = 30 000ms
const NUDGE_VIBRATION: number[] = [0];
for (let i = 0; i < 50; i++) NUDGE_VIBRATION.push(400, 200);

const NUDGE_INTERVAL_MS = 3 * 60 * 1000;
const NUDGE_TICK_MS     = 30_000;

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
    const end   = parseTimeToMinutes(g.endTime);
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
    const end   = parseTimeToMinutes(g.endTime);
    if (now < start || now >= end) return false;
    if (activeTaskId === g.id) return false;
    return !entries.find((e) => e.goalId === g.id);
  });
}

// ─── channel setup ───────────────────────────────────────────────────────────

async function setupChannels() {
  if (Platform.OS !== 'android') return;

  // Silent ongoing channel for timer progress bar
  await Notifications.setNotificationChannelAsync(TIMER_CHANNEL_ID, {
    name: 'Timer & Schedule',
    importance: Notifications.AndroidImportance.LOW,
    sound: null,
    vibrationPattern: null,
    enableVibrate: false,
    showBadge: false,
  });

  // Alerting channel for unattended task nudges
  await Notifications.setNotificationChannelAsync(NUDGE_CHANNEL_ID, {
    name: 'Task Reminders',
    importance: Notifications.AndroidImportance.HIGH,
    sound: 'default',
    vibrationPattern: [0, 400, 200, 400],
    enableVibrate: true,
    showBadge: false,
  });
}

async function requestPermissions() {
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

// ─── notification senders ────────────────────────────────────────────────────

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
          channelId: TIMER_CHANNEL_ID,
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
  const title = status.kind === 'current' ? `🟢 ${goal.title}` : `⏰ ${goal.title}`;
  const body  = status.kind === 'current'
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
        android: { channelId: TIMER_CHANNEL_ID, ongoing: false, color: '#0f766e', smallIcon: 'ic_launcher' },
      }),
    },
    trigger: null,
  });
}

async function showNudgeNotif(goals: Goal[]) {
  const names = goals.map((g) => g.title).join(', ');
  await Notifications.scheduleNotificationAsync({
    identifier: NUDGE_NOTIF_ID,
    content: {
      title: '⚠️ Unattended task',
      body: `${names} — tap Log or Run`,
      sound: 'default',
      priority: Notifications.AndroidNotificationPriority.HIGH,
      ...(Platform.OS === 'android' && {
        android: { channelId: NUDGE_CHANNEL_ID, color: '#f59e0b', smallIcon: 'ic_launcher' },
      }),
    },
    trigger: null,
  });
}

// ─── public hook ─────────────────────────────────────────────────────────────

export function useTimerNotification(todayGoals: Goal[], todayEntries: DayEntry[]) {
  const { startedAt, activeTaskTitle, activeTaskId } = useTimerStore();
  const isRunning = !!startedAt;

  const player = useAudioPlayer(ALERT_SOUND);
  const playerRef = useRef(player);
  playerRef.current = player;

  const listenerRef        = useRef<Notifications.Subscription | null>(null);
  const scheduleIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const nudgeIntervalRef   = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastNudgedAtRef    = useRef<number | null>(null);

  // One-time setup
  useEffect(() => {
    setupChannels();
    requestPermissions();

    Notifications.setNotificationHandler({
      handleNotification: async (notif) => ({
        shouldShowAlert: true,
        shouldPlaySound: notif.request.identifier === NUDGE_NOTIF_ID,
        shouldSetBadge: false,
      }),
    });

    listenerRef.current = Notifications.addNotificationResponseReceivedListener((res) => {
      const id = res.notification.request.identifier;
      if (id === TIMER_NOTIF_ID || id === SCHEDULE_NOTIF_ID || id === NUDGE_NOTIF_ID) {
        router.push('/(app)/today');
      }
    });

    return () => {
      listenerRef.current?.remove();
      if (scheduleIntervalRef.current) clearInterval(scheduleIntervalRef.current);
      if (nudgeIntervalRef.current) clearInterval(nudgeIntervalRef.current);
      Vibration.cancel();
    };
  }, []);

  // Timer notification
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
    return () => { if (scheduleIntervalRef.current) clearInterval(scheduleIntervalRef.current); };
  }, [todayGoals]);

  // Nudge: vibrate + sound + notification every 3 min for unattended in-window goals
  useEffect(() => {
    if (nudgeIntervalRef.current) clearInterval(nudgeIntervalRef.current);

    const checkAndNudge = () => {
      const unattended = getUnattendedInWindowGoals(todayGoals, todayEntries, activeTaskId);

      if (unattended.length === 0) {
        Vibration.cancel();
        Notifications.dismissNotificationAsync(NUDGE_NOTIF_ID);
        lastNudgedAtRef.current = null;
        return;
      }

      const now  = Date.now();
      const last = lastNudgedAtRef.current;
      if (last !== null && now - last < NUDGE_INTERVAL_MS) return;

      lastNudgedAtRef.current = now;

      // Vibrate
      Vibration.vibrate(NUDGE_VIBRATION, false);

      // Play alert sound if app is foregrounded
      if (AppState.currentState === 'active') {
        playerRef.current.seekTo(0);
        playerRef.current.play();
      }

      // Fire notification (handles background + gives banner in foreground)
      showNudgeNotif(unattended);
    };

    checkAndNudge();
    nudgeIntervalRef.current = setInterval(checkAndNudge, NUDGE_TICK_MS);

    return () => {
      if (nudgeIntervalRef.current) clearInterval(nudgeIntervalRef.current);
      Vibration.cancel();
    };
  }, [todayGoals, todayEntries, activeTaskId]);

  // Re-evaluate on foreground
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') showScheduleNotif(getScheduleStatus(todayGoals));
    });
    return () => sub.remove();
  }, [todayGoals]);
}
