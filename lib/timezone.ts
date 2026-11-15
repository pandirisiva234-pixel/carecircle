/**
 * Timezone helpers.
 *
 * Serverless platforms (Vercel, Cloud Run) run in UTC, but an elder's medication
 * schedule ("8:00 AM") is always meant in the elder's own local time. Every
 * "today", dose time and reminder calculation therefore goes through these helpers
 * instead of `new Date().toISOString()`.
 */

export const DEFAULT_TIMEZONE = process.env.APP_TIMEZONE || "Asia/Kolkata";

/** Returns YYYY-MM-DD for the given instant in the given timezone. */
export function todayInTz(date: Date = new Date(), timeZone: string = DEFAULT_TIMEZONE): string {
  // en-CA formats dates as YYYY-MM-DD
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

/** Offset of the timezone from UTC (in minutes) at the given instant. Asia/Kolkata → +330. */
export function getTzOffsetMinutes(date: Date, timeZone: string = DEFAULT_TIMEZONE): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(date);

  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value);
  const asUtc = Date.UTC(get("year"), get("month") - 1, get("day"), get("hour"), get("minute"), get("second"));
  return Math.round((asUtc - date.getTime()) / 60000);
}

/**
 * Converts a wall-clock date + time in a timezone to a UTC ISO timestamp.
 * zonedTimeToUtcIso("2026-11-15", "08:00", "Asia/Kolkata") → "2026-11-15T02:30:00.000Z"
 */
export function zonedTimeToUtcIso(
  dateStr: string,
  timeHHmm: string,
  timeZone: string = DEFAULT_TIMEZONE
): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const [hh, mm] = timeHHmm.split(":").map(Number);
  const naiveUtc = Date.UTC(y, m - 1, d, hh, mm, 0);
  // Two passes handle DST transitions correctly for zones that have them.
  let offset = getTzOffsetMinutes(new Date(naiveUtc), timeZone);
  let utcMs = naiveUtc - offset * 60000;
  const offset2 = getTzOffsetMinutes(new Date(utcMs), timeZone);
  if (offset2 !== offset) {
    offset = offset2;
    utcMs = naiveUtc - offset * 60000;
  }
  return new Date(utcMs).toISOString();
}

/** Adds (or subtracts) whole days to a YYYY-MM-DD string. */
export function addDays(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + days));
  return dt.toISOString().slice(0, 10);
}

/** Short weekday label ("Mon") for a YYYY-MM-DD string. */
export function weekdayLabel(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  return ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][new Date(Date.UTC(y, m - 1, d)).getUTCDay()];
}

/**
 * Parses a date-time string. Strings without an explicit offset
 * (e.g. "2026-11-16T10:30" from a datetime-local input) are interpreted
 * in the circle's timezone rather than the server's (UTC) timezone.
 */
export function parseDateTimeInTz(value: string, timeZone: string = DEFAULT_TIMEZONE): Date {
  const hasOffset = /([zZ]|[+-]\d{2}:?\d{2})$/.test(value);
  if (hasOffset) return new Date(value);
  const match = value.match(/^(\d{4}-\d{2}-\d{2})[T ](\d{2}:\d{2})/);
  if (!match) return new Date(value);
  return new Date(zonedTimeToUtcIso(match[1], match[2], timeZone));
}
