/**
 * WorkTrack Indian Standard Time (IST) Date and Time Utilities
 * Timezone: Asia/Kolkata (UTC + 05:30)
 */

export const APP_TIMEZONE = 'Asia/Kolkata';

/**
 * Returns the current calendar date in India as YYYY-MM-DD.
 * Handles midnight date boundary correctly regardless of client's local timezone.
 */
export const getFormattedDate = (date: Date = new Date()): string => {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: APP_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
};

/**
 * Returns a past calendar date in India as YYYY-MM-DD
 */
export const getPastDate = (daysAgo: number): string => {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return getFormattedDate(d);
};

/**
 * Returns current Indian Standard Time in 12-hour format with seconds (e.g. "09:15:32 AM")
 */
export const getFormattedTimeIST = (date: Date = new Date()): string => {
  return date.toLocaleTimeString('en-US', {
    timeZone: APP_TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });
};

/**
 * Returns current Indian header date (e.g. "Sat, Nov 1, 2026")
 */
export const getFormattedHeaderDateIST = (date: Date = new Date()): string => {
  return date.toLocaleDateString('en-US', {
    timeZone: APP_TIMEZONE,
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

/**
 * Formats a Date or timestamp string into 12-hour AM/PM in IST (e.g. "09:15 AM")
 */
export const formatTime12hIST = (date: Date | string | null): string | null => {
  if (!date) return null;
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return null;

  return d.toLocaleTimeString('en-US', {
    timeZone: APP_TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
};

