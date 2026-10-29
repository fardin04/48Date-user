import type { Decision } from "@/data/portal/discover";
import type { MemberId } from "@/data/portal/types";

type Intent = { member: MemberId; decision: Decision };

let pending: Intent | null = null;

/**
 * A decision made on DISCOVER-PROFILE ("Like Wildflower", "Pass for now"). It is handed to the
 * discovery deck in memory so the deck plays the matching SWIPE-LIKE / SWIPE-PASS feedback.
 */
export const deckIntent = {
  set(intent: Intent) {
    pending = intent;
  },
  take(): Intent | null {
    const intent = pending;
    pending = null;
    return intent;
  },
};
