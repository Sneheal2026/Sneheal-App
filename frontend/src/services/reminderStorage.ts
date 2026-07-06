import AsyncStorage from '@react-native-async-storage/async-storage';
import type { MedicineReminder } from '@/types/reminder.types';

const REMINDERS_KEY = '@sneheal/medicineReminders';

const parseReminders = (raw: string | null): MedicineReminder[] => {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export const getMedicineReminders = async (): Promise<MedicineReminder[]> => {
  const raw = await AsyncStorage.getItem(REMINDERS_KEY);
  return parseReminders(raw);
};

export const saveMedicineReminders = async (
  reminders: MedicineReminder[],
): Promise<void> => {
  await AsyncStorage.setItem(REMINDERS_KEY, JSON.stringify(reminders));
};

export const upsertMedicineReminder = async (
  reminder: MedicineReminder,
): Promise<MedicineReminder> => {
  const existing = await getMedicineReminders();
  const index = existing.findIndex((r) => r.id === reminder.id);

  if (index >= 0) {
    existing[index] = reminder;
  } else {
    existing.push(reminder);
  }

  await saveMedicineReminders(existing);
  return reminder;
};

export const deleteMedicineReminder = async (id: string): Promise<MedicineReminder | null> => {
  const existing = await getMedicineReminders();
  const removed = existing.find((r) => r.id === id) ?? null;
  const filtered = existing.filter((r) => r.id !== id);
  await saveMedicineReminders(filtered);
  return removed;
};

export const getMedicineReminderById = async (
  id: string,
): Promise<MedicineReminder | null> => {
  const all = await getMedicineReminders();
  return all.find((r) => r.id === id) ?? null;
};

export const updateReminderRemainingTablets = async (
  id: string,
  remainingTablets: number,
): Promise<MedicineReminder | null> => {
  const all = await getMedicineReminders();
  const index = all.findIndex((r) => r.id === id);
  if (index < 0) return null;

  all[index] = {
    ...all[index],
    remainingTablets: Math.max(0, remainingTablets),
    updatedAt: new Date().toISOString(),
  };

  await saveMedicineReminders(all);
  return all[index];
};
