"use client";

import { Text } from "@/components/pieces/content/text";
import { Button } from "@/components/ui/button";
import { formatRetry, useRetryCountdown } from "@/hooks/use-retry-countdown";
import { fill } from "@/lib/format";

type RetryCountdownProps = {
  /** When a new code may be asked for (epoch ms), from `authService.codeRetryAt()`; nothing shows when null. */
  retryAt: number | null;
  copy: { wait: string; ready: string };
  /** OTP-LIMIT: once the wait is over, this button replaces the "ready" line (a new code, not a dead end). */
  ready?: { label: string; busy: boolean; onClick: () => void };
};

/**
 * B7: the time left before a new code may be requested, from the API's `retryAfterSeconds`. A plain line,
 * not a live region (a ticking countdown is never announced, rule 37); the refusal note above it is.
 */
export function RetryCountdown({ retryAt, copy, ready }: RetryCountdownProps) {
  const seconds = useRetryCountdown(retryAt);
  if (seconds === null) return null;
  if (seconds === 0 && ready) {
    return (
      <Button type="button" variant="solid" size="pill" width="full" onClick={ready.onClick} disabled={ready.busy}>
        {ready.label}
      </Button>
    );
  }
  return (
    <Text variant="text14Relaxed" tone="sub">
      {seconds > 0 ? fill(copy.wait, { time: formatRetry(seconds) }) : copy.ready}
    </Text>
  );
}
