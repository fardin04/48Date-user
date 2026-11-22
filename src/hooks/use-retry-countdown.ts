import { useNow } from "@/hooks/use-now";

/** Whole seconds left until `retryAt` (epoch ms), ticking once a second: 0 once it has passed, null when unknown (or hydrating). */
export function useRetryCountdown(retryAt: number | null): number | null {
  const now = useNow();
  if (retryAt === null || now === null) return null;
  return Math.max(0, Math.ceil((retryAt - now) / 1000));
}

const pad = (value: number) => String(value).padStart(2, "0");

/** "0:42", "59:00", "1:00:00", "23:59:59" for a code-request countdown (daily limits run for hours). */
export function formatRetry(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const rest = seconds % 60;
  return hours > 0 ? `${hours}:${pad(minutes)}:${pad(rest)}` : `${minutes}:${pad(rest)}`;
}
