/** Fills `{name}`-style placeholders in data copy. Unknown keys are left as written. */
export function fill(template: string, values: Record<string, string | number>) {
  return template.replace(/\{(\w+)\}/g, (match, key: string) => (key in values ? String(values[key]) : match));
}

const MINUTE_MS = 60_000;

/** Whole hours and minutes left until `deadline` ("1" / "01" hours, "24" minutes); zero once it has passed. */
export function timeLeft(deadline: number, now: number) {
  const total = Math.max(0, Math.floor((deadline - now) / MINUTE_MS));
  const hours = Math.floor(total / 60);
  const pad = (value: number) => String(value).padStart(2, "0");
  return { totalMinutes: total, hours: String(hours), paddedHours: pad(hours), minutes: pad(total % 60) };
}

/** Waits `ms`, or rejects as soon as `signal` aborts (chained waits never overlap). */
export function pause(ms: number, signal: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    if (signal.aborted) return reject(new DOMException("Stopped", "AbortError"));
    const timer = setTimeout(resolve, ms);
    signal.addEventListener(
      "abort",
      () => {
        clearTimeout(timer);
        reject(new DOMException("Stopped", "AbortError"));
      },
      { once: true },
    );
  });
}
