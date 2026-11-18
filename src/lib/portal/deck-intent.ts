import type { Decision } from "@/data/portal/discover";
import type { MemberId } from "@/data/portal/types";

type Intent = { member: MemberId; decision: Decision };

/** A drag further than this (px) decides: left passes, right likes. */
export const SWIPE_PX = 96;

/** The decision a released drag makes, or null when it stopped short of the threshold. */
export const dragDecision = (offset: number): Decision | null => (Math.abs(offset) < SWIPE_PX ? null : offset < 0 ? "pass" : "like");

/** `POST /discovery/swipes` action for a deck decision. */
export const swipeAction = (decision: Decision) => (decision === "pass" ? "PASS" : decision === "super" ? "SUPER_LIKE" : "LIKE");

/** Load the next page of cards when fewer than this many are left to review. */
export const LOW_WATER = 3;
export const needsNextPage = (unreviewed: number, hasMore: boolean) => hasMore && unreviewed < LOW_WATER;

/** MATCH-NEW shows the match this swipe made, else a background match until it has been dismissed. */
export const matchToShow = (swiped: MemberId | null, unseen: MemberId | null, dismissed: boolean) => swiped ?? (dismissed ? null : unseen);

/** One decision handed from DISCOVER-PROFILE to the page it returns to, in memory, taken once. */
function handoff() {
  let pending: Intent | null = null;
  return {
    set(intent: Intent) {
      pending = intent;
    },
    take(): Intent | null {
      const intent = pending;
      pending = null;
      return intent;
    },
  };
}

/** "Like Wildflower" / "Pass for now" on a profile opened from the deck: the deck plays SWIPE-LIKE / SWIPE-PASS. */
export const deckIntent = handoff();

/** The same on a profile opened from LIKES: LIKES sends the like back or the pass and shows the match. */
export const likesIntent = handoff();
