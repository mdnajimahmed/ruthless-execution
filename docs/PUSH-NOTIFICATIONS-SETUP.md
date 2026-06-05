# Push Notifications — Build & E2E Test Guide

## Build steps

**Trigger CI build** (simplest) — push to main, GitHub Actions builds the APK and attaches it to a GitHub Release.

**Or build locally:**

```bash
cd mobile
# drop google-services.json here first (from Firebase console)
npx expo prebuild --platform android --no-install --clean
cd android && ./gradlew assembleRelease --no-daemon
adb install app/build/outputs/apk/release/app-release.apk
```

---

## E2E notification test — step by step

### 1. Get the device's Expo push token

Add a temporary log in `registerExpoPushToken` (`src/hooks/useNotificationSetup.ts`) to see the token:

```typescript
console.log('[PushToken]', token);
```

Open Metro / adb logcat and grab the `ExponentPushToken[xxxx...]` string after login.

Or query the DB directly after the app logs in:

```sql
SELECT token, platform, timezone FROM "PushToken";
```

### 2. Send a test notification

**Best tool: Expo's web UI** — paste the token, fire instantly, no code needed:

```
https://expo.dev/notifications
```

**Or curl** (matches exactly what the CronJob sends):

```bash
curl -X POST https://exp.host/--/api/v2/push/send \
  -H "Content-Type: application/json" \
  -d '{
    "to": "ExponentPushToken[PASTE_TOKEN_HERE]",
    "channelId": "task_nudge",
    "sound": "default",
    "title": "⏰ Morning run",
    "body": "Time to start  ·  07:00–07:30",
    "data": {"goalId": "test", "type": "goal_start"}
  }'
```

The response includes a receipt ID. `"status": "ok"` means Expo accepted it and queued it to FCM.

### 3. Check delivery receipts (optional)

```bash
curl -X POST https://exp.host/--/api/v2/push/getReceipts \
  -H "Content-Type: application/json" \
  -d '{"ids": ["RECEIPT_ID_FROM_ABOVE"]}'
```

| Receipt status | Meaning |
|---|---|
| `"ok"` | FCM delivered it |
| `"error"` + `DeviceNotRegistered` | Bad FCM token — rebuild needed |
| `"error"` + `MessageTooBig` | Payload over 4 KB |

---

## Test the CronJob path directly

Temporarily change a goal's `startTime` in the DB to the next minute, then trigger the script manually without waiting for the cron schedule:

```bash
# locally
cd backend
node dist/scripts/send-notifications.js

# or on Kubernetes
kubectl create job --from=cronjob/rex-goal-notifications manual-test-1
```

Check logs for:
```
[2026-06-05T...] Sent: "goal title" → your@email.com
```

---

## One-time setup checklist

- [ ] Firebase project created, Android app added (`com.turinghatch.rex`), `google-services.json` downloaded
- [ ] `GOOGLE_SERVICES_JSON` secret added in GitHub repo → Settings → Secrets → Actions
- [ ] `eas login && eas init` run in `mobile/` — real `projectId` written to `app.json`
- [ ] FCM Server Key added in EAS dashboard → your project → Credentials → Android
- [ ] k8s secret created: `kubectl create secret generic rex-backend-secrets --from-literal=DATABASE_URL='...' --from-literal=EXPO_ACCESS_TOKEN='...'`
- [ ] CronJob deployed: `kubectl apply -f k8s/notification-cronjob.yaml`
