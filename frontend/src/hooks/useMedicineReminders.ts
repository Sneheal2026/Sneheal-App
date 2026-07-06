import { useCallback, useEffect, useState } from 'react';
import { Alert, Platform } from 'react-native';
import type { MedicineReminder, ReminderFormData } from '@/types/reminder.types';
import { createReminderId } from '@/types/reminder.types';
import {
  deleteMedicineReminder,
  getMedicineReminders,
  upsertMedicineReminder,
  updateReminderRemainingTablets,
} from '@/services/reminderStorage';
import {
  cancelReminderNotifications,
  ensureAndroidReminderCapabilities,
  getReminderPermissionStatus,
  requestReminderPermissions,
  sendLowStockNotification,
  syncReminderNotifications,
} from '@/services/reminderNotificationService';
import { sortTimes } from '@/utils/reminderTime';

export function useMedicineReminders() {
  const [reminders, setReminders] = useState<MedicineReminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [permissionStatus, setPermissionStatus] = useState<
    'granted' | 'denied' | 'undetermined'
  >('undetermined');

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [all, permission] = await Promise.all([
        getMedicineReminders(),
        getReminderPermissionStatus(),
      ]);
      setReminders(
        all.sort(
          (a, b) =>
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
        ),
      );
      setPermissionStatus(permission);
    } catch {
      setReminders([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const ensurePermissions = useCallback(async (): Promise<boolean> => {
    const granted = await requestReminderPermissions();
    const status = await getReminderPermissionStatus();
    setPermissionStatus(status);
    return granted;
  }, []);

  const addReminder = useCallback(
    async (form: ReminderFormData): Promise<boolean> => {
      const granted = await ensurePermissions();
      if (!granted) {
        Alert.alert(
          'Notifications required',
          'Please allow notifications so Sneheal can remind you to take your medicines on time.',
        );
        return false;
      }

      const now = new Date().toISOString();
      let reminder: MedicineReminder = {
        id: createReminderId(),
        medicineName: form.medicineName.trim(),
        times: sortTimes(form.times),
        dosePerTime: form.dosePerTime,
        totalTablets: form.totalTablets,
        remainingTablets: form.totalTablets,
        enabled: true,
        notificationIds: [],
        createdAt: now,
        updatedAt: now,
      };

      reminder = await syncReminderNotifications(reminder);
      await upsertMedicineReminder(reminder);
      await refresh();

      if (Platform.OS === 'android') {
        await ensureAndroidReminderCapabilities();
      }

      return true;
    },
    [ensurePermissions, refresh],
  );

  const updateReminder = useCallback(
    async (id: string, form: ReminderFormData): Promise<boolean> => {
      const existing = reminders.find((r) => r.id === id);
      if (!existing) return false;

      const granted = await ensurePermissions();
      if (!granted && existing.enabled) {
        Alert.alert(
          'Notifications required',
          'Please allow notifications to keep this reminder active.',
        );
        return false;
      }

      const tabletsUsed = existing.totalTablets - existing.remainingTablets;
      const newTotal = form.totalTablets;
      const newRemaining = Math.max(0, newTotal - tabletsUsed);

      let updated: MedicineReminder = {
        ...existing,
        medicineName: form.medicineName.trim(),
        times: sortTimes(form.times),
        dosePerTime: form.dosePerTime,
        totalTablets: newTotal,
        remainingTablets: newRemaining,
        updatedAt: new Date().toISOString(),
      };

      updated = await syncReminderNotifications(updated);
      await upsertMedicineReminder(updated);
      await refresh();

      if (Platform.OS === 'android' && updated.enabled) {
        await ensureAndroidReminderCapabilities();
      }

      return true;
    },
    [ensurePermissions, reminders, refresh],
  );

  const toggleReminder = useCallback(
    async (id: string, enabled: boolean): Promise<void> => {
      const existing = reminders.find((r) => r.id === id);
      if (!existing) return;

      if (enabled) {
        const granted = await ensurePermissions();
        if (!granted) {
          Alert.alert(
            'Notifications required',
            'Enable notifications to turn this reminder on.',
          );
          return;
        }
      }

      let updated: MedicineReminder = {
        ...existing,
        enabled,
        updatedAt: new Date().toISOString(),
      };

      updated = await syncReminderNotifications(updated);
      await upsertMedicineReminder(updated);
      await refresh();
    },
    [ensurePermissions, reminders, refresh],
  );

  const removeReminder = useCallback(
    async (id: string): Promise<void> => {
      const removed = await deleteMedicineReminder(id);
      if (removed) {
        await cancelReminderNotifications(removed.notificationIds);
      }
      await refresh();
    },
    [refresh],
  );

  const markDoseTaken = useCallback(
    async (id: string): Promise<void> => {
      const existing = reminders.find((r) => r.id === id);
      if (!existing) return;

      const nextRemaining = Math.max(
        0,
        existing.remainingTablets - existing.dosePerTime,
      );

      const updated = await updateReminderRemainingTablets(id, nextRemaining);
      if (!updated) return;

      const dosesPerDay = existing.times.length * existing.dosePerTime;
      const daysLeft =
        dosesPerDay > 0 ? Math.floor(nextRemaining / dosesPerDay) : 0;

      if (nextRemaining > 0 && daysLeft <= 3) {
        await sendLowStockNotification(updated);
      }

      await refresh();
    },
    [reminders, refresh],
  );

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return {
    reminders,
    loading,
    permissionStatus,
    refresh,
    addReminder,
    updateReminder,
    toggleReminder,
    removeReminder,
    markDoseTaken,
    requestPermissions: ensurePermissions,
  };
}
