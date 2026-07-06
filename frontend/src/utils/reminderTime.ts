/** Parse "HH:mm" into hour (0-23) and minute (0-59). */
export function parseTimeString(time: string): { hour: number; minute: number } {
  const [h, m] = time.split(':').map((part) => parseInt(part, 10));
  return {
    hour: Number.isFinite(h) ? Math.min(23, Math.max(0, h)) : 8,
    minute: Number.isFinite(m) ? Math.min(59, Math.max(0, m)) : 0,
  };
}

/** Format "HH:mm" (24h) to "8:00 AM" style. */
export function formatTimeDisplay(time: string): string {
  const { hour, minute } = parseTimeString(time);
  const period = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 === 0 ? 12 : hour % 12;
  const minuteStr = minute.toString().padStart(2, '0');
  return `${hour12}:${minuteStr} ${period}`;
}

/** Build "HH:mm" from a Date (uses local hours/minutes). */
export function timeStringFromDate(date: Date): string {
  const hour = date.getHours().toString().padStart(2, '0');
  const minute = date.getMinutes().toString().padStart(2, '0');
  return `${hour}:${minute}`;
}

/** Date object for time picker initial value from "HH:mm". */
export function dateFromTimeString(time: string): Date {
  const { hour, minute } = parseTimeString(time);
  const d = new Date();
  d.setHours(hour, minute, 0, 0);
  return d;
}

/** Sort times chronologically. */
export function sortTimes(times: string[]): string[] {
  return [...times].sort((a, b) => {
    const ta = parseTimeString(a);
    const tb = parseTimeString(b);
    return ta.hour * 60 + ta.minute - (tb.hour * 60 + tb.minute);
  });
}

export const QUICK_TIME_PRESETS = [
  { label: 'Morning', time: '08:00', icon: 'sunny-outline' as const },
  { label: 'Afternoon', time: '14:00', icon: 'partly-sunny-outline' as const },
  { label: 'Evening', time: '20:00', icon: 'moon-outline' as const },
  { label: 'Night', time: '22:00', icon: 'bed-outline' as const },
];

/** How many days ahead Android DATE alarms are pre-scheduled (survives app kill). */
export const ANDROID_SCHEDULE_LOOKAHEAD_DAYS = 35;

/** Re-schedule Android alarms when fewer than this many days remain. */
export const ANDROID_SCHEDULE_REFRESH_DAYS = 7;

export function buildNextOccurrenceDates(
  time: string,
  lookaheadDays: number,
): Date[] {
  const { hour, minute } = parseTimeString(time);
  const results: Date[] = [];
  const now = Date.now();

  for (let offset = 0; offset <= lookaheadDays; offset += 1) {
    const candidate = new Date();
    candidate.setSeconds(0, 0);
    candidate.setHours(hour, minute, 0, 0);
    candidate.setDate(candidate.getDate() + offset);

    if (candidate.getTime() > now) {
      results.push(candidate);
    }
  }

  return results;
}
