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
