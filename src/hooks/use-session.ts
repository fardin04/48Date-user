import { useSyncExternalStore } from "react";
import { authService } from "@/lib/auth/auth-service";

/** Re-checks when the session ends on its own (the API rejected a refresh). */
const subscribe = (listener: () => void) => authService.onSessionChange(listener);

/** Whether a member is signed in; null while prerendering and hydrating. */
export function useSession(): boolean | null {
  return useSyncExternalStore(subscribe, authService.hasSession, () => null);
}
