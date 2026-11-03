import { isApiError } from "@/lib/api/errors";

/**
 * The reason a service call failed, as the API worded it, for a screen to show: only answers the
 * member can act on (4xx). Network failures, server errors and mock failures give null, and the
 * screen shows its own copy.
 */
export function failureReason(error: unknown): string | null {
  return isApiError(error) && error.status >= 400 && error.status < 500 ? error.message : null;
}
