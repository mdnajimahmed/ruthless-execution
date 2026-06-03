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


mobile/android/app/build/outputs/apk/release/app-release.apk
cd /Users/najim/Documents/work/github/month-goal-tracker/mobile/android && ANDROID_HOME=$HOME/Library/Android/sdk EXPO_PUBLIC_API_URL=http://192.168.100.181:3002/api ./gradlew assembleRelease --no-daemon
