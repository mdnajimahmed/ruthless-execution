import { useEffect, useRef, useCallback } from 'react';
import { Platform, AppState, Vibration } from 'react-native';
import * as Notifications from 'expo-notifications';
import { useAudioPlayer } from 'expo-audio';
import { router } from 'expo-router';
import { useTimerStore } from '@/stores/timerStore';
import { formatSeconds } from '@/utils/formatTime';
import type { Goal } from '@/types/goal';
import type { DayEntry } from '@/types/dayEntry';

const TIMER_CHANNEL_ID     = 'timer_v2';
const NUDGE_CHANNEL_ID     = 'task_nudge';
const ALARM_CHANNEL_ID     = 'task_alarm';
const TIMER_NOTIF_ID       = 'rex-timer';
const STICKY_NOTIF_ID      = 'rex-sticky';
const TIMER_ALERT_NOTIF_ID = 'rex-timer-alert';

const ALERT_SOUND = require('../../assets/sounds/alert.mp3');

// ─── channel setup ────────────────────────────────────────────────────────────

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

  // High importance — sticky pre-task reminder (non-dismissable)
  await Notifications.setNotificationChannelAsync(NUDGE_CHANNEL_ID, {
    name: 'Task Reminders',
    importance: Notifications.AndroidImportance.HIGH,
    enableVibrate: true,
    vibrationPattern: [0, 400, 200, 400],
    showBadge: false,
  });

  // MAX importance — unattended alarm, bypasses Do Not Disturb
  await Notifications.setNotificationChannelAsync(ALARM_CHANNEL_ID, {
    name: 'Task Alarm',
    importance: Notifications.AndroidImportance.MAX,
    enableVibrate: true,
    vibrationPattern: [0, 1000, 200, 1000, 200, 1000], // 3 strong pulses
    bypassDnd: true,
    showBadge: false,
  });
}

// ─── timer notification ───────────────────────────────────────────────────────

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
          smallIcon: 'notification_icon',
        },
      }),
    },
    trigger: null,
  });
}

// ─── sticky pre-task notification ─────────────────────────────────────────────

async function postSticky(title: string, body: string) {
  await Notifications.scheduleNotificationAsync({
    identifier: STICKY_NOTIF_ID,
    content: {
      title,
      body,
      sticky: true,
      priority: Notifications.AndroidNotificationPriority.HIGH,
      ...(Platform.OS === 'android' && {
        android: {
          channelId: NUDGE_CHANNEL_ID,
          ongoing: true,       // non-dismissable on Android
          color: '#0f766e',
          smallIcon: 'notification_icon',
        },
      }),
    },
    trigger: null,
  });
}

// ─── public hook ──────────────────────────────────────────────────────────────

export function useTimerNotification(todayGoals: Goal[], todayEntries: DayEntry[]) {
  const { startedAt, activeTaskTitle, activeTaskId, allocatedMinutes } = useTimerStore();
  const isRunning = !!startedAt;

  const player = useAudioPlayer(ALERT_SOUND);
  const playerRef = useRef(player);
  playerRef.current = player;

  const listenerRef    = useRef<Notifications.Subscription | null>(null);
  const alarmTimers    = useRef<ReturnType<typeof setTimeout>[]>([]);
  const stickyGoalRef  = useRef<string | null>(null); // goalId currently in sticky tray

  // ── alarm trigger (foreground: sound + vibration × 3 at 10s intervals) ─────
  const triggerAlarmRef = useRef<() => void>(() => {});
  triggerAlarmRef.current = useCallback(() => {
    alarmTimers.current.forEach(clearTimeout);
    alarmTimers.current = [];
    for (let i = 0; i < 3; i++) {
      const t = setTimeout(() => {
        playerRef.current.seekTo(0);
        playerRef.current.play();
        Vibration.vibrate([0, 1000, 200, 1000, 200, 1000]);
      }, i * 10_000);
      alarmTimers.current.push(t);
    }
  }, []);

  // ── one-time setup ────────────────────────────────────────────────────────
  useEffect(() => {
    setupChannels();
    Notifications.requestPermissionsAsync();

    Notifications.setNotificationHandler({
      handleNotification: async (notif) => {
        const id   = notif.request.identifier;
        const data = notif.request.content.data as Record<string, unknown> | null;
        const type = data?.type as string | undefined;

        // Pre-task reminder → intercept and post as non-dismissable sticky
        if (type === 'pre_task') {
          stickyGoalRef.current = data?.goalId as string ?? null;
          postSticky(
            notif.request.content.title ?? '',
            notif.request.content.body ?? '',
          );
          // Suppress the raw FCM banner — we posted our own sticky version
          return { shouldShowBanner: false, shouldShowList: false, shouldPlaySound: false, shouldSetBadge: false };
        }

        // Unattended alarm → play sound + vibrate × 3 if foregrounded
        if (type === 'task_alarm') {
          // Dismiss the sticky (task started being handled)
          Notifications.dismissNotificationAsync(STICKY_NOTIF_ID);
          stickyGoalRef.current = null;
          if (AppState.currentState === 'active') {
            triggerAlarmRef.current();
            // Foreground: we handle the alarm ourselves — suppress FCM banner
            return { shouldShowBanner: false, shouldShowList: false, shouldPlaySound: false, shouldSetBadge: false };
          }
          // Background: let the FCM alarm channel handle sound + vibration
          return { shouldShowBanner: true, shouldShowList: true, shouldPlaySound: true, shouldSetBadge: false };
        }

        // 2-min timer alert (local, scheduled by this app)
        if (id === TIMER_ALERT_NOTIF_ID) {
          if (AppState.currentState === 'active') {
            playerRef.current.seekTo(0);
            playerRef.current.play();
          }
          return { shouldShowBanner: true, shouldShowList: true, shouldPlaySound: true, shouldSetBadge: false };
        }

        return { shouldShowBanner: true, shouldShowList: true, shouldPlaySound: false, shouldSetBadge: false };
      },
    });

    listenerRef.current = Notifications.addNotificationResponseReceivedListener(() => {
      router.push('/(app)/today');
    });

    return () => {
      listenerRef.current?.remove();
      alarmTimers.current.forEach(clearTimeout);
    };
  }, []);

  // ── dismiss sticky when entry is logged for the active sticky goal ─────────
  useEffect(() => {
    const goalId = stickyGoalRef.current;
    if (!goalId) return;
    const hasEntry = todayEntries.some((e) => e.goalId === goalId);
    if (hasEntry) {
      Notifications.dismissNotificationAsync(STICKY_NOTIF_ID);
      stickyGoalRef.current = null;
    }
  }, [todayEntries]);

  // ── timer ongoing notification ────────────────────────────────────────────
  useEffect(() => {
    if (isRunning && startedAt) {
      showTimerNotif(activeTaskTitle, startedAt);
    } else {
      Notifications.dismissNotificationAsync(TIMER_NOTIF_ID);
    }
  }, [isRunning, startedAt, activeTaskTitle]);

  // ── 2-min-before timer alert (OS-scheduled, fires even when backgrounded) ──
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
          android: { channelId: NUDGE_CHANNEL_ID, color: '#0f766e', smallIcon: 'notification_icon' },
        }),
      },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: fireAt },
    });
  }, [startedAt, allocatedMinutes, activeTaskTitle]);
}
