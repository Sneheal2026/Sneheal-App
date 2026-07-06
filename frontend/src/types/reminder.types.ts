export interface MedicineReminder {
  id: string;
  medicineName: string;
  times: string[];
  dosePerTime: number;
  totalTablets: number;
  remainingTablets: number;
  enabled: boolean;
  notificationIds: string[];
  createdAt: string;
  updatedAt: string;
  /** Android rolling schedule — last calendar day covered by scheduled DATE alarms */
  scheduledUntil?: string;
}

export interface ReminderFormData {
  medicineName: string;
  times: string[];
  dosePerTime: number;
  totalTablets: number;
}

export const createReminderId = (): string =>
  `rem_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
