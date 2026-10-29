/**
 * Request sharing for GETs: concurrent calls for the same key share one request, and a value can
 * be kept for a short time so screens that need the same data (the profile card and the profile
 * page) don't fetch it twice. Cleared on sign-out; writes invalidate the keys they change.
 */
type Entry = { value: unknown; expires: number };

const values = new Map<string, Entry>();
const inflight = new Map<string, Promise<unknown>>();

export function shared<T>(key: string, ttlMs: number, load: () => Promise<T>): Promise<T> {
  const hit = values.get(key);
  if (hit && hit.expires > Date.now()) return Promise.resolve(hit.value as T);
  const running = inflight.get(key);
  if (running) return running as Promise<T>;
  const request = load()
    .then((value) => {
      if (ttlMs > 0) values.set(key, { value, expires: Date.now() + ttlMs });
      return value;
    })
    .finally(() => inflight.delete(key));
  inflight.set(key, request);
  return request;
}

/** Replace a cached value after a write that returned the new state. */
export function prime<T>(key: string, value: T, ttlMs: number) {
  values.set(key, { value, expires: Date.now() + ttlMs });
}

/** Drop cached values whose key starts with any prefix (every key when none is given). */
export function invalidate(...prefixes: string[]) {
  for (const key of values.keys()) {
    if (prefixes.length === 0 || prefixes.some((prefix) => key.startsWith(prefix))) values.delete(key);
  }
}
