import type { MemberId } from "@/data/portal/types";
import { timeLeft } from "@/lib/format";
import { portalService } from "@/lib/portal/portal-service";
import { useLoaded } from "@/hooks/use-loaded";
import { useNow } from "@/hooks/use-now";

export type MatchClock =
  | { status: "loading" }
  /** Not a match (an older conversation): no window. */
  | { status: "none" }
  | { status: "agreed" }
  | { status: "expired" }
  | { status: "open"; left: ReturnType<typeof timeLeft> };

/** A conversation's 48-hour window, counting down to the service's deadline (rule 37). */
export function useMatchClock(member: MemberId): MatchClock {
  const match = useLoaded(() => portalService.getMatch(member)).value;
  const now = useNow();
  if (match === undefined || now === null) return { status: "loading" };
  if (!match) return { status: "none" };
  if (match.expiresAt === null) return { status: "agreed" };
  if (match.expiresAt <= now) return { status: "expired" };
  return { status: "open", left: timeLeft(match.expiresAt, now) };
}
