# Android Device Permissions — Ruthless Execution

After installing the APK, configure these in **Settings → Apps → ruthless-execution → App info**.

## Required

| Setting | Location | Action |
|---|---|---|
| Notifications | App info → Notifications | Allow |
| Alarms & reminders | App info → Advanced → Alarms & reminders | Allow |

## Critical — do not skip

| Setting | Location | Action |
|---|---|---|
| Manage app if unused | App info → Unused app settings → Manage app if unused | **Turn OFF** |

"Manage app if unused" is enabled by default on Android. If left on, Android will revoke notification permissions and archive the app after a few weeks of not opening it — you will silently stop receiving all notifications.

## Optional but recommended

| Setting | Location | Action |
|---|---|---|
| Battery optimization | App info → App battery usage | Unrestricted |

Tap **App battery usage** → select **Unrestricted** (not "Optimized"). Prevents Android from killing background work on low battery.

You must set this manually — the app does not prompt for it.
