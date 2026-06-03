import { useEffect } from 'react';
import { Platform, Alert, Linking } from 'react-native';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SETUP_DONE_KEY = 'rex-notif-setup-v1';

async function runSetup(): Promise<void> {
  // Check real system permission state first.
  // If already granted we never show any dialog — regardless of AsyncStorage.
  const { status: currentStatus } = await Notifications.getPermissionsAsync();

  if (currentStatus === 'granted') {
    await AsyncStorage.setItem(SETUP_DONE_KEY, '1');
    return;
  }

  // Already walked through setup once (user chose Skip) — don't repeat.
  const already = await AsyncStorage.getItem(SETUP_DONE_KEY);
  if (already) return;

  // First time AND permission not yet granted — request it.
  const { status } = await Notifications.requestPermissionsAsync();
  if (status !== 'granted') {
    await AsyncStorage.setItem(SETUP_DONE_KEY, '1');
    return;
  }

  if (Platform.OS !== 'android') {
    await AsyncStorage.setItem(SETUP_DONE_KEY, '1');
    return;
  }

  // Battery optimization — single one-time ask, no repeat.
  await new Promise<void>((resolve) => {
    Alert.alert(
      'One last thing',
      'Disable battery optimization for this app so nudges fire on time when your screen is off.',
      [
        { text: 'Skip', style: 'cancel', onPress: resolve },
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

  await AsyncStorage.setItem(SETUP_DONE_KEY, '1');
}

export function useNotificationSetup(): void {
  useEffect(() => {
    runSetup();
  }, []);
}
