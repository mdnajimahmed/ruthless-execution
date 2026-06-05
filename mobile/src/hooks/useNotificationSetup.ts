import { useEffect } from 'react';
import { Platform, Alert, Linking } from 'react-native';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { registerPushToken } from '@/api/auth';

const NOTIF_PERMISSION_KEY  = 'rex-notif-permission-v1';
const BATTERY_OPT_KEY       = 'rex-battery-opt-v1';

async function runSetup(): Promise<void> {
  // ── 1. Notification permission ───────────────────────────────────────────
  const { status: currentStatus } = await Notifications.getPermissionsAsync();

  if (currentStatus !== 'granted') {
    const alreadyAsked = await AsyncStorage.getItem(NOTIF_PERMISSION_KEY);
    if (alreadyAsked) return; // user previously denied — don't nag again

    const { status } = await Notifications.requestPermissionsAsync();
    await AsyncStorage.setItem(NOTIF_PERMISSION_KEY, '1');
    if (status !== 'granted') return;
  }

  // ── 2. Battery optimization (Android only, one-time prompt) ──────────────
  if (Platform.OS === 'android') {
    const alreadyPrompted = await AsyncStorage.getItem(BATTERY_OPT_KEY);
    if (!alreadyPrompted) {
      await new Promise<void>((resolve) => {
        Alert.alert(
          'One last thing',
          'Disable battery optimization for this app so goal reminders fire reliably when your screen is off.',
          [
            { text: 'Skip', style: 'cancel', onPress: () => resolve() },
            {
              text: 'Allow',
              onPress: async () => {
                try {
                  await Linking.openURL(
                    'android.settings.REQUEST_IGNORE_BATTERY_OPTIMIZATIONS?package=com.turinghatch.rex',
                  );
                } catch {
                  await Linking.openSettings();
                }
                resolve();
              },
            },
          ],
        );
      });
      await AsyncStorage.setItem(BATTERY_OPT_KEY, '1');
    }
  }

  // ── 3. Register Expo push token with backend ─────────────────────────────
  await registerExpoPushToken();
}

async function registerExpoPushToken(): Promise<void> {
  try {
    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ??
      (Constants as any).easConfig?.projectId;

    if (!projectId) {
      console.warn(
        '[Notifications] No EAS projectId in app.json — run `eas init` in mobile/.',
      );
      return;
    }

    const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });
    console.log('[PushToken] token:', token);
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    await registerPushToken(token, Platform.OS as 'ios' | 'android', timezone);
    console.log('[PushToken] registered with backend ok');
  } catch (err: any) {
    console.warn('[PushToken] FAILED:', err?.message ?? err);
  }
}

export function useNotificationSetup(): void {
  useEffect(() => {
    runSetup();
  }, []);
}
