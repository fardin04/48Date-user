import { useSyncExternalStore } from "react";

const SECOND_MS = 1000;

function subscribe(listener: () => void) {
  const timer = setInterval(listener, SECOND_MS);
  return () => clearInterval(timer);
}

/** Stable within a second, so React sees one snapshot per tick. */
const snapshot = () => Math.floor(Date.now() / SECOND_MS) * SECOND_MS;

/** The current time, ticking once a second; null while prerendering and hydrating. */
export function useNow(): number | null {
  return useSyncExternalStore(subscribe, snapshot, () => null);
}
