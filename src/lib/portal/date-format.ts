/** Date-only values are `YYYY-MM-DD` strings and times are minutes after midnight, read in UTC so no zone shifts them. */
const at = (iso: string) => new Date(`${iso}T00:00:00Z`);
const format = (iso: string, options: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat("en-GB", { ...options, timeZone: "UTC" }).format(at(iso));

/** "24 October" · "24 Oct" · "24 October 2026" · "Sat 24 Oct" · "October 2026". */
export const formatDay = (iso: string) => format(iso, { day: "numeric", month: "long" });
export const formatDayMonth = (iso: string) => format(iso.slice(0, 10), { day: "numeric", month: "short" });
export const formatFullDay = (iso: string) => format(iso, { day: "numeric", month: "long", year: "numeric" });
export const formatShortDay = (iso: string) => format(iso, { weekday: "short", day: "numeric", month: "short" });
export const formatMonth = (iso: string) => format(iso, { month: "long", year: "numeric" });

/** "4:00 PM". */
export function formatTime(minutes: number) {
  const hours = Math.floor(minutes / 60);
  return `${hours % 12 || 12}:${String(minutes % 60).padStart(2, "0")} ${hours < 12 ? "AM" : "PM"}`;
}

/** Whole calendar days between two instants in the browser's zone (0 = same day). */
function daysBetween(at: number, now: number) {
  const day = (ms: number) => {
    const date = new Date(ms);
    return Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
  };
  return Math.round((day(now) - day(at)) / 86_400_000);
}

/**
 * When a message or notification arrived, in the browser's language and zone: "2:41 PM" today,
 * "Yesterday, 2:41 PM", "Mon, 2:41 PM" within the week, "24 Oct, 2:41 PM" before (with the year
 * when it isn't this one). `withTime: false` keeps only the day part ("Yesterday", "24 Oct").
 */
export function formatStamp(at: number, now = Date.now(), withTime = true) {
  const time = new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" }).format(at);
  const days = daysBetween(at, now);
  if (days <= 0) return time;
  let day: string;
  if (days === 1) {
    const yesterday = new Intl.RelativeTimeFormat(undefined, { numeric: "auto" }).format(-1, "day");
    day = yesterday.charAt(0).toLocaleUpperCase() + yesterday.slice(1);
  } else {
    const sameYear = new Date(at).getFullYear() === new Date(now).getFullYear();
    const options: Intl.DateTimeFormatOptions = days < 7 ? { weekday: "short" } : { day: "numeric", month: "short", ...(sameYear ? {} : { year: "numeric" }) };
    day = new Intl.DateTimeFormat(undefined, options).format(at);
  }
  return withTime ? `${day}, ${time}` : day;
}

/** Today in the browser's calendar, as `YYYY-MM-DD`. */
export function todayIso(now = new Date()) {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

export function addDays(iso: string, days: number) {
  const date = at(iso);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export const isIsoDay = (value: unknown): value is string => typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(at(value).getTime());

/** Whether the date and time have passed (browser time; a real API decides this server-side). */
export function hasPassed(iso: string, minutes: number, now = new Date()) {
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(year, month - 1, day, Math.floor(minutes / 60), minutes % 60) <= now;
}

/** Minutes the zone is ahead of UTC at `utcMs` (an unknown zone is read as UTC). */
function zoneOffset(utcMs: number, timeZone: string) {
  let parts: Intl.DateTimeFormatPart[];
  try {
    parts = new Intl.DateTimeFormat("en-US", { timeZone, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }).formatToParts(utcMs);
  } catch {
    return 0;
  }
  const part = (type: Intl.DateTimeFormatPartTypes) => Number(parts.find((item) => item.type === type)?.value ?? 0);
  const wall = Date.UTC(part("year"), part("month") - 1, part("day"), part("hour") % 24, part("minute"));
  return Math.round((wall - Math.floor(utcMs / 60_000) * 60_000) / 60_000);
}

/** A day and time as read on the wall clock in `timeZone` → the instant, as ISO 8601 (the API's `scheduledAt`). */
export function zonedToIso(day: string, minutes: number, timeZone: string) {
  const [year, month, date] = day.split("-").map(Number);
  const wall = Date.UTC(year, month - 1, date, Math.floor(minutes / 60), minutes % 60);
  let utc = wall - zoneOffset(wall, timeZone) * 60_000;
  // Across a daylight-saving change the first guess can be an hour out.
  utc = wall - zoneOffset(utc, timeZone) * 60_000;
  return new Date(utc).toISOString();
}

/** An instant → its day (`YYYY-MM-DD`) and minutes after midnight on the wall clock in `timeZone`. */
export function isoToZoned(iso: string, timeZone: string) {
  const utc = Date.parse(iso);
  const wall = new Date(utc + zoneOffset(utc, timeZone) * 60_000);
  return { day: wall.toISOString().slice(0, 10), minutes: wall.getUTCHours() * 60 + wall.getUTCMinutes() };
}
