#!/usr/bin/env node
/**
 * Notification test data manager
 *
 * Usage:
 *   node scripts/test-notif.js create <email> <password>
 *   node scripts/test-notif.js delete  <email> <password>
 *
 * Env overrides:
 *   API_URL=http://localhost:9559   (default)
 *
 * Examples:
 *   node scripts/test-notif.js create you@example.com secret
 *   API_URL=http://192.168.100.181:3002 node scripts/test-notif.js create you@example.com secret
 */

const MODE     = process.argv[2];
const EMAIL    = process.argv[3] || process.env.TEST_EMAIL;
const PASSWORD = process.argv[4] || process.env.TEST_PASSWORD;
const API_URL  = (process.env.API_URL || 'http://localhost:9559').replace(/\/$/, '');

// ─── test goal titles (exact match used for purge) ───────────────────────────
const TITLES = {
  nudge: '[TEST] Nudge test',
  timer: '[TEST] Timer test',
  tray:  '[TEST] Tray test',
};

// ─── helpers ─────────────────────────────────────────────────────────────────

function pad(n) { return String(n).padStart(2, '0'); }

function toHHMM(date) {
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function addMin(date, m) {
  return new Date(date.getTime() + m * 60_000);
}

async function req(path, { method = 'GET', token, body } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`${method} ${path} → ${res.status}  ${text}`);
  }
  if (res.status === 204) return null;
  return res.json();
}

// ─── main ────────────────────────────────────────────────────────────────────

async function main() {
  if (!['create', 'delete'].includes(MODE)) {
    console.error('Usage: node test-notif.js <create|delete> <email> <password>');
    process.exit(1);
  }
  if (!EMAIL || !PASSWORD) {
    console.error('Missing credentials — pass as args or set TEST_EMAIL / TEST_PASSWORD');
    process.exit(1);
  }

  console.log(`\n🔐  Logging in as ${EMAIL}  (${API_URL}) ...`);
  const { token } = await req('/auth/login', { method: 'POST', body: { email: EMAIL, password: PASSWORD } });
  console.log('✅  Authenticated\n');

  // purge existing test goals
  const allGoals = await req('/goals', { token });
  const testGoals = allGoals.filter(g => Object.values(TITLES).includes(g.title));

  if (testGoals.length) {
    console.log(`🗑️   Deleting ${testGoals.length} existing test goal(s)...`);
    await Promise.all(testGoals.map(g => req(`/goals/${g.id}`, { method: 'DELETE', token })));
    testGoals.forEach(g => console.log(`    ✓  "${g.title}"`));
  } else {
    console.log('   No existing test goals found');
  }

  if (MODE === 'delete') {
    console.log('\n✅  Done — test goals removed.\n');
    return;
  }

  // ── create ──────────────────────────────────────────────────────────────────
  const now   = new Date();
  const start = addMin(now, 1);   // 1-min buffer so you can prepare your phone

  const goals = [
    {
      title:            TITLES.nudge,
      description:      'Do NOT log or tap Run. Should vibrate + sound at start and +3 min.',
      startTime:        toHHMM(start),
      endTime:          toHHMM(addMin(start, 15)),
      allocatedMinutes: 15,
      isWeekdayGoal:    false,
      isWeekendGoal:    false,
    },
    {
      title:            TITLES.timer,
      description:      'Tap Run immediately when window opens. Alert fires 2 min before 5-min timer ends (i.e. at the 3-min mark).',
      startTime:        toHHMM(start),
      endTime:          toHHMM(addMin(start, 20)),
      allocatedMinutes: 5,          // 2-min-before fires at the 3-min mark
      isWeekdayGoal:    false,
      isWeekendGoal:    false,
    },
    {
      title:            TITLES.tray,
      description:      'Check notification shade — should show a persistent non-swipeable notification.',
      startTime:        toHHMM(start),
      endTime:          toHHMM(addMin(start, 30)),
      allocatedMinutes: 30,
      isWeekdayGoal:    false,
      isWeekendGoal:    false,
    },
  ];

  console.log('\n📝  Creating test goals...');
  for (const g of goals) {
    await req('/goals', { method: 'POST', token, body: g });
    console.log(`    ✓  "${g.title}"   ${g.startTime} – ${g.endTime}`);
  }

  const bufferSec = Math.max(0, Math.round((start - new Date()) / 1000));

  console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅  3 test goals created.  Window opens at ${toHHMM(start)}
    (${bufferSec}s from now)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📱  On your phone:
    • Pull-to-refresh on Today screen  (no restart needed)
    • You have ~1 min before start time

🧪  Test 1 — Nudge
    Goal  : "${TITLES.nudge}"
    Action: do NOTHING — don't log, don't tap Run
    Expect: vibrate + sound at ${toHHMM(start)}, again at ${toHHMM(addMin(start, 3))}

🧪  Test 2 — 2-min-before timer alert
    Goal  : "${TITLES.timer}"
    Action: tap Run as soon as ${toHHMM(start)} passes, then lock phone
    Expect: sound notification at 3-min mark (${toHHMM(addMin(start, 3))} approx)

🧪  Test 3 — Always-on tray notification
    Goal  : "${TITLES.tray}"
    Action: pull down notification shade any time after ${toHHMM(start)}
    Expect: persistent notification showing next task — can't be swiped away

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🧹  Cleanup when done:
    node scripts/test-notif.js delete ${EMAIL} <password>
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`);
}

main().catch(err => {
  console.error('\n❌  Error:', err.message);
  process.exit(1);
});
