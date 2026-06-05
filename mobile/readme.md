# Build release APK
cd mobile/android
./gradlew assembleRelease

# APK is at:
# mobile/android/app/build/outputs/apk/release/app-release.apk

# Install directly on connected phone (USB)
adb install -r ../app/build/outputs/apk/release/app-release.apk



cd backend && npm run seed-goals

GitHub Action — `.github/workflows/mobile-release.yml`

Triggers on every push to `main` (and manually via **Actions → Run workflow**). Each run:
- Bakes `https://turinghatch.com/ruthless-execution/api` into the JS bundle
- Stamps `versionCode` = CI run number, `versionName` from `mobile/app.json`
- Builds release APK with Gradle
- Creates a GitHub Release with the APK attached and install instructions

**You need to configure one thing:**

Go to your repo → **Settings → Actions → General → Workflow permissions** → set to **"Read and write permissions"** (so the workflow can create releases). That's it.

**Nothing else** — API URL is hardcoded, debug keystore is already committed, no secrets needed.

The release will appear at: `github.com/<your-org>/month-goal-tracker/releases` with a download link and install instructions for sideloading.

**Optional later:** Swap the debug keystore for a production keystore when you want Play Store distribution.


open /Users/najim/Documents/work/github/month-goal-tracker/mobile/android/app/build/outputs/apk/release

## Local APK builds — env var setup

Gradle does NOT forward inline env vars (e.g. `EXPO_PUBLIC_API_URL=... ./gradlew`) to the
Node/Metro subprocess. Instead, `@expo/env` reads env files. For release builds Expo sets
`NODE_ENV=production` and loads `.env.production` with higher priority than `.env`.

The Gradle command is always the same:
```
cd /Users/najim/Documents/work/github/month-goal-tracker/mobile/android && ANDROID_HOME=$HOME/Library/Android/sdk ./gradlew assembleRelease --no-daemon
```

Which URL gets baked in depends on which env files exist:

| Want | Action |
|------|--------|
| **Prod APK** (`turinghatch.com`) | Ensure `mobile/.env.production` exists (see below) |
| **Local-dev APK** (`192.168.x.x`) | Delete or rename `mobile/.env.production` |

**Creating `.env.production`** (gitignored — recreate on each machine):
```
EXPO_PUBLIC_API_URL=https://turinghatch.com/ruthless-execution/api
```


Test notification

curl -X POST https://exp.host/--/api/v2/push/send   -H "Content-Type: application/json"   -d '{
    "to": "ExponentPushToken[JeEYxfCxwTvygJocENLTmK]",
    "channelId": "task_nudge",
    "sound": "default",
    "title": "⏰ Morning run",
    "body": "Time to start  ·  07:00–07:30",
    "data": {"goalId": "Test notification", "type": "goal_start"}
  }'
