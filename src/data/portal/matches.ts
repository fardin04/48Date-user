import { notFunctional, to } from "@/lib/routes";
import type { Action, IconName, ImageAsset } from "../types";
import type { Fact, MemberId, StatusSummaryCopy } from "./types";

const openChat = notFunctional("Chats (CHAT-01) are not built yet");
const planDate = notFunctional("Venues and date planning (VENUES) are not built yet");

export type MatchTab = "all" | "cancelled" | "complete";

/** A sample active match: the deadline is server-owned; the mock counts down from `hoursLeft`. */
export type MatchSample = {
  member: MemberId;
  /** Hours left when the session starts; 0 hours with `confirmed` means a date is agreed. */
  minutesLeft: number;
  confirmed?: boolean;
  preview: string;
};

const venue: ImageAsset = { src: "/images/portal/venue.webp", alt: "Amber & Oak Coffee counter and shelves", width: 720, height: 1080 };

/** W04 / MATCHES, MATCHES-CANCELLED, MATCHES-COMPLETE and MATCHES-EMPTY. */
export const matchesPage = {
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
    message: { label: "Message", to: openChat } satisfies Action,
    planDate: { label: "Plan date", to: planDate } satisfies Action,
    openChat: { label: "Open chat", to: openChat } satisfies Action,
    viewDate: { label: "View date", to: notFunctional("Date details (DATE-DETAIL) are not built yet") } satisfies Action,
    details: "View match details",
  },
  findMore: { label: "Find more connections", to: to("DISCOVER") } satisfies Action,
  cancelled: {
    member: "wildrose" satisfies MemberId,
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
    primary: { label: "Leave date feedback", to: notFunctional("Date feedback (FEEDBACK) is not built yet") } satisfies Action,
    secondary: { label: "View completed date", to: notFunctional("Completed date (DATE-COMPLETE) is not built yet") } satisfies Action,
  },
  empty: {
    title: "Good connections take a first step",
    description: "When you both like each other, your matches will appear here.",
    summary: { icon: "favourite", title: "Start with someone who interests you", description: "A mutual like opens a conversation and your 48-hour window." } satisfies StatusSummaryCopy,
    primary: { label: "Start discovering", to: to("DISCOVER") } satisfies Action,
  },
};

/** W04 / MATCH-EXPIRING and MATCH-EXPIRED (match detail). */
export const matchDetailPage = {
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
    /** `{time}` is the live countdown ("01h 24m"). */
    deadline: "{time} left to agree on a date",
    primary: { label: "Plan a date", to: planDate } satisfies Action,
    secondary: { label: "Open conversation", to: openChat } satisfies Action,
  },
  active: { title: "Make a plan while there’s time", badge: "{hours}h {minutes}m left" },
  expired: {
    title: "This match’s time is up",
    description: "A date wasn’t agreed within 48 hours. This conversation is now closed.",
    icon: "clock-01" satisfies IconName,
    timer: "00:00:00",
    timerLabel: "No time left",
    primary: { label: "Discover new connections", to: to("DISCOVER") } satisfies Action,
    secondary: { label: "Back to matches", to: to("MATCHES") } satisfies Action,
  },
};
