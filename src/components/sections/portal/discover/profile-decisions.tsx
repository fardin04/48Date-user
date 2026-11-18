"use client";

import { useRouter } from "next/navigation";
import { ActionButton } from "@/components/pieces/actions/action-button";
import { Button } from "@/components/ui/button";
import type { Decision } from "@/data/portal/discover";
import type { MemberId } from "@/data/portal/types";
import { fill } from "@/lib/format";
import { deckIntent, likesIntent } from "@/lib/portal/deck-intent";
import { readTrail } from "@/lib/navigation/nav-trail";
import { hrefFor } from "@/lib/routes";
import { replaceRoute } from "@/lib/navigation/replace-route";
import { cn } from "@/lib/cn";
import { layout } from "@/lib/control-sizes";
import { getProfilePage } from "@/stores/portal-store";

type ProfileDecisionsProps = { member: MemberId; name: string };

/**
 * "Like {name}" → SWIPE-LIKE and "Pass for now" → SWIPE-PASS on DISCOVER (or, opened from LIKES, the
 * like back / pass there), plus "Adjust filters". The page replaces the profile, so Back can't reopen a
 * decided profile (rule 51).
 */
export function ProfileDecisions({ member, name }: ProfileDecisionsProps) {
  const copy = getProfilePage();
  const router = useRouter();
  const decide = (decision: Decision) => {
    // Opened from LIKES (the previous page of this tab): LIKES likes back or passes through its own endpoints.
    const fromLikes = readTrail().at(-2) === hrefFor("LIKES");
    (fromLikes ? likesIntent : deckIntent).set({ member, decision });
    replaceRoute(router, hrefFor(fromLikes ? "LIKES" : "DISCOVER"));
  };
  return (
    <div className="flex w-full flex-col gap-3 sm:flex-row sm:flex-wrap">
      {/* Like / Pass pinned above the tab bar below 1024px and side by side on phones, so they show at 200–400 % (rule 49). */}
      <div className={cn("flex w-full gap-3 sm:w-auto", layout.stickyActions)}>
        <Button type="button" variant="confirm" size="portalPill" width="profileAction" className="max-sm:flex-1" onClick={() => decide("like")}>
          {fill(copy.like, { name })}
        </Button>
        <Button type="button" variant="roseOutline" size="portalPill" width="passAction" className="max-sm:flex-1" onClick={() => decide("pass")}>
          {copy.pass}
        </Button>
      </div>
      <ActionButton action={copy.adjustFilters} variant="roseOutline" size="portalPill" width="profileAction" className="max-sm:w-full" />
    </div>
  );
}
