#!/usr/bin/env node
// Kubernetes CronJob script — runs every minute via k8s/notification-cronjob.yaml
import 'dotenv/config';
import { Expo } from 'expo-server-sdk';
import prisma from '../config/database.js';

const expo = new Expo({ accessToken: process.env.EXPO_ACCESS_TOKEN });

// ─── timezone helpers ─────────────────────────────────────────────────────────

function getHHMMOffset(timezone: string, offsetMinutes: number): string {
  const d = new Date(Date.now() + offsetMinutes * 60 * 1000);
  const parts = new Intl.DateTimeFormat('en-US', {
    hour: '2-digit', minute: '2-digit', hour12: false, timeZone: timezone,
  }).formatToParts(d);
  const h = (parts.find((p) => p.type === 'hour')?.value ?? '00').replace(/^24/, '00');
  const m = parts.find((p) => p.type === 'minute')?.value ?? '00';
  return `${h.padStart(2, '0')}:${m.padStart(2, '0')}`;
}

function getLocalDateString(timezone: string): string {
  return new Intl.DateTimeFormat('sv', { timeZone: timezone }).format(new Date());
}

function getIsWeekend(timezone: string): boolean {
  const day = new Date().toLocaleDateString('en-US', { weekday: 'long', timeZone: timezone });
  return day === 'Saturday' || day === 'Sunday';
}

function goalAppliesToday(
  goal: { isWeekdayGoal: boolean; isWeekendGoal: boolean; targetEndDate: string | null },
  localDate: string,
  isWeekend: boolean,
): boolean {
  if (goal.targetEndDate && localDate > goal.targetEndDate) return false;
  if (!goal.isWeekdayGoal && !goal.isWeekendGoal) return true;
  return isWeekend ? goal.isWeekendGoal : goal.isWeekdayGoal;
}

// ─── send helper ──────────────────────────────────────────────────────────────

async function sendToUser(
  pushTokens: { token: string }[],
  channelId: string,
  title: string,
  body: string,
  data: Record<string, string>,
) {
  const messages = pushTokens
    .map((pt) => pt.token)
    .filter((t) => Expo.isExpoPushToken(t))
    .map((to) => ({ to, channelId, sound: 'default' as const, title, body, data }));

  if (!messages.length) return;
  const chunks = expo.chunkPushNotifications(messages);
  for (const chunk of chunks) {
    await expo.sendPushNotificationsAsync(chunk);
  }
}

// ─── main ─────────────────────────────────────────────────────────────────────

async function main() {
  // Clean up logs older than 7 days
  await prisma.notificationLog.deleteMany({
    where: { sentAt: { lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } },
  });

  const users = await prisma.user.findMany({
    include: { pushTokens: true, goals: { where: { completedAt: null } } },
  });

  for (const user of users) {
    if (!user.pushTokens.length || !user.goals.length) continue;

    const timezone   = user.pushTokens[0].timezone;
    const localDate  = getLocalDateString(timezone);
    const isWeekend  = getIsWeekend(timezone);

    // Time targets
    const inFiveMin  = getHHMMOffset(timezone, +5); // goals starting in 5 minutes
    const twoMinAgo  = getHHMMOffset(timezone, -2); // goals that started 2 minutes ago

    const applicable = user.goals.filter((g) => goalAppliesToday(g, localDate, isWeekend));

    for (const goal of applicable) {

      // ── Pre-task reminder (5 min before) ────────────────────────────────────
      if (goal.startTime === inFiveMin) {
        const alreadySent = await prisma.notificationLog.findUnique({
          where: { goalId_date_type: { goalId: goal.id, date: localDate, type: 'pre_task' } },
        });
        const entryLogged = await prisma.dayEntry.findUnique({
          where: { goalId_date: { goalId: goal.id, date: localDate } },
        });
        if (!alreadySent && !entryLogged) {
          await sendToUser(
            user.pushTokens,
            'task_nudge',
            `⏰ ${goal.title}`,
            `Starts in 5 minutes  ·  ${goal.startTime}–${goal.endTime}`,
            { goalId: goal.id, type: 'pre_task' },
          );
          await prisma.notificationLog.create({
            data: { goalId: goal.id, date: localDate, type: 'pre_task' },
          });
          console.log(`[${new Date().toISOString()}] pre_task: "${goal.title}" → ${user.email}`);
        }
      }

      // ── Unattended alarm (2 min after start, no entry) ───────────────────────
      if (goal.startTime === twoMinAgo) {
        const alreadySent = await prisma.notificationLog.findUnique({
          where: { goalId_date_type: { goalId: goal.id, date: localDate, type: 'task_alarm' } },
        });
        const entryLogged = await prisma.dayEntry.findUnique({
          where: { goalId_date: { goalId: goal.id, date: localDate } },
        });
        if (!alreadySent && !entryLogged) {
          await sendToUser(
            user.pushTokens,
            'task_alarm',
            `🚨 ${goal.title}`,
            `Unattended for 2 minutes — tap to log`,
            { goalId: goal.id, type: 'task_alarm' },
          );
          await prisma.notificationLog.create({
            data: { goalId: goal.id, date: localDate, type: 'task_alarm' },
          });
          console.log(`[${new Date().toISOString()}] task_alarm: "${goal.title}" → ${user.email}`);
        }
      }
    }
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => { console.error(e); prisma.$disconnect(); process.exit(1); });
