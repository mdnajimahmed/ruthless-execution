import { useEffect } from 'react';
import { Platform, Alert, Linking } from 'react-native';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SETUP_DONE_KEY = 'rex-notif-setup-v1';

async function runSetup(): Promise<void> {
  const already = await AsyncStorage.getItem(SETUP_DONE_KEY);
  if (already) return;

  // 1. Request notification permission (handles POST_NOTIFICATIONS on Android 13+)
  const { status } = await Notifications.requestPermissionsAsync();
  if (status !== 'granted') return;

  if (Platform.OS !== 'android') {
    await AsyncStorage.setItem(SETUP_DONE_KEY, '1');
    return;
  }

  // 2. Battery optimization exemption — most important step for OEM Android
  //    (Samsung, Xiaomi, Huawei, OPPO all kill background alarms without this)
  await new Promise<void>((resolve) => {
    Alert.alert(
      'Keep reminders reliable',
      'To ensure task nudges and timer alerts fire on time even when your phone is idle or the screen is off, please tap "Allow" on the next screen.',
      [
        {
          text: 'Skip',
          style: 'cancel',
          onPress: resolve,
        },
        {
          text: 'Allow',
          onPress: async () => {
            try {
              // Opens "Ignore battery optimizations?" system dialog directly
              await Linking.openURL(
                `android.settings.REQUEST_IGNORE_BATTERY_OPTIMIZATIONS?package=com.turinghatch.rex`,
              );
            } catch {
              // Fallback: open app-info page where user can find battery settings
              await Linking.openSettings();
            }
            resolve();
          },
        },
      ],
    );
  });

  // 3. Exact alarm permission — Android 12+ requires explicit grant for SCHEDULE_EXACT_ALARM
  //    expo-notifications will auto-prompt when scheduling, but we surface it early
  //    so users aren't surprised mid-session.
  await new Promise<void>((resolve) => {
    Alert.alert(
      'Allow exact alarms',
      'To fire nudge alerts at precisely the right time, this app needs the "Alarms & Reminders" permission.',
      [
        { text: 'Later', style: 'cancel', onPress: resolve },
        {
          text: 'Open Settings',
          onPress: async () => {
            try {
              await Linking.openURL('android.settings.REQUEST_SCHEDULE_EXACT_ALARM');
            } catch {
              await Linking.openSettings();
            }
            resolve();
          },
        },
      ],
    );
  });

  await AsyncStorage.setItem(SETUP_DONE_KEY, '1');
}

export function useNotificationSetup(): void {
  useEffect(() => {
    runSetup();
  }, []);
}
