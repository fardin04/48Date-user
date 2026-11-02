import { useQuery, type QueryKey } from "@tanstack/react-query";

type LoadOptions<T> = {
  /** False holds the read (e.g. until an id is known). */
  enabled?: boolean;
  /** Reads again on this interval while the screen is open (chained by TanStack, never overlapping); a function decides from the last value. */
  refetchInterval?: number | false | ((value: T | undefined) => number | false);
  /** Read again when the tab regains focus (lists that change while the member is away). */
  refetchOnWindowFocus?: boolean;
};

/**
 * Reads a value from a service on the client through TanStack Query. Every screen reading the same
 * `key` shares one request and one cached value; keys nest under `cacheKeys` (lib/api/modules) so
 * the writes that invalidate them refresh the screen. `value` is undefined until the first read
 * settles (or when it failed: then `error` is set); `reload` reads again while the last value stays
 * on screen. `load` receives a signal that aborts when nothing needs the read any more.
 */
export function useLoaded<T>(key: QueryKey, load: (signal: AbortSignal) => Promise<T>, options: LoadOptions<T> = {}) {
  const interval = options.refetchInterval;
  const query = useQuery({
    queryKey: key,
    queryFn: ({ signal }) => load(signal),
    enabled: options.enabled,
    refetchInterval: typeof interval === "function" ? (query) => interval(query.state.data) : interval,
    refetchOnWindowFocus: options.refetchOnWindowFocus,
  });

  return {
    value: query.data,
    error: query.error ?? undefined,
    loading: query.isPending && query.fetchStatus !== "idle",
    reload: () => query.refetch().then(() => undefined),
  };
}
