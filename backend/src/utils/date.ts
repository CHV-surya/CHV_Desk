/**
 * Date and working duration utilities strictly aligned with Indian Standard Time (IST)
 */

export const APP_TIMEZONE = 'Asia/Kolkata';

/**
 * Returns the current calendar date in India (Asia/Kolkata) formatted as YYYY-MM-DD.
 * Ensures consistent day-boundary handling even on servers located in UTC or other timezones.
 */
export function getTodayDateString(date: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: APP_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

/**
 * Format a Date object or ISO string to a 12-hour AM/PM string in IST (e.g. "09:15 AM")
 */
export function formatTime12h(date: Date | string | null): string | null {
  if (!date) return null;
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return null;

  return d.toLocaleTimeString('en-US', {
    timeZone: APP_TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

/**
 * Format a Date object to YYYY-MM-DD in IST
 */
export function formatDateIST(date: Date | string | null): string | null {
  if (!date) return null;
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return null;

  return new Intl.DateTimeFormat('en-CA', {
    timeZone: APP_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(d);
}

/**
 * Calculates working minutes and human-readable string between start and end (or current time if still working).
 * Accurately calculates elapsed time across midnight boundaries using absolute epoch milliseconds.
 */
export function calculateWorkingDuration(
  joinTime: Date | string | null,
  endTime: Date | string | null,
  status: 'not_joined' | 'working' | 'completed'
): { minutes: number; formatted: string | null } {
  if (!joinTime || status === 'not_joined') {
    return { minutes: 0, formatted: null };
  }

  const start = typeof joinTime === 'string' ? new Date(joinTime) : joinTime;
  const end =
    status === 'completed' && endTime
      ? typeof endTime === 'string'
        ? new Date(endTime)
        : endTime
      : new Date();

  let diffMs = end.getTime() - start.getTime();
  if (diffMs < 0) diffMs = 0;

  const totalMinutes = Math.floor(diffMs / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  let formatted = '';
  if (hours > 0) {
    formatted = `${hours}h ${String(minutes).padStart(2, '0')}m`;
  } else {
    formatted = `${minutes}m`;
  }

  return {
    minutes: totalMinutes,
    formatted,
  };
}
