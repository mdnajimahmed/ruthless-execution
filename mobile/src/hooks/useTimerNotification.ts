import { useEffect, useRef, useCallback } from 'react';
import { Platform, AppState } from 'react-native';
import * as Notifications from 'expo-notifications';
import { useAudioPlayer } from 'expo-audio';
import { router } from 'expo-router';
import { useTimerStore } from '@/stores/timerStore';
import { formatSeconds } from '@/utils/formatTime';
import { rescheduleAllNudges } from '@/tasks/backgroundUpdate';
import type { Goal } from '@/types/goal';
import type { DayEntry } from '@/types/dayEntry';

const TIMER_CHANNEL_ID   = 'timer_v2';
const NUDGE_CHANNEL_ID   = 'task_nudge';
const TIMER_NOTIF_ID     = 'rex-timer';
const SCHEDULE_NOTIF_ID  = 'rex-schedule';
const TIMER_ALERT_NOTIF_ID = 'rex-timer-alert';

const ALERT_SOUND = require('../../assets/sounds/alert.mp3');

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
    return { kind: 'current', goal: current, minutesLeft: parseTimeToMinutes(current.endTime) - now };
  }

  const upcoming = goals
    .filter((g) => parseTimeToMinutes(g.startTime) > now)
    .sort((a, b) => parseTimeToMinutes(a.startTime) - parseTimeToMinutes(b.startTime))[0];

  if (upcoming) {
    return { kind: 'upcoming', goal: upcoming, minutesUntil: parseTimeToMinutes(upcoming.startTime) - now };
  }

  return { kind: 'done' };
}

// ─── channel setup ───────────────────────────────────────────────────────────

async function setupChannels() {
  if (Platform.OS !== 'android') return;

  // Silent ongoing — timer progress bar
  await Notifications.setNotificationChannelAsync(TIMER_CHANNEL_ID, {
    name: 'Timer',
    importance: Notifications.AndroidImportance.LOW,
    sound: null,
    vibrationPattern: null,
    enableVibrate: false,
    showBadge: false,
  });

  // Alerting — unattended task nudges and 2-min-before alert
  await Notifications.setNotificationChannelAsync(NUDGE_CHANNEL_ID, {
    name: 'Task Reminders',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 400, 200, 400, 200, 400],
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
      sticky: true,  // persistent in tray — user can't swipe away
      priority: Notifications.AndroidNotificationPriority.LOW,
      ...(Platform.OS === 'android' && {
        android: {
          channelId: TIMER_CHANNEL_ID,
          ongoing: true,
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
  const { startedAt, activeTaskTitle, activeTaskId, allocatedMinutes } = useTimerStore();
  const isRunning = !!startedAt;

  // Audio player for foreground nudge sound
  const player = useAudioPlayer(ALERT_SOUND);
  const playerRef = useRef(player);
  playerRef.current = player;

  const listenerRef        = useRef<Notifications.Subscription | null>(null);
  const scheduleIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isReschedulingRef  = useRef(false);

  // One-time setup
  useEffect(() => {
    setupChannels();
    requestPermissions();

    Notifications.setNotificationHandler({
      handleNotification: async (notif) => {
        const id = notif.request.identifier;
        const isNudge = id.startsWith('rex-nudge-') || id === TIMER_ALERT_NOTIF_ID;
        // Play alert sound in-app for nudges/timer-alert; silence timer status bar
        if (isNudge && AppState.currentState === 'active') {
          playerRef.current.seekTo(0);
          playerRef.current.play();
        }
        return {
          shouldShowAlert: true,
          shouldPlaySound: isNudge,
          shouldSetBadge: false,
        };
      },
    });

    listenerRef.current = Notifications.addNotificationResponseReceivedListener((res) => {
      router.push('/(app)/today');
    });

    return () => {
      listenerRef.current?.remove();
      if (scheduleIntervalRef.current) clearInterval(scheduleIntervalRef.current);
    };
  }, []);

  // Timer ongoing notification (progress bar in tray)
  useEffect(() => {
    if (isRunning && startedAt) {
      showTimerNotif(activeTaskTitle, startedAt);
    } else {
      Notifications.dismissNotificationAsync(TIMER_NOTIF_ID);
    }
  }, [isRunning, startedAt, activeTaskTitle]);

  // 2-min-before timer alert — OS-scheduled so it fires even when backgrounded
  useEffect(() => {
    Notifications.cancelScheduledNotificationAsync(TIMER_ALERT_NOTIF_ID);

    if (!startedAt || !allocatedMinutes || allocatedMinutes < 3) return;

    const fireAt = new Date(startedAt + (allocatedMinutes - 2) * 60 * 1000);
    if (fireAt <= new Date()) return;

    Notifications.scheduleNotificationAsync({
      identifier: TIMER_ALERT_NOTIF_ID,
      content: {
        title: `⏱ 2 minutes left`,
        body: activeTaskTitle,
        sound: true,
        ...(Platform.OS === 'android' && {
          android: { channelId: NUDGE_CHANNEL_ID, color: '#0f766e', smallIcon: 'ic_launcher' },
        }),
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: fireAt,
      },
    });
  }, [startedAt, allocatedMinutes, activeTaskTitle]);

  // Always-on schedule notification — 60s refresh while foregrounded
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

  // Pre-schedule OS nudge notifications + persist data for background task
  const doReschedule = useCallback(async () => {
    if (isReschedulingRef.current) return;
    isReschedulingRef.current = true;
    try {
      await rescheduleAllNudges(todayGoals, todayEntries, activeTaskId);
    } finally {
      isReschedulingRef.current = false;
    }
  }, [todayGoals, todayEntries, activeTaskId]);

  useEffect(() => {
    doReschedule();
  }, [doReschedule]);

  // Re-evaluate when app comes back to foreground
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        showScheduleNotif(getScheduleStatus(todayGoals));
        doReschedule();
      }
    });
    return () => sub.remove();
  }, [todayGoals, doReschedule]);
}
