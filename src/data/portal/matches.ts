import { to, toItem, type ScreenCode } from "@/lib/routes";
import type { Action, IconName, ImageAsset } from "../types";
import type { Fact, MemberId, MemberLink, StatusSummaryCopy } from "./types";

const planDate: MemberLink = { label: "Plan a date", step: "VENUES" };

export type MatchTab = "all" | "cancelled" | "complete";

/** A sample active match: the deadline is server-owned; the mock counts down from `minutesLeft`. */
export type MatchSample = {
  member: MemberId;
  /** Minutes left when the session starts; `confirmed` means a date is agreed and the clock stops. */
  minutesLeft: number;
  confirmed?: boolean;
  preview: string;
};

const clock: IconName = "clock-01";
/** Whose photo the cancelled summary shows (Figma reuses Wildflower's; the build shows the member in the meta line). */
const cancelledMember: MemberId = "wildrose";

const venue: ImageAsset = { src: "/images/portal/venue.webp", alt: "Amber & Oak Coffee counter and shelves", width: 720, height: 1080 };

/** W04 / MATCHES, MATCHES-CANCELLED, MATCHES-COMPLETE and MATCHES-EMPTY. */
export const matchesPage = {
  /** Browser tab titles of the three tabs. */
  documentTitles: { all: "Your matches", cancelled: "Cancelled connections", complete: "Completed dates" } satisfies Record<MatchTab, string>,
  title: "Your matches",
  description: "Make a plan while the connection is fresh.",
  tabsLabel: "Match status",
  tabs: [
    { key: "all", label: "All · {count}", to: to("MATCHES") },
    { key: "cancelled", label: "Cancelled", to: to("MATCHES-CANCELLED") },
    { key: "complete", label: "Complete", to: to("MATCHES-COMPLETE") },
  ] satisfies { key: MatchTab; label: string; to: Action["to"] }[],
  matches: [
    { member: "goldenhour", minutesLeft: 42 * 60, preview: "Coffee sounds perfect. Shall we make a plan?" },
    { member: "wildrose", minutesLeft: 84, preview: "Coffee sounds perfect. Shall we make a plan?" },
    { member: "riverstone", minutesLeft: 0, confirmed: true, preview: "Your date is confirmed. View the details or keep chatting." },
  ] satisfies MatchSample[],
  /** Badge copy: `{hours}` / `{minutes}` are the time left. */
  timeLeft: "{hours}h {minutes}m left",
  confirmed: "Date confirmed",
  /** Matches with less than this many minutes left show the urgent badge. */
  urgentMinutes: 120,
  card: {
    /** Message / Open chat open the member's conversation. */
    message: "Message",
    planDate: { label: "Plan date", step: "VENUES" } satisfies MemberLink,
    openChat: "Open chat",
    viewDate: { label: "View date", step: "DATE-PENDING" } satisfies MemberLink,
    /** Opens the match detail (MATCH-EXPIRING / MATCH-EXPIRED) of the card's member. */
    details: { label: "View match details", screen: "MATCH-EXPIRING" } satisfies { label: string; screen: ScreenCode },
  },
  findMore: { label: "Find more connections", to: to("DISCOVER") } satisfies Action,
  /** Live outcomes: `{name}`, then the date's day and venue when known (design-silent; for owner approval). */
  outcome: { meta: "{name}", when: "{meta} · {when}", venue: "{meta} · {venue}", empty: "Nothing here yet." },
  cancelled: {
    photoOf: cancelledMember,
    title: "This plan was cancelled",
    meta: "WildRose · 24 Oct · 4:00 PM",
    description: "Your other connections are still here. You can keep discovering when you’re ready.",
    primary: { label: "Discover someone new", to: to("DISCOVER") } satisfies Action,
  },
  complete: {
    image: venue,
    title: "A real date, completed",
    meta: "You & GoldenHour · Amber & Oak Coffee",
    description: "You both made time to meet. Share how it went and help us make the next date better.",
    primary: { label: "Leave date feedback", to: toItem("FEEDBACK", "goldenhour") } satisfies Action,
    secondary: { label: "View completed date", to: toItem("DATE-COMPLETE", "goldenhour") } satisfies Action,
  },
  empty: {
    title: "Good connections take a first step",
    description: "When you both like each other, your matches will appear here.",
    summary: { icon: "favourite", title: "Start with someone who interests you", description: "A mutual like opens a conversation and your 48-hour window." } satisfies StatusSummaryCopy,
    primary: { label: "Start discovering", to: to("DISCOVER") } satisfies Action,
    /** Asks the service to look for matches (Auto-Matching; design-silent, for owner approval). */
    find: "Find matches for me",
    finding: "Looking for matches…",
  },
};

/** W04 / MATCH-EXPIRING and MATCH-EXPIRED (match detail). */
export const matchDetailPage = {
  /** Browser tab title: `{name}` is the matched member. */
  documentTitle: "Match with {name}",
  back: { label: "Back", icon: "arrow-left-02", to: to("MATCHES") } satisfies Action,
  expiring: {
    title: "A little time. A real possibility.",
    badge: "Expiring soon",
    /** `{name}` is the matched member. */
    description: "Your match with {name} expires soon. Agree on a date before the countdown ends.",
    pairTitle: "Date with {name}",
    image: venue,
    facts: [
      { label: "Where", value: "Amber & Oak Coffee" },
      { label: "When", value: "24 October · 4:00 PM" },
      { label: "Timezone", value: "America/Los_Angeles" },
      { label: "Meeting place", value: "Main entrance · Public café" },
    ] satisfies Fact[],
    /** `{hours}` / `{minutes}` are the live countdown ("01h 24m"). */
    deadline: "{hours}h {minutes}m left to agree on a date",
    primary: planDate,
    /** Opens the member's conversation. */
    secondary: "Open conversation",
  },
  /** More than two hours left (Figma draws only the expiring detail; copy for owner approval). */
  active: { title: "Make a plan while there’s time", description: "You and {name} have time to agree on a date.", label: "Active match" },
  /** A date is agreed (copy for owner approval). */
  confirmed: { title: "Your date is confirmed", description: "You and {name} agreed on a date. Keep chatting before you meet." },
  expired: {
    title: "This match’s time is up",
    description: "A date wasn’t agreed within 48 hours. This conversation is now closed.",
    icon: clock,
    timer: "00:00:00",
    timerLabel: "No time left",
    primary: { label: "Discover new connections", to: to("DISCOVER") } satisfies Action,
    secondary: { label: "Back to matches", to: to("MATCHES") } satisfies Action,
  },
};
