import type { QueryKey } from "@tanstack/react-query";
import { getQueryClient } from "./query-client";

/**
 * API-module reads through the TanStack Query cache: concurrent calls for the same key share one
 * request, and the value is reused for `staleMs` (the profile card and the profile page read
 * `GET /users/me` once). Screens read through `useLoaded` with keys nested under these, so one
 * `invalidate` after a write refreshes both. Cleared on sign-out.
 */
export function cached<T>(key: QueryKey, staleMs: number, load: () => Promise<T>): Promise<T> {
  return getQueryClient().fetchQuery({ queryKey: key, queryFn: load, staleTime: staleMs });
}

/**
 * Replace a cached value after a write that returned the new state; screens built on it (keys
 * nested below) read again from the fresh value without a request.
 */
export function prime<T>(key: QueryKey, value: T) {
  const client = getQueryClient();
  client.setQueryData(key, value);
  void client.invalidateQueries({ queryKey: key, predicate: (query) => query.queryKey.length > key.length });
}

/** Mark every value under these key prefixes stale; screens showing them read again. */
export function invalidate(...keys: QueryKey[]) {
  const client = getQueryClient();
  for (const queryKey of keys) void client.invalidateQueries({ queryKey });
}

const resets = new Set<() => void>();

/** Session state kept outside the query cache (a deck in progress) registers here to be dropped with it. */
export function onCacheClear(reset: () => void) {
  resets.add(reset);
}

/** Drop everything cached (sign-out, a rejected session). */
export function clearCache() {
  getQueryClient().clear();
  resets.forEach((reset) => reset());
}
