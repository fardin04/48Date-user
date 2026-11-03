import { isServer, QueryClient } from "@tanstack/react-query";
import { apiEnabled } from "./config";
import { clientErrorCodes, isApiError } from "./errors";

/** Fresh time for screen reads: API data is reused for 30s; the local mocks are always re-read. */
const STALE_MS = apiEnabled ? 30_000 : 0;

/** 4xx answers and cancelled requests are final; a dropped connection or a 5xx is tried once more. */
function shouldRetry(failures: number, error: unknown) {
  if (failures >= 1) return false;
  if (!isApiError(error)) return false;
  if (error.code === clientErrorCodes.aborted) return false;
  return error.status === 0 || error.status >= 500;
}

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: STALE_MS,
        gcTime: 5 * 60_000,
        retry: shouldRetry,
        // Live data arrives through the socket or a focused refetch where a screen asks for it.
        refetchOnWindowFocus: false,
      },
      mutations: { retry: false },
    },
  });
}

let browserClient: QueryClient | undefined;

/**
 * The one TanStack Query cache. The browser shares a single client between React and the API
 * modules; the server makes a new one per call so member data is never shared between requests.
 */
export function getQueryClient() {
  if (isServer) return makeQueryClient();
  browserClient ??= makeQueryClient();
  return browserClient;
}
