import { to } from "@/lib/routes";
import type { Action } from "../types";
import type { StatusSummaryCopy } from "./types";

/**
 * LIKES: who liked the member (no Figma frame; every line is design-silent, for owner approval).
 * Distances are in km, as the API sends them (discovery cards speak miles).
 */
export const likesPage = {
  documentTitle: "Likes received",
  title: "Likes received",
  description: "People who liked your profile. Like them back to start your 48 hours.",
  /** `{km}` is a whole number. */
  distance: "{km} km away",
  verified: "Verified",
  superLike: "Super Like",
  /** `{name}` / `{age}`. */
  nameAge: "{name}, {age}",
  /** Icon buttons' names; `{name}` is the member. */
  pass: "Pass on {name}",
  like: "Like {name}",
  /** The card opens the member's profile. */
  view: "View {name}’s profile",
  /** Announced after a pass; `{name}` is the member. */
  passed: "Passed on {name}.",
  more: "Show more",
  loadingMore: "Loading…",
  listLabel: "People who liked you",
  empty: {
    summary: { icon: "favourite", title: "No new likes yet", description: "When someone likes your profile, they’ll show up here." } satisfies StatusSummaryCopy,
    primary: { label: "Discover people", to: to("DISCOVER") } satisfies Action,
  },
  /** A like back or a pass that didn't go through without an API reason (offline, server error). */
  failed: "That didn’t go through. Try again.",
  /** Paywall mode: the API sends blurred, masked likes. */
  locked: {
    note: "Upgrade to see who likes you and like them back.",
    action: { label: "See plans", to: to("PLANS") } satisfies Action,
    name: "Someone liked you",
  },
  /** The match confirmation reuses MATCH-NEW; only its second action differs. */
  keepBrowsing: "Keep browsing",
  /** Header heart. */
  heart: { label: "Likes received", icon: "favourite", to: to("LIKES") } satisfies Action,
};
