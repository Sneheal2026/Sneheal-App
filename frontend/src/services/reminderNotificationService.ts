import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import type { MedicineReminder } from '@/types/reminder.types';
import {
  getMedicineReminders,
  getMedicineReminderById,
  saveMedicineReminders,
  updateReminderRemainingTablets,
} from '@/services/reminderStorage';
import {
  ANDROID_SCHEDULE_LOOKAHEAD_DAYS,
  ANDROID_SCHEDULE_REFRESH_DAYS,
  buildNextOccurrenceDates,
  parseTimeString,
} from '@/utils/reminderTime';
import { promptAndroidReminderSetup } from '@/utils/androidReminderSetup';

export const REMINDER_CHANNEL_ID = 'medicine-reminders';

/** Category that attaches the quick action buttons to reminder notifications. */
export const REMINDER_CATEGORY_ID = 'medicine-reminder-actions';
/** Action button identifiers handled by the response listener. */
export const REMINDER_ACTION_TAKEN = 'REMINDER_MARK_TAKEN';
export const REMINDER_ACTION_SNOOZE = 'REMINDER_SNOOZE';

/** How long to snooze a reminder when the user taps "Remind later". */
const SNOOZE_MINUTES = 10;

let initialized = false;
let categoriesReady = false;

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/**
 * Registers the "Taken" / "Remind later" buttons shown directly on the
 * reminder notification. The buttons run in the background so the user does
 * not have to open the app to update their medicine list.
 */
export async function setupNotificationCategories(): Promise<void> {
  if (categoriesReady) return;

  try {
    await Notifications.setNotificationCategoryAsync(REMINDER_CATEGORY_ID, [
      {
        identifier: REMINDER_ACTION_TAKEN,
        buttonTitle: 'Taken',
        options: {
          opensAppToForeground: false,
        },
      },
      {
        identifier: REMINDER_ACTION_SNOOZE,
        buttonTitle: `Remind in ${SNOOZE_MINUTES} min`,
        options: {
          opensAppToForeground: false,
        },
      },
    ]);
    categoriesReady = true;
  } catch (error) {
    console.warn('[Reminders] Failed to set notification categories:', error);
  }
}

export async function setupAndroidNotificationChannel(): Promise<void> {
  if (Platform.OS !== 'android') return;

  await Notifications.setNotificationChannelAsync(REMINDER_CHANNEL_ID, {
    name: 'Medicine Reminders',
    description: 'Daily reminders to take your medicines on time',
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 250, 150, 250],
    lightColor: '#1A73E8',
    sound: 'default',
    enableVibrate: true,
    showBadge: true,
  });
}

export async function requestReminderPermissions(): Promise<boolean> {
  if (Platform.OS === 'android') {
    await setupAndroidNotificationChannel();
  }

  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;

  const { status } = await Notifications.requestPermissionsAsync({
    ios: {
      allowAlert: true,
      allowBadge: true,
      allowSound: true,
    },
  });

  return status === 'granted';
}

export async function getReminderPermissionStatus(): Promise<
  'granted' | 'denied' | 'undetermined'
> {
  const { status } = await Notifications.getPermissionsAsync();
  if (status === 'granted') return 'granted';
  if (status === 'denied') return 'denied';
  return 'undetermined';
}

function buildNotificationBody(reminder: MedicineReminder): string {
  const doseLabel =
    reminder.dosePerTime === 1
      ? '1 tablet'
      : `${reminder.dosePerTime} tablets`;
  const stock =
    reminder.remainingTablets > 0
      ? ` · ${reminder.remainingTablets} left`
      : '';
  return `Take ${doseLabel} of ${reminder.medicineName}${stock}`;
}

function buildNotificationContent(reminder: MedicineReminder) {
  return {
    title: 'Medicine reminder',
    body: buildNotificationBody(reminder),
    sound: true,
    categoryIdentifier: REMINDER_CATEGORY_ID,
    data: {
      reminderId: reminder.id,
      medicineName: reminder.medicineName,
      dosePerTime: reminder.dosePerTime,
      type: 'medicine_reminder',
    },
    ...(Platform.OS === 'android' && { channelId: REMINDER_CHANNEL_ID }),
  };
}

/** iOS: one repeating daily alarm per time — handled by the OS when app is killed. */
async function scheduleIosDailyNotifications(
  reminder: MedicineReminder,
): Promise<string[]> {
  const ids: string[] = [];

  for (const time of reminder.times) {
    const { hour, minute } = parseTimeString(time);

    try {
      const id = await Notifications.scheduleNotificationAsync({
        content: buildNotificationContent(reminder),
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour,
          minute,
        },
      });
      ids.push(id);
    } catch (error) {
      console.warn(
        `[Reminders] iOS schedule failed for ${reminder.medicineName} at ${time}:`,
        error,
      );
    }
  }

  return ids;
}

/**
 * Android: schedule individual DATE alarms for the next N days.
 * This survives app swipe-away better than a single DAILY trigger when
 * combined with SCHEDULE_EXACT_ALARM / "Alarms & reminders" permission.
 */
async function scheduleAndroidRollingNotifications(
  reminder: MedicineReminder,
): Promise<{ notificationIds: string[]; scheduledUntil?: string }> {
  const ids: string[] = [];
  let latestDate: Date | null = null;

  for (const time of reminder.times) {
    const dates = buildNextOccurrenceDates(time, ANDROID_SCHEDULE_LOOKAHEAD_DAYS);

    for (const date of dates) {
      try {
        const id = await Notifications.scheduleNotificationAsync({
          content: buildNotificationContent(reminder),
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DATE,
            date,
          },
        });
        ids.push(id);
        if (!latestDate || date > latestDate) {
          latestDate = date;
        }
      } catch (error) {
        console.warn(
          `[Reminders] Android schedule failed for ${reminder.medicineName} at ${date.toISOString()}:`,
          error,
        );
      }
    }
  }

  return {
    notificationIds: ids,
    scheduledUntil: latestDate?.toISOString(),
  };
}

export async function scheduleReminderNotifications(
  reminder: MedicineReminder,
): Promise<{ notificationIds: string[]; scheduledUntil?: string }> {
  if (Platform.OS === 'android') {
    return scheduleAndroidRollingNotifications(reminder);
  }

  const notificationIds = await scheduleIosDailyNotifications(reminder);
  return { notificationIds };
}

export async function cancelReminderNotifications(
  notificationIds: string[],
): Promise<void> {
  await Promise.all(
    notificationIds.map((id) =>
      Notifications.cancelScheduledNotificationAsync(id).catch(() => undefined),
    ),
  );
}

function needsAndroidScheduleRefresh(reminder: MedicineReminder): boolean {
  if (!reminder.scheduledUntil) return true;

  const until = new Date(reminder.scheduledUntil);
  const refreshBy = new Date();
  refreshBy.setDate(refreshBy.getDate() + ANDROID_SCHEDULE_REFRESH_DAYS);

  return until < refreshBy;
}

function isReminderScheduleHealthy(
  reminder: MedicineReminder,
  scheduledIds: Set<string>,
): boolean {
  if (!reminder.enabled || reminder.times.length === 0) {
    return reminder.notificationIds.length === 0;
  }

  if (reminder.notificationIds.length === 0) {
    return false;
  }

  const activeIds = reminder.notificationIds.filter((id) => scheduledIds.has(id));
  if (activeIds.length === 0) {
    return false;
  }

  if (Platform.OS === 'android') {
    return !needsAndroidScheduleRefresh(reminder);
  }

  return (
    reminder.notificationIds.length === reminder.times.length &&
    reminder.notificationIds.every((id) => scheduledIds.has(id))
  );
}

export async function syncReminderNotifications(
  reminder: MedicineReminder,
): Promise<MedicineReminder> {
  await cancelReminderNotifications(reminder.notificationIds);

  if (!reminder.enabled || reminder.times.length === 0) {
    return { ...reminder, notificationIds: [], scheduledUntil: undefined };
  }

  const permission = await getReminderPermissionStatus();
  if (permission !== 'granted') {
    return { ...reminder, notificationIds: [], scheduledUntil: undefined };
  }

  const { notificationIds, scheduledUntil } = await scheduleReminderNotifications(
    reminder,
  );

  return {
    ...reminder,
    notificationIds,
    scheduledUntil,
  };
}

export async function rescheduleAllReminders(): Promise<void> {
  const permission = await getReminderPermissionStatus();
  if (permission !== 'granted') return;

  const reminders = await getMedicineReminders();
  if (reminders.length === 0) return;

  let scheduledIds = new Set<string>();
  try {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    scheduledIds = new Set(scheduled.map((entry) => entry.identifier));
  } catch (error) {
    console.warn('[Reminders] Could not read scheduled notifications:', error);
  }

  const updated: MedicineReminder[] = [];
  let changed = false;

  for (const reminder of reminders) {
    if (isReminderScheduleHealthy(reminder, scheduledIds)) {
      updated.push(reminder);
      continue;
    }

    try {
      const synced = await syncReminderNotifications(reminder);
      updated.push(synced);
      changed = true;
    } catch (error) {
      console.warn(
        `[Reminders] Failed to repair schedule for ${reminder.medicineName}:`,
        error,
      );
      updated.push(reminder);
    }
  }

  if (changed) {
    await saveMedicineReminders(updated);
  }
}

export async function initializeReminderNotifications(): Promise<void> {
  if (initialized) return;
  initialized = true;

  await setupAndroidNotificationChannel();
  await setupNotificationCategories();

  const isExpoGo = Constants.appOwnership === 'expo';
  if (isExpoGo) {
    console.info(
      '[Reminders] Local notifications require a development or production build. Expo Go has limited support.',
    );
  }
}

/** Call after user grants notification permission on Android. */
export async function ensureAndroidReminderCapabilities(): Promise<void> {
  if (Platform.OS !== 'android') return;
  await promptAndroidReminderSetup();
}

export async function sendLowStockNotification(
  reminder: MedicineReminder,
): Promise<void> {
  const permission = await getReminderPermissionStatus();
  if (permission !== 'granted') return;

  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Running low on medicine',
        body: `Only ${reminder.remainingTablets} ${reminder.medicineName} left. Consider reordering soon.`,
        sound: true,
        data: { reminderId: reminder.id, type: 'low_stock' },
        ...(Platform.OS === 'android' && { channelId: REMINDER_CHANNEL_ID }),
      },
      trigger: null,
    });
  } catch (error) {
    console.warn('[Reminders] Failed to send low-stock notification:', error);
  }
}

/**
 * Applies a "dose taken" straight from the notification action: decrements the
 * remaining tablets in storage (so the in-app list reflects it) and sends a
 * low-stock notification when supply is running out. Runs without opening the app.
 */
export async function markDoseTakenFromNotification(
  reminderId: string,
): Promise<void> {
  const reminder = await getMedicineReminderById(reminderId);
  if (!reminder) return;

  const nextRemaining = Math.max(
    0,
    reminder.remainingTablets - reminder.dosePerTime,
  );

  const updated = await updateReminderRemainingTablets(reminderId, nextRemaining);
  if (!updated) return;

  const dosesPerDay = reminder.times.length * reminder.dosePerTime;
  const daysLeft =
    dosesPerDay > 0 ? Math.floor(nextRemaining / dosesPerDay) : 0;

  if (nextRemaining > 0 && daysLeft <= 3) {
    await sendLowStockNotification(updated);
  }
}

/** Re-fires the reminder after a short delay when the user taps "Remind later". */
export async function snoozeReminderFromNotification(
  reminderId: string,
): Promise<void> {
  const reminder = await getMedicineReminderById(reminderId);
  if (!reminder) return;

  const permission = await getReminderPermissionStatus();
  if (permission !== 'granted') return;

  try {
    await Notifications.scheduleNotificationAsync({
      content: buildNotificationContent(reminder),
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: SNOOZE_MINUTES * 60,
      },
    });
  } catch (error) {
    console.warn('[Reminders] Failed to snooze reminder:', error);
  }
}

/**
 * Handles a tap on one of the notification action buttons. Registered once at
 * app start so it also catches actions that happened while the app was closed.
 */
export function addReminderActionListener(): Notifications.Subscription {
  return Notifications.addNotificationResponseReceivedListener((response) => {
    const data = response.notification.request.content.data as
      | { reminderId?: string; type?: string }
      | undefined;

    if (!data?.reminderId || data.type !== 'medicine_reminder') return;

    const reminderId = String(data.reminderId);

    void (async () => {
      if (response.actionIdentifier === REMINDER_ACTION_TAKEN) {
        await markDoseTakenFromNotification(reminderId);
      } else if (response.actionIdentifier === REMINDER_ACTION_SNOOZE) {
        await snoozeReminderFromNotification(reminderId);
      }
    })();
  });
}

export async function getScheduledReminderCount(): Promise<number> {
  try {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    return scheduled.length;
  } catch {
    return 0;
  }
}
