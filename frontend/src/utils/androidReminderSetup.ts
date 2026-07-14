import { Platform, Linking, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Application from 'expo-application';
import * as IntentLauncher from 'expo-intent-launcher';

const EXACT_ALARM_ACTION = 'android.settings.REQUEST_SCHEDULE_EXACT_ALARM';
const IGNORE_BATTERY_ACTION = 'android.settings.REQUEST_IGNORE_BATTERY_OPTIMIZATIONS';

/** Remembers that we already walked the user through the background-reminder setup. */
const SETUP_PROMPTED_KEY = '@sneheal/androidReminderSetupPrompted';

export function isAndroidReminderDevice(): boolean {
  return Platform.OS === 'android';
}

/** Opens the system screen where user enables "Alarms & reminders" for Sneheal. */
export async function openExactAlarmPermissionSettings(): Promise<void> {
  if (!isAndroidReminderDevice()) return;

  const packageName = Application.applicationId;
  if (!packageName) {
    await Linking.openSettings();
    return;
  }

  try {
    await IntentLauncher.startActivityAsync(EXACT_ALARM_ACTION, {
      data: `package:${packageName}`,
    });
  } catch {
    try {
      await IntentLauncher.startActivityAsync(
        IntentLauncher.ActivityAction.APPLICATION_DETAILS_SETTINGS,
        { data: `package:${packageName}` },
      );
    } catch {
      await Linking.openSettings();
    }
  }
}

/** Opens battery optimization settings so reminders survive app swipe-away on some OEMs. */
export async function openBatteryOptimizationSettings(): Promise<void> {
  if (!isAndroidReminderDevice()) return;

  const packageName = Application.applicationId;
  if (!packageName) {
    await Linking.openSettings();
    return;
  }

  try {
    await IntentLauncher.startActivityAsync(IGNORE_BATTERY_ACTION, {
      data: `package:${packageName}`,
    });
  } catch {
    await openExactAlarmPermissionSettings();
  }
}

export function getAndroidReminderSetupMessage(): string {
  return (
    'For reminders when the app is closed, enable:\n\n' +
    '1. Alarms & reminders → Allow\n' +
    '2. Battery → Unrestricted (recommended on Samsung/Xiaomi/Oppo)\n\n' +
    'Without this, Android may block notifications after you swipe the app away.'
  );
}

export async function promptAndroidReminderSetup(): Promise<void> {
  if (!isAndroidReminderDevice()) return;

  // Only walk the user through system settings once, so adding/editing
  // reminders later never re-triggers the permission prompts.
  try {
    const alreadyPrompted = await AsyncStorage.getItem(SETUP_PROMPTED_KEY);
    if (alreadyPrompted) return;
    await AsyncStorage.setItem(SETUP_PROMPTED_KEY, 'true');
  } catch {
    // If storage fails, fall through and show the prompt this once.
  }

  Alert.alert(
    'Enable background reminders',
    getAndroidReminderSetupMessage(),
    [
      { text: 'Not now', style: 'cancel' },
      {
        text: 'Alarms & reminders',
        onPress: () => void openExactAlarmPermissionSettings(),
      },
      {
        text: 'Battery settings',
        onPress: () => void openBatteryOptimizationSettings(),
      },
    ],
  );
}
