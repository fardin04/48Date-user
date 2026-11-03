/**
 * Deadlines are server-owned (rule 37). Responses that carry `serverTime` set the offset between
 * the server's clock and this device's, so a countdown ends when the server says it does even if
 * the device clock is wrong.
 */
let offsetMs = 0;

export function syncServerClock(serverTime: string | undefined) {
  const server = serverTime ? Date.parse(serverTime) : NaN;
  if (Number.isFinite(server)) offsetMs = server - Date.now();
}

/** A server timestamp as this device's epoch milliseconds; null when missing or unreadable. */
export function toLocalTime(iso: string | null | undefined): number | null {
  if (!iso) return null;
  const at = Date.parse(iso);
  return Number.isFinite(at) ? at - offsetMs : null;
}
