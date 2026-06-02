# ruthless-execution — Mobile App Design

> `com.turinghatch.rex` | turinghatch product family
> Single source of truth for the mobile companion app to month-goal-tracker.
> Covers product concept, UX flows, technical architecture, component catalogue,
> API usage map, and implementation roadmap.

---

## 1. Product Concept

**App name:** ruthless-execution  
**Bundle ID:** `com.turinghatch.rex`  
**Brand:** turinghatch (always lowercase)  
**Tagline:** Execute without mercy.  
**Character:** Calm, purposeful, relentless. Not a todo list. A daily execution machine.

### The Problem It Solves

You have time-bound goals and an Eisenhower matrix on the web. On mobile you need to:
- See **today's goals** the moment you open the app — status at a glance
- Start a **focus timer** on any goal or task with one tap — count-up, stays in front of your eyes
- Audio cues at key moments — 1 beep at 5 min to go, 3 beeps when allocated time is up
- Navigate to yesterday and see how you did — accountability loop
- Manage your Eisenhower matrix — add, move, complete, focus on tasks

### Design Philosophy

Inspired by proven apps (Things 3, Linear, Forest, Superlist):
- **One screen, one job.** Today = goals. Matrix = tasks. No mixing.
- **Floating persistence.** Running timer pill visible on every screen — never lost.
- **Swipe is navigation.** Left/right on Today moves between days.
- **Audio without interruption.** Beeps are signals, not annoyances. No push notifications.
- **Timer is a focus tool.** For Eisenhower tasks: pure focus (no data saved). For goals: saves actualMinutes to API on stop.

### Timer Behaviour Summary

| Timer context | Beeps | On stop |
|---|---|---|
| Goal (has `allocatedMinutes`) | 1 beep at `allocatedMinutes - 5 min`, 3 beeps at `allocatedMinutes` | Saves actualMinutes to DayEntry via API |
| Eisenhower task (no time budget) | No beeps | Nothing saved — pure focus tool |

---

## 2. Functional Requirements

### Must Have (MVP)

| # | Requirement |
|---|---|
| F1 | Today screen shows today's Goals with DayEntry status at a glance |
| F2 | Goal timer: count-up, 1 beep at (allocatedMinutes − 5), 3 beeps at allocatedMinutes |
| F3 | Goal timer stop: auto-saves actualMinutes + sets status to DayEntry via API |
| F4 | Eisenhower task timer: count-up, pure focus, no data saved on stop |
| F5 | Only one timer running at a time (goal or task — not both) |
| F6 | Floating timer pill visible on every screen while timer is active |
| F7 | Screen stays on while timer is active (expo-keep-awake) |
| F8 | Swipe left on Today = previous day (read-only); swipe right back toward today |
| F9 | Daily stats strip: goals hit/partial/miss, total minutes logged |
| F10 | Full Eisenhower Matrix tab — 4 quadrant tabs, tasks list per quadrant |
| F11 | Goals tab — active goals with 7-day hit-rate bars, log day entry |
| F12 | JWT authentication (login, token persist, verify on app boot) |
| F13 | Pull to refresh on all data screens |
| F14 | Mark Eisenhower task complete / uncomplete |
| F15 | Add / edit / delete Eisenhower tasks, move between quadrants |
| F16 | Add / edit goal day entry (status, actual minutes, comment) |

### Explicitly Out of Scope (MVP)

- Push notifications — not built
- WebSocket / real-time sync — not built (pull to refresh is enough)
- Drag-and-drop reordering on mobile — use web app
- Backlog management — web only
- Vision / long-term planning — web only
- Offline mode — not built

---

## 3. Screen Flows & UX

### 3.1 Navigation Structure

```
Root Stack (Expo Router)
│
├── (auth)/
│   ├── index.tsx              ← Login screen
│   └── forgot-password.tsx
│
└── (app)/                     ← Auth-guarded, tab layout
    ├── _layout.tsx            ← Bottom tabs (3) + FloatingTimerPill mount
    ├── today.tsx              ← TAB 1: Daily goals
    ├── matrix.tsx             ← TAB 2: Eisenhower board
    └── goals.tsx              ← TAB 3: Goals list

    Modals (pushed on root stack):
    ├── timer.tsx              ← Full-screen active timer
    ├── task/[id].tsx          ← Task detail (bottom sheet)
    └── goal/[id].tsx          ← Goal / day-entry sheet
```

Bottom tab icons: Today (sun/calendar) · Matrix (grid) · Goals (target)

---

### 3.2 Today Screen

**Purpose:** One glance shows the entire day's goal execution state.

```
┌─────────────────────────────────────┐
│  ‹  Monday, Jun 2         ›         │  ← DateNavHeader (arrows + swipe)
├─────────────────────────────────────┤
│  ░░░░░ StatsBanner ░░░░░░░░░░░░░░░  │
│  2 hit · 1 partial · 0 miss · 47m  │
├─────────────────────────────────────┤
│  GOALS TODAY                        │  ← label (uppercase, teal-600)
│                                     │
│  ┌─────────────────────────────┐    │
│  │ 07:00 – 07:30 · Reading     │    │  ← GoalCard
│  │ 30 min alloc                │    │
│  │ ████████████ HIT    [▶ Run] │    │  ← status + timer button
│  └─────────────────────────────┘    │
│                                     │
│  ┌─────────────────────────────┐    │
│  │ 06:00 – 06:30 · Exercise    │    │
│  │ 30 min alloc                │    │
│  │ 14 min logged  PARTIAL [▶]  │    │
│  └─────────────────────────────┘    │
│                                     │
│  ┌─────────────────────────────┐    │
│  │ 20:00 – 20:30 · Side project│    │
│  │ 30 min alloc                │    │
│  │ No entry yet        [▶ Run] │    │
│  └─────────────────────────────┘    │
│                                     │
│                                     │
│        [●●●●] FloatingTimerPill     │  ← bottom, above tab bar (if active)
└─────────────────────────────────────┘
```

**Date navigation:**
- Header shows current date. `‹` arrow = previous day. `›` arrow = forward (disabled when on today).
- Horizontal swipe on the entire screen also navigates (react-native-reanimated pan).
- Past days: read-only. `[▶ Run]` buttons replaced with `[View]`. No timer starts.
- Can go back up to 30 days.

**Goals shown:**
- Weekday goals (`isWeekdayGoal: true`) on Mon–Fri
- Weekend goals (`isWeekendGoal: true`) on Sat–Sun
- Not-yet-completed goals only (on today's date)
- Each goal shows its DayEntry for the viewed date if it exists

**StatsBanner contents:**
- Count of entries with `status: 'hit'`
- Count of `status: 'partial'`
- Count of `status: 'miss'`
- Sum of `actualMinutes` for the day

**Empty state:** "No goals for today. Add goals on the Goals tab."

---

### 3.3 Floating Timer Pill

Mounted at `(app)/_layout.tsx` — renders on every screen while timer is active.

```
          ╔══════════════════════════════════╗
          ║  ▶  Morning Reading  ·  04:23   ║
          ╚══════════════════════════════════╝
```

- Position: `bottom: 72px` (8px above tab bar), horizontally centered
- teal-700 background, white text, pill shape (`border-radius: 9999px`)
- Animates in from bottom (`translateY`) when timer starts; animates out on stop
- **Tap**: navigates to full-screen `/timer` modal
- **Long press**: "Stop timer?" confirm → stops (saves if goal timer)
- Invisible (not rendered) when no timer is running

---

### 3.4 Full-Screen Timer Modal (`/timer`)

Reached by: tapping a `[▶ Run]` button on a GoalCard, OR tapping the FloatingTimerPill, OR `[▶]` on a task in Matrix.

```
┌─────────────────────────────────────┐
│                              [  ×  ]│  ← minimize (timer keeps running)
│                                     │
│         MORNING READING             │  ← goal/task title (label style)
│                                     │
│                                     │
│         0 0 : 1 4 : 2 7             │  ← large monospaced clock
│                                     │
│     Allocated: 30 min               │  ← only for goals with allocatedMinutes
│     ▓▓▓▓▓▓▓▓░░░░░░ 14/30 min       │  ← progress bar (goals only)
│                                     │
│                                     │
│   ┌────────────────────────────┐    │
│   │      ■  STOP & SAVE        │    │  ← for goals: saves to DayEntry
│   └────────────────────────────┘    │
│   ┌────────────────────────────┐    │
│   │         Discard            │    │  ← ghost button: stops, no save
│   └────────────────────────────┘    │
│                                     │
│   Previously logged: 0 min          │  ← accumulated from prior sessions
└─────────────────────────────────────┘
```

**For Eisenhower tasks:**
- No "Allocated" / progress bar shown
- "STOP & SAVE" label becomes "STOP" (nothing saved to API)
- No beeps

**For Goals:**
- Progress bar fills as time passes
- 1 short beep sound at `allocatedMinutes - 5` minutes elapsed
- 3 beep sounds at `allocatedMinutes` elapsed (clock continues running, can keep going)
- STOP & SAVE: calculates elapsed + adds to existing `actualMinutes`, opens goal entry sheet pre-filled so user can set status + add comment

**× button (minimize):** pops modal, timer keeps running, pill visible.  
**Screen locked on:** `expo-keep-awake` active the whole time this screen is mounted.

---

### 3.5 Matrix Screen

```
┌─────────────────────────────────────┐
│  MATRIX                      [+ Add]│
├─────────────────────────────────────┤
│  [DO FIRST] [SCHEDULE] [DELEGATE] [ELIMINATE]  ← tab bar
├─────────────────────────────────────┤
│                                     │
│  ┌─────────────────────────────┐    │
│  │ ● Fix login bug             │    │  ← TaskCard (teal-700 left border)
│  │   [▶ Focus]  [✓ Done]       │    │
│  └─────────────────────────────┘    │
│                                     │
│  ┌─────────────────────────────┐    │
│  │ ● Write auth tests          │    │
│  │   [▶ Focus]  [✓ Done]       │    │
│  └─────────────────────────────┘    │
│                                     │
│  ✓ Completed (3)            [Show]  │  ← collapsed section
│                                     │
└─────────────────────────────────────┘
```

**Tabs:** Do First (teal-700) · Schedule (teal-600) · Delegate (neutral-600) · Eliminate (error)  
**[▶ Focus]:** starts Eisenhower timer (count-up, focus only, no save)  
**[✓ Done]:** calls `POST /eisenhower/:id/complete`  
**Tap task:** opens TaskDetailSheet  
**[+ Add]:** opens add-task bottom sheet, pre-selects the current tab's quadrant  
**Completed section:** collapsed by default, expandable

---

### 3.6 Task Detail Sheet (bottom sheet, 75% height)

```
  ─── ─────────────────────────────── ───
  Fix login bug in auth API

  Quadrant: [DO FIRST]

  Description: (if any)

  ┌──────────────┐    ┌──────────────┐
  │  ▶ Focus     │    │  ✓ Complete  │
  └──────────────┘    └──────────────┘

  ┌──────────────┐    ┌──────────────┐
  │    Edit      │    │   Delete     │
  └──────────────┘    └──────────────┘
  ─── ─────────────────────────────── ───
```

Move quadrant: dropdown inside edit form.

---

### 3.7 Goals Screen

```
┌─────────────────────────────────────┐
│  GOALS                       [+ Add]│
├─────────────────────────────────────┤
│  ACTIVE                             │
│                                     │
│  ┌─────────────────────────────┐    │
│  │ 07:00–07:30 · Morning Read  │    │
│  │ 30 min · weekdays           │    │
│  │ ▓▓▓▓▓░ 5/7 days hit         │    │  ← 7-day hit rate
│  │ [Log today]  [▶ Run]        │    │
│  └─────────────────────────────┘    │
│                                     │
│  ┌─────────────────────────────┐    │
│  │ 06:00–06:30 · Exercise      │    │
│  │ 30 min · weekdays           │    │
│  │ ▓░░▓▓▓░ 4/7 days hit        │    │
│  │ [Log today]  [▶ Run]        │    │
│  └─────────────────────────────┘    │
│                                     │
│  COMPLETED                          │
│  (collapsed, tap to expand)         │
└─────────────────────────────────────┘
```

**7-day bar:** 7 small squares — teal-600 = hit, warning = partial, error = miss, neutral-200 = no entry.

---

### 3.8 Goal Day Entry Sheet

Opens after timer stop (pre-filled) OR via [Log today] button.

```
  ─── ─────────────────────────────── ───
  Morning Reading — Mon, Jun 2

  Status:   [HIT]  [PARTIAL]  [MISS]

  Actual minutes:  [  30  ]
                 (auto-filled from timer)

  Comment:
  ┌────────────────────────────────┐
  │                                │
  └────────────────────────────────┘

  ┌────────────────────────────────┐
  │             Save               │
  └────────────────────────────────┘
  ─── ─────────────────────────────── ───
```

Calls `POST /day-entries` (upsert on goalId + date composite key).

---

### 3.9 Auth Screens

**Login:** turinghatch wordmark (teal, system font) centred. Email + password inputs. Primary login button. "Forgot password?" ghost link below.  
**Forgot password:** Email input. "Send reset link" primary button. Back to login.

---

## 4. Technical Architecture

### 4.1 Technology Stack

| Layer | Choice | Version | Reason |
|---|---|---|---|
| Framework | React Native + Expo | RN 0.76.x, Expo SDK 52 | Same as reference app |
| Routing | Expo Router | 4.0 | File-based, same as reference |
| Language | TypeScript strict | 5.3+ | Same as reference |
| Styling | NativeWind | 4.0 | Tailwind on RN, same as reference |
| Server state | TanStack Query | v5 | Cache, mutations, background refetch |
| Client state | Zustand | 5.x | Timer + auth — zero boilerplate |
| HTTP client | axios | 1.7 | Interceptors for JWT injection |
| Token storage | expo-secure-store | latest | Encrypted — not plain AsyncStorage |
| Timer persist | AsyncStorage | latest | Survive background/foreground cycle |
| Animations | react-native-reanimated | 3.x | Swipe gestures, pill animation |
| Gestures | react-native-gesture-handler | 2.x | Pan swipe on Today |
| Bottom sheets | @gorhom/bottom-sheet | 5.x | Task + goal detail sheets |
| Icons | lucide-react-native | latest | Outline style, matches design spec |
| Screen awake | expo-keep-awake | latest | Screen on during timer |
| Audio beeps | expo-av | latest | 1 beep / 3 beep audio cues for goals |
| Forms | react-hook-form | 7.x | Same as reference |

**Deliberately excluded:** Redux, react-native-mmkv, push notifications, Firebase, WebSocket.

---

### 4.2 Project Structure

```
mobile/                              ← new dir at repo root
├── app/
│   ├── _layout.tsx                  ← root stack
│   ├── (auth)/
│   │   ├── _layout.tsx
│   │   ├── index.tsx                ← login
│   │   └── forgot-password.tsx
│   └── (app)/
│       ├── _layout.tsx              ← bottom tabs + FloatingTimerPill mount
│       ├── today.tsx
│       ├── matrix.tsx
│       ├── goals.tsx
│       ├── timer.tsx                ← full-screen modal
│       ├── task/
│       │   └── [id].tsx             ← task detail sheet
│       └── goal/
│           └── [id].tsx             ← goal / day-entry sheet
├── src/
│   ├── api/
│   │   ├── client.ts                ← axios + JWT interceptor
│   │   ├── auth.ts
│   │   ├── eisenhower.ts
│   │   ├── goals.ts
│   │   └── day-entries.ts
│   ├── config/
│   │   └── designTokens.ts          ← Turinghatch token system (RN values)
│   ├── components/
│   │   ├── FloatingTimerPill.tsx
│   │   ├── TaskCard.tsx
│   │   ├── GoalCard.tsx
│   │   ├── QuadrantBadge.tsx
│   │   ├── StatsBanner.tsx
│   │   ├── DateNavHeader.tsx
│   │   ├── HitRateBar.tsx
│   │   ├── SkeletonCard.tsx
│   │   ├── EmptyState.tsx
│   │   └── PrimaryButton.tsx
│   ├── hooks/
│   │   ├── useTimer.ts              ← start/stop/elapsed + audio cues
│   │   ├── useAuth.ts
│   │   ├── useEisenhower.ts         ← TanStack Query wrappers
│   │   ├── useGoals.ts
│   │   └── useDayEntries.ts
│   ├── stores/
│   │   ├── timerStore.ts            ← Zustand: activeTask, startedAt
│   │   └── authStore.ts             ← Zustand: token, userId, email
│   ├── types/
│   │   ├── eisenhower.ts
│   │   ├── goal.ts
│   │   ├── dayEntry.ts
│   │   └── auth.ts
│   └── utils/
│       ├── formatTime.ts            ← HH:MM:SS display for timer
│       ├── formatDate.ts            ← YYYY-MM-DD helpers + display labels
│       └── taskUtils.ts             ← quadrant label/color helpers
├── assets/
│   └── sounds/
│       └── beep.mp3                 ← single short beep (played 1× or 3×)
├── package.json
├── app.json
├── tsconfig.json
├── babel.config.js
├── global.css
├── tailwind.config.js
└── nativewind-env.d.ts
```

---

### 4.3 State Architecture

#### Auth Store (Zustand)

```typescript
interface AuthStore {
  token: string | null;
  userId: string | null;
  email: string | null;
  isAuthenticated: boolean;
  setAuth(token: string, userId: string, email: string): void;
  clearAuth(): void;
}
```

Token persisted in `expo-secure-store`. On app boot: read token → call `GET /auth/verify` → restore session or redirect to `(auth)`.

#### Timer Store (Zustand + AsyncStorage)

```typescript
interface TimerStore {
  activeTaskId: string | null;
  activeTaskType: 'goal' | 'eisenhower' | null;
  activeTaskTitle: string;
  allocatedMinutes: number | null;   // goals only; null for eisenhower
  startedAt: number | null;          // Date.now() epoch ms
  hasBeepedAtFive: boolean;          // guard: don't beep twice
  hasBeepedAtEnd: boolean;           // guard: don't beep twice
  start(params: TimerStartParams): void;
  stop(): { elapsedMinutes: number };
  getElapsedSeconds(): number;
}
```

Persisted to AsyncStorage (not SecureStore — not sensitive). Survives app backgrounding. On foreground restore: if `startedAt` exists, timer resumes with correct elapsed time.

**Only one timer at a time.** Starting a new timer when one is active shows: "You already have a timer running for [title]. Stop it first."

#### TanStack Query (server state)

Query keys:
```
['eisenhower', { quadrant?, completed? }]
['goals', { completed? }]
['day-entries', { goalId }]
['day-entries', 'range', { startDate, endDate }]
```

All mutations invalidate the relevant keys on `onSuccess`.

---

### 4.4 API Client (`src/api/client.ts`)

```typescript
const api = axios.create({ baseURL: process.env.EXPO_PUBLIC_API_URL });

api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('auth_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    if (err.response?.status === 401) {
      await SecureStore.deleteItemAsync('auth_token');
      useAuthStore.getState().clearAuth();
    }
    return Promise.reject(err);
  }
);
```

---

### 4.5 Timer + Audio Flow (Goals)

```
User taps [▶ Run] on GoalCard
  │
  ▼
timerStore.start({
  activeTaskId: goal.id,
  activeTaskType: 'goal',
  activeTaskTitle: goal.title,
  allocatedMinutes: goal.allocatedMinutes,
  startedAt: Date.now(),
})
  │
  ▼
Navigate to /timer (full-screen modal)
  expo-keep-awake activated
  setInterval (every 1 second): getElapsedSeconds()
    │
    ├─ elapsed >= (allocatedMinutes - 5) * 60 AND !hasBeepedAtFive
    │    → play beep.mp3 × 1
    │    → set hasBeepedAtFive = true
    │
    └─ elapsed >= allocatedMinutes * 60 AND !hasBeepedAtEnd
         → play beep.mp3 × 3 (sequential, 300ms apart)
         → set hasBeepedAtEnd = true

User taps STOP & SAVE
  │
  const { elapsedMinutes } = timerStore.stop()
  │
  ▼
Open Goal Day Entry Sheet pre-filled:
  { actualMinutes: (existingEntry?.actualMinutes ?? 0) + elapsedMinutes }
  User sets status (hit/partial/miss) + optional comment
  Tap Save → POST /day-entries (upsert)
  Invalidate ['day-entries', ...] and ['goals', ...]
```

**Timer + Audio Flow (Eisenhower tasks):**

```
User taps [▶ Focus] on TaskCard
  │
timerStore.start({
  activeTaskId: task.id,
  activeTaskType: 'eisenhower',
  activeTaskTitle: task.title,
  allocatedMinutes: null,     ← no beeps
  startedAt: Date.now(),
})
  │
Navigate to /timer
  expo-keep-awake activated
  count-up, no audio logic
  │
User taps STOP
  timerStore.stop()           ← nothing saved to API
  navigate back
```

---

### 4.6 Day Navigation (Today Screen)

```typescript
const [viewDate, setViewDate] = useState(todayString()); // 'YYYY-MM-DD'

const isReadOnly = viewDate < todayString();
const canGoForward = viewDate < todayString();

// Swipe handler (react-native-gesture-handler PanGesture):
// pan.translationX < -50 on release → setViewDate(subtractDay(viewDate))
// pan.translationX > 50 on release → if canGoForward: setViewDate(addDay(viewDate))
```

Both date arrows and swipe gestures update `viewDate`.  
All queries on Today screen receive `viewDate` as a parameter.

---

## 5. Design System (Turinghatch — RN Adaptation)

### 5.1 Design Tokens (`src/config/designTokens.ts`)

```typescript
export const COLORS = {
  teal50:  '#f0faf9',
  teal100: '#ccfbf1',
  teal200: '#99f6e4',
  teal300: '#5eead4',
  teal400: '#2dd4bf',
  teal500: '#14b8a6',
  teal600: '#0d9488',
  teal700: '#0f766e',
  teal800: '#115e59',
  teal900: '#134e4a',
  neutral0:   '#ffffff',
  neutral100: '#f3f4f6',
  neutral200: '#e5e7eb',
  neutral400: '#9ca3af',
  neutral600: '#4b5563',
  neutral900: '#111827',
  errorDefault: '#ef4444',
  errorBg:      '#fef2f2',
  errorBorder:  '#fca5a5',
  errorText:    '#991b1b',
  successDefault: '#22c55e',
  successBg:      '#f0fdf4',
  successText:    '#166534',
  warningDefault: '#f59e0b',
  warningBg:      '#fffbeb',
  warningText:    '#92400e',
};

export const SPACING = { s1:4, s2:8, s3:12, s4:16, s5:20, s6:24, s8:32, s10:40, s12:48, s16:64 };

export const RADIUS = { card:10, button:8, input:8, pill:9999, tooltip:6 };

export const SHADOWS = {
  sm:   { shadowColor:'#000', shadowOffset:{width:0,height:1}, shadowOpacity:0.08, shadowRadius:3, elevation:2 },
  md:   { shadowColor:'#000', shadowOffset:{width:0,height:4}, shadowOpacity:0.10, shadowRadius:12, elevation:4 },
  card: { shadowColor:'#14b8a6', shadowOffset:{width:0,height:6}, shadowOpacity:0.15, shadowRadius:20, elevation:6 },
};

export const TYPE = {
  h1:      { fontSize:32, fontWeight:'700' as const, lineHeight:38 },
  h3:      { fontSize:18, fontWeight:'600' as const, lineHeight:24 },
  body:    { fontSize:16, fontWeight:'400' as const, lineHeight:26 },
  small:   { fontSize:14, fontWeight:'400' as const, lineHeight:21 },
  label:   { fontSize:12, fontWeight:'600' as const, letterSpacing:1.44 }, // always uppercase
  caption: { fontSize:12, fontWeight:'400' as const, lineHeight:17 },
  button:  { fontSize:14, fontWeight:'600' as const, letterSpacing:0.14 },
  mono:    { fontSize:14, fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace' },
};
```

### 5.2 Quadrant Visual Identity

| Quadrant | Label | Card border | Badge text | Badge bg |
|---|---|---|---|---|
| `do-first` | DO FIRST | `teal700` | `teal700` | `teal100` |
| `schedule` | SCHEDULE | `teal500` | `teal600` | `teal50` |
| `delegate` | DELEGATE | `neutral400` | `neutral600` | `neutral100` |
| `eliminate` | ELIMINATE | `errorDefault` | `errorText` | `errorBg` |

---

## 6. Component Catalogue

### FloatingTimerPill
- Reads `timerStore`. Invisible when no active timer.
- Animates in/out with `withSpring` (react-native-reanimated).
- Tap → router.push('/timer'). Long press → confirm stop.

### TaskCard
```typescript
interface TaskCardProps {
  task: EisenhowerTask;
  isReadOnly?: boolean;
  onFocus: () => void;      // starts Eisenhower timer
  onComplete: () => void;
  onPress: () => void;      // opens detail sheet
}
```
Card: `border: 1px solid teal100`, `borderLeft: 4px solid <quadrant-color>`, `borderRadius: 10`, `padding: 20 24`.

### GoalCard
```typescript
interface GoalCardProps {
  goal: Goal;
  entry?: DayEntry;           // today's or viewed-day entry
  isReadOnly?: boolean;
  onRun: () => void;          // starts goal timer
  onLog: () => void;          // opens day entry sheet
}
```
Shows: time range string, allocated minutes, entry status badge (if exists), minutes logged.

### QuadrantBadge
Pill badge (radius 9999) per quadrant color spec in §5.2.

### StatsBanner
3-column horizontal strip. Background teal50. Shows: hit count · partial count · miss count · total minutes.

### DateNavHeader
Left `‹` / Right `›` arrows + centered date label. `›` disabled when viewing today.

### HitRateBar
7 squares `width: 28, height: 28, borderRadius: 4` in a row. Colors: hit=teal600, partial=warningDefault, miss=errorDefault, none=neutral200.

### SkeletonCard
Shimmer: `linear-gradient` from teal100 → neutral200 → teal100 animated over 1.5s.

### EmptyState
Icon (lucide) 48px in teal200 · Title 16px teal900 · Subtitle 14px neutral400 · Optional action button.

### PrimaryButton
teal-700 bg, white text, `borderRadius: 8`, `paddingVertical: 10`, `paddingHorizontal: 20`, `fontWeight: 600`.

---

## 7. API Usage Map

| Action | Endpoint |
|---|---|
| App boot — verify token | `GET /auth/verify` |
| Login | `POST /auth/login` |
| Forgot password | `POST /auth/forgot-password` |
| Today — load goals | `GET /goals?completed=false` |
| Today — load day entries for viewed date | `GET /day-entries/date/:date/:date` |
| Goal timer stop → log entry | `POST /day-entries` (upsert) |
| Log entry manually | `POST /day-entries` (upsert) |
| Update entry | `PUT /day-entries/:id` |
| Complete goal | `POST /goals/:id/complete` |
| Matrix — load quadrant | `GET /eisenhower?quadrant=do-first` (etc.) |
| Eisenhower task timer | Client only — no API call on stop |
| Complete task | `POST /eisenhower/:id/complete` |
| Uncomplete task | `POST /eisenhower/:id/uncomplete` |
| Add task | `POST /eisenhower` |
| Edit task | `PUT /eisenhower/:id` |
| Move task | `POST /eisenhower/:id/move` |
| Delete task | `DELETE /eisenhower/:id` |
| Goals list | `GET /goals?completed=false` |
| Goal hit rate | `GET /day-entries/goal/:goalId` (last 7) |
| Add goal | `POST /goals` |

**No backend changes required.**

---

## 8. Implementation Roadmap

Each task is independently shippable. Phases are ordered by dependency.

---

### Phase 1 — Bootstrap

| ID | Task | File(s) |
|---|---|---|
| M-01 | Init Expo project in `mobile/` | `mobile/` |
| M-02 | Install all dependencies (see §4.1) | `package.json` |
| M-03 | NativeWind 4 config (babel, tailwind, global.css) | config files |
| M-04 | Design tokens | `src/config/designTokens.ts` |
| M-05 | `app.json` — name, bundleId, splash, icon | `app.json` |
| M-06 | TypeScript strict + path aliases | `tsconfig.json` |
| M-07 | `EXPO_PUBLIC_API_URL` env setup | `.env`, `.env.example` |

---

### Phase 2 — API Layer + Stores

| ID | Task | File(s) |
|---|---|---|
| M-08 | axios instance + JWT interceptors | `src/api/client.ts` |
| M-09 | Auth API functions | `src/api/auth.ts` |
| M-10 | Eisenhower API functions | `src/api/eisenhower.ts` |
| M-11 | Goals API functions | `src/api/goals.ts` |
| M-12 | Day Entries API functions | `src/api/day-entries.ts` |
| M-13 | Auth Zustand store | `src/stores/authStore.ts` |
| M-14 | Timer Zustand store + AsyncStorage persist | `src/stores/timerStore.ts` |
| M-15 | TypeScript types for all models | `src/types/*.ts` |

---

### Phase 3 — Auth Screens

| ID | Task | File(s) |
|---|---|---|
| M-16 | Root + auth layout | `app/_layout.tsx`, `app/(auth)/_layout.tsx` |
| M-17 | Login screen | `app/(auth)/index.tsx` |
| M-18 | Forgot password screen | `app/(auth)/forgot-password.tsx` |
| M-19 | Auth guard: redirect unauth → login | `app/(app)/_layout.tsx` |

---

### Phase 4 — Core UI Components

| ID | Component | Notes |
|---|---|---|
| M-20 | `PrimaryButton` | variants: primary, secondary, ghost, danger |
| M-21 | `QuadrantBadge` | 4 variants per §5.2 |
| M-22 | `TaskCard` | left border color, focus/complete buttons |
| M-23 | `GoalCard` | time range, status badge, run/log buttons |
| M-24 | `HitRateBar` | 7 squares with hit/partial/miss/none colors |
| M-25 | `StatsBanner` | 4-stat horizontal strip |
| M-26 | `DateNavHeader` | date label + prev/next arrows |
| M-27 | `SkeletonCard` | shimmer animation |
| M-28 | `EmptyState` | icon + title + subtitle + optional CTA |

---

### Phase 5 — Timer System

| ID | Task | File(s) |
|---|---|---|
| M-29 | Bundle beep.mp3 asset | `assets/sounds/beep.mp3` |
| M-30 | `useTimer` hook — elapsed, beep logic, keep-awake | `src/hooks/useTimer.ts` |
| M-31 | `FloatingTimerPill` component — animated | `src/components/FloatingTimerPill.tsx` |
| M-32 | Full-screen timer modal screen | `app/(app)/timer.tsx` |
| M-33 | Mount FloatingTimerPill in app layout | `app/(app)/_layout.tsx` |

---

### Phase 6 — Today Screen

| ID | Task | File(s) |
|---|---|---|
| M-34 | `useGoals` TanStack Query hook | `src/hooks/useGoals.ts` |
| M-35 | `useDayEntries` TanStack Query hook | `src/hooks/useDayEntries.ts` |
| M-36 | Date navigation state + swipe gesture | `app/(app)/today.tsx` |
| M-37 | Goal list rendering + StatsBanner | `app/(app)/today.tsx` |
| M-38 | Read-only mode for past days | `app/(app)/today.tsx` |
| M-39 | Goal Day Entry sheet | `app/(app)/goal/[id].tsx` |

---

### Phase 7 — Matrix Screen

| ID | Task | File(s) |
|---|---|---|
| M-40 | `useEisenhower` TanStack Query hook | `src/hooks/useEisenhower.ts` |
| M-41 | Matrix screen with quadrant tabs | `app/(app)/matrix.tsx` |
| M-42 | Task detail bottom sheet | `app/(app)/task/[id].tsx` |
| M-43 | Add / edit task form (react-hook-form) | `app/(app)/task/[id].tsx` |
| M-44 | Completed tasks collapsed section | `app/(app)/matrix.tsx` |

---

### Phase 8 — Goals Screen

| ID | Task | File(s) |
|---|---|---|
| M-45 | Goals list with HitRateBar | `app/(app)/goals.tsx` |
| M-46 | Completed goals collapsed section | `app/(app)/goals.tsx` |
| M-47 | Goal day entry form (react-hook-form) | `app/(app)/goal/[id].tsx` |

---

### Phase 9 — Polish & QA

| ID | Task |
|---|---|
| M-48 | Skeleton loaders on all screens |
| M-49 | Empty states on all lists |
| M-50 | Network error inline alerts (teal toast pattern) |
| M-51 | iOS / Android visual testing |
| M-52 | Tablet responsive check (`useWindowDimensions`) |
| M-53 | `accessibilityLabel` on all interactive elements |
| M-54 | Confirm all shadows use `elevation` on Android (not CSS shadow) |
| M-55 | Verify beep audio on device (not just simulator) |

---

## 9. Coding Conventions

Follows SHAMAJIK-NIRAPOTTA-SHOHAYIKA conventions exactly:

- **TypeScript strict.** All prop interfaces exported with `Props` suffix.
- **Functional components only.**
- **Hooks first** in component body: stores → queries → local state → effects.
- **StyleSheet.create()** at file bottom. NativeWind for layout/spacing, StyleSheet for shadows/platform differences.
- **Named exports** for all components; default exports only for screen files (Expo Router requirement).
- **No inline styles** except genuinely dynamic values (e.g. animated style objects).
- **PascalCase** components, **camelCase** functions/vars, **UPPER_SNAKE_CASE** for top-level constants.
- **No comments** unless the WHY is non-obvious.
- **No mock data.** Skeleton loaders while fetching.
- Imports: React → Expo/RN → third-party → local (`@/...`) → types.
