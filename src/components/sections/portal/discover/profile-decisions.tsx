"use client";

import { useRouter } from "next/navigation";
import { ActionButton } from "@/components/pieces/actions/action-button";
import { Button } from "@/components/ui/button";
import type { Decision } from "@/data/portal/discover";
import type { MemberId } from "@/data/portal/types";
import { fill } from "@/lib/format";
import { deckIntent } from "@/lib/portal/deck-intent";
import { hrefFor } from "@/lib/routes";
import { getProfilePage } from "@/stores/portal-store";

type ProfileDecisionsProps = { member: MemberId; name: string };

/** "Like {name}" → SWIPE-LIKE and "Pass for now" → SWIPE-PASS on DISCOVER, plus "Adjust filters". */
export function ProfileDecisions({ member, name }: ProfileDecisionsProps) {
  const copy = getProfilePage();
  const router = useRouter();
  const decide = (decision: Decision) => {
    deckIntent.set({ member, decision });
    router.push(hrefFor("DISCOVER"));
  };
  return (
    <div className="flex w-full flex-col gap-3 sm:flex-row sm:flex-wrap">
      <Button type="button" variant="confirm" size="portalPill" width="profileAction" className="max-sm:w-full" onClick={() => decide("like")}>
        {fill(copy.like, { name })}
      </Button>
      <Button type="button" variant="roseOutline" size="portalPill" width="passAction" className="max-sm:w-full" onClick={() => decide("pass")}>
        {copy.pass}
      </Button>
      <ActionButton action={copy.adjustFilters} variant="roseOutline" size="portalPill" width="profileAction" className="max-sm:w-full" />
    </div>
  );
}
