import { notFunctional, to } from "@/lib/routes";
import type { Action, IconName } from "../types";
import type { SelectOption } from "../onboarding/types";
import type { MemberId, StatusSummaryCopy } from "./types";

const reportProfile = notFunctional("Reporting (REPORT-DETAIL) is not built yet");
const sayHello = notFunctional("Messages (MSG-01) are not built yet");

export type Decision = "pass" | "like" | "super";

/** W04 / DISCOVER and its states (SWIPE-PASS / LIKE / SUPER, DISCOVER-NEXT, MATCH-NEW, DISCOVER-EMPTY, FILTERS-EMPTY). */
export const discoverPage = {
  title: "Discover",
  description: "People nearby. A connection worth showing up for.",
  adjustFilters: { label: "Adjust filters", to: to("FILTERS") } satisfies Action,
  preferences: {
    title: "Your preferences",
    description: "Find your kind of connection nearby.",
    edit: { label: "Edit preferences", to: to("FILTERS") } satisfies Action,
  },
  activeMatches: {
    /** `{count}` is the number of active matches. */
    title: "{count} active matches",
    description: "Keep the conversation moving before the timer ends.",
    action: { label: "View matches", to: to("MATCHES") } satisfies Action,
  },
  card: {
    deckLabel: "Profile to review",
    hint: "Swipe to explore, or use the buttons below.",
    dragHint: "Drag the photo left to pass or right to like.",
    decisions: { pass: "Pass", like: "Like", super: "Super Like" } satisfies Record<Decision, string>,
    feedback: {
      pass: { label: "PASS", icon: "cancel-01" },
      like: { label: "LIKE", icon: "favourite" },
      super: { label: "SUPER LIKE", icon: "star" },
    } satisfies Record<Decision, { label: string; icon: IconName }>,
    /** Announced after a decision. */
    sent: { pass: "Passed. Showing the next profile.", like: "Like sent.", super: "Super Like sent." } satisfies Record<Decision, string>,
  },
  overview: {
    verified: "Verified",
    /** `{percent}` is the member's compatibility. */
    compatibility: "{percent}% compatibility",
    viewProfile: "View full profile",
  },
  beforeConnect: {
    title: "Your connection, your pace",
    description: "A mutual like opens a 48-hour window to agree on a date. Your phone number stays private.",
    report: { label: "Report profile", to: reportProfile } satisfies Action,
  },
  /** Feedback stays on screen this long before the next candidate (handoff: 0.8 s). */
  feedbackMs: 800,
  matchNew: {
    title: "What a match!",
    /** `{name}` is the matched member. */
    description: "You and {name} have 48 hours to agree on a date.",
    timer: "48:00:00",
    timerLabel: "48 hours to agree on a date",
    icon: "favourite" satisfies IconName,
    primary: { label: "Say hello", to: sayHello } satisfies Action,
    secondary: "Keep discovering",
  },
  empty: {
    title: "Your next connection is on its way",
    description: "You’ve seen everyone in your current preferences. Try a wider area or check back later.",
    summary: { icon: "search-01", title: "Your preferences are saved", description: "Try a wider distance or return later to see new people nearby." } satisfies StatusSummaryCopy,
    primary: { label: "Adjust preferences", to: to("FILTERS") } satisfies Action,
    secondary: "Refresh discovery",
  },
  filtersEmpty: {
    title: "No one matches these preferences",
    description: "Try widening your distance or adjusting a preference.",
    summary: { icon: "favourite", title: "Keep the things that matter most", description: "Widen your age range or distance to see more potential connections." } satisfies StatusSummaryCopy,
    primary: { label: "Adjust preferences", to: to("FILTERS") } satisfies Action,
    secondary: "Clear filters",
  },
  /** Candidate order of the sample deck. */
  deck: ["wildflower", "goldenhour"] satisfies MemberId[],
};

const ageOptions = (from: number, to: number): SelectOption[] =>
  Array.from({ length: to - from + 1 }, (_, index) => ({ value: String(from + index), label: String(from + index) }));

/** W04 / FILTERS. */
export const filtersPage = {
  title: "Find your kind of connection",
  description: "Choose what matters. You can always change these later.",
  fields: {
    meet: {
      label: "Who would you like to meet?",
      options: [
        { value: "everyone", label: "Everyone" },
        { value: "women", label: "Women" },
        { value: "men", label: "Men" },
      ],
    },
    distance: {
      label: "Distance",
      options: [
        { value: "5", label: "Within 5 miles" },
        { value: "15", label: "Within 15 miles" },
        { value: "30", label: "Within 30 miles" },
        { value: "50", label: "Within 50 miles" },
      ],
    },
    ageRange: { label: "Age range", min: "Minimum age", max: "Maximum age", options: ageOptions(18, 80) },
    verifiedOnly: "Verified profiles only",
    sharedInterest: "Share one of my interests",
  },
  ageError: "Minimum age must be lower than the maximum age.",
  primary: "Show matches",
  saving: "Saving…",
  reset: "Reset filters",
};

/** W04 / DISCOVER-PROFILE. */
export const profilePage = {
  back: { label: "Back to discovery", to: to("DISCOVER") } satisfies Action,
  title: "Make a real connection",
  notify: {
    title: "Keep up with your connections",
    description: "Choose how to hear about matches, messages and date invitations.",
    action: { label: "Enable notifications", to: to("NOTIFY") } satisfies Action,
  },
  description: "People worth getting to know. A real date starts with one hello.",
  verified: "Verified",
  /** `{distance}` follows the member's area. */
  rows: { compatibility: "Compatibility", trust: "Trust Score", interests: "Interests" },
  note: "Your match starts a 48-hour window to agree on a date.",
  report: { label: "Report profile", to: reportProfile } satisfies Action,
  interestsTitle: "My interests",
  about: { title: "About me", description: "Profile details shared by this member." },
  photos: "More photos",
  /** `{name}` is the member. */
  like: "Like {name}",
  pass: "Pass for now",
  adjustFilters: { label: "Adjust filters", to: to("FILTERS") } satisfies Action,
};

/** W04 / COMPAT and COMPAT-PENDING. */
export const compatPage = {
  title: "Why you could click",
  /** `{name}` is the member. */
  description: "You and {name} have a lot to start with.",
  pair: { title: "You & {name}", description: "Shared interests. Similar intentions." },
  card: { title: "{percent}% compatibility", description: "A conversation starter, not a promise." },
  signals: [
    { label: "Shared interests", value: 92 },
    { label: "Relationship goals", value: 88 },
    { label: "Communication style", value: 86 },
  ],
  highlight: "You both enjoy photography, coffee and thoughtful conversation.",
  primary: "View profile",
  secondary: { label: "Say hello", to: sayHello } satisfies Action,
  pending: {
    title: "Getting to know your preferences",
    description: "Add a little more about yourself so we can make more meaningful suggestions.",
    summary: { icon: "favourite", title: "More to discover", description: "Complete your interests to help us understand what you share." } satisfies StatusSummaryCopy,
    primary: { label: "Complete my preferences", to: to("PERSONALITY") } satisfies Action,
    secondary: { label: "Keep discovering", to: to("DISCOVER") } satisfies Action,
  },
};
