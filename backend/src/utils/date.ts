/**
 * Date and working duration utilities
 */

export function getTodayDateString(): string {
  // Use YYYY-MM-DD based on local date
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Calculates working minutes and human-readable string between start and end (or current time if still working).
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

/**
 * Format a Date object to a 12-hour AM/PM string (e.g. "09:15 AM")
 */
export function formatTime12h(date: Date | string | null): string | null {
  if (!date) return null;
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return null;

  return d.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

