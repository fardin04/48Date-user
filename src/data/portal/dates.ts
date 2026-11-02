import { to } from "@/lib/routes";
import type { Action, IconName, ImageAsset } from "../types";
import type { StatusSummaryCopy } from "./types";

/** The sample places (mocks). */
export const venueIds = ["amber", "garden", "lumen"] as const;
/** A sample id with the mocks; the API's `venueRef` (or the plan's own place) with the API. */
export type VenueId = string;

/** A suggested public place (W06 VENUES). Distances are approximate; no home location is shown. */
export type Venue = {
  id: VenueId;
  name: string;
  /** "Café · Public · 0.6 km" on the list card. */
  meta: string;
  /** "4.8 · AI pick" — the rose line marks the AI pick, the green line a quality. */
  highlight: string;
  highlightTone: "rose" | "success";
  /** VENUE-DETAIL card line ("Café · 0.6 km · Midway"). */
  detailMeta: string;
  description: string;
  meetingPlace: string;
  arrival: string;
  photo: ImageAsset;
  /** Pin position on the 672×492 map art (percent of the frame). */
  pin: { left: string; top: string };
};

const photo = (name: string, alt: string): ImageAsset => ({ src: `/images/portal/${name}.webp`, alt, width: 720, height: 1080 });
const calendar: IconName = "calendar-03";
const pin: IconName = "location-01";
const clock: IconName = "clock-01";
const shield: IconName = "shield-01";
const heart: IconName = "favourite";

/** Garden and Lumen copy beyond the list card is design-silent (Figma reuses Amber & Oak's); for owner approval. */
export const venues: Venue[] = [
  {
    id: "amber",
    name: "Amber & Oak Coffee",
    meta: "Café · Public · 0.6 km",
    highlight: "4.8 · AI pick",
    highlightTone: "rose",
    detailMeta: "Café · 0.6 km · Midway",
    description: "A relaxed café with indoor seating and an easy-to-find entrance. Check current opening hours before you go.",
    meetingPlace: "Main entrance · Public café",
    arrival: "Meet at the main entrance",
    photo: photo("venue", "Amber & Oak Coffee counter and shelves"),
    pin: { left: "13.4%", top: "22.4%" },
  },
  {
    id: "garden",
    name: "The Garden Bistro",
    meta: "Restaurant · Public · 1.1 km",
    highlight: "4.7 · Good for conversation",
    highlightTone: "success",
    detailMeta: "Restaurant · 1.1 km · Midway",
    description: "A calm garden restaurant with outdoor tables and staff on hand. Check current opening hours before you go.",
    meetingPlace: "Garden gate · Public restaurant",
    arrival: "Meet at the garden gate",
    photo: photo("garden", "The Garden Bistro courtyard with plants and tables"),
    pin: { left: "53.6%", top: "44.7%" },
  },
  {
    id: "lumen",
    name: "Lumen Wine Bar",
    meta: "Public venue · 1.4 km",
    highlight: "4.6 · Relaxed atmosphere",
    highlightTone: "success",
    detailMeta: "Wine bar · 1.4 km · Midway",
    description: "A warm, softly lit bar with table seating near the entrance. Check current opening hours before you go.",
    meetingPlace: "Front entrance · Public bar",
    arrival: "Meet at the front entrance",
    photo: photo("lumen", "Lumen Wine Bar counter in warm light"),
    pin: { left: "31.3%", top: "71.1%" },
  },
];

export type FeedbackAnswer = "positive" | "better";
export type CancelReason = "plans" | "unwell" | "notMeeting" | "safety";
export type NoShowReason = "noArrival" | "couldNotMake" | "couldNotFind" | "other";

/** W06 / Date Planning & Feedback. `{name}` is the match, `{venue}` the chosen place. */
/** Places and plans from the API (design-silent; for owner approval). */
export const liveVenueCopy = {
  categories: { CAFE: "Café", RESTAURANT: "Restaurant", BAR: "Bar", PARK: "Park", ACTIVITY: "Activity" } as Record<string, string>,
  place: "Place",
  public: "Public",
  distance: "{km} km",
  midway: "Midway",
  rating: "{rating}",
  aiPick: "{rating} · AI pick",
  aiPickOnly: "AI pick",
  arrival: "Meet at the entrance",
  photoAlt: "{name}",
  /** Sent with "Suggest another time" on a confirmed date (the API asks for a reason). */
  postponeReason: "Suggested a new time",
  /** Sent with feedback ratings: positive and "could have been better" on the API's 1–5 scale. */
  scores: { positive: 5, better: 2 },
};

export const datePage = {
  /** A plan action the service rejected or couldn't reach (design-silent; for owner approval). */
  failed: "That didn’t go through. Check your connection and try again.",
  documentTitles: {
    venues: "A date that works for both",
    place: "Place details",
    time: "Choose a date & time",
    review: "Review your invitation",
    plan: "Your date with {name}",
    manage: "Manage your date",
    feedback: "How was your date?",
    complete: "A real date, completed",
  },
  back: { label: "Back", icon: "arrow-left-02" } satisfies Omit<Action, "to">,
  venues: {
    title: "A date that works for both",
    description: "Public places picked around your locations and shared interests.",
    recommendation: { title: "A coffee date, picked around both of you", description: "You and {name} both enjoy coffee. Start with a public spot near your shared area." },
    map: { src: "/images/portal/map.webp", alt: "Map of the shared area with three suggested places", width: 512, height: 512 } satisfies ImageAsset,
    mapNote: "Approximate area · Your home locations are not shown",
    listLabel: "Suggested public places",
    view: "View place",
    changeArea: { label: "Change area", to: to("LOCATION") } satisfies Action,
    empty: {
      title: "Let’s try a different area",
      description: "We couldn’t find suitable public places within your current area.",
      summary: { icon: pin, title: "Choose a nearby area", description: "Look for a public meeting place that works for both of you." } satisfies StatusSummaryCopy,
      changeArea: { label: "Change area", to: to("LOCATION") } satisfies Action,
      retry: "Try again",
    },
  },
  place: {
    description: "A relaxed public spot to turn a conversation into a connection.",
    rows: { arrival: "Suggested arrival", privacy: "Privacy", privacyValue: "Exact home locations hidden" },
    choose: "Choose this place",
    others: "See other places",
  },
  time: {
    title: "Choose a date & time",
    description: "Find a moment that works for both of you.",
    suggestedLabel: "Suggested days",
    fields: { date: "Date", time: "Time", timezone: "Timezone" },
    placeholders: { date: "Choose a date", time: "Choose a time" },
    required: "Choose a date and a time.",
    pastError: "Choose a date from today onwards.",
    primary: "Review invitation",
    /** TIME-PICKER opens on 4:00 PM, as drawn. */
    defaultTime: 16 * 60,
    timezones: ["America/Los_Angeles", "America/New_York", "Europe/London", "Asia/Dhaka"],
    /** Half-hour slots offered by TIME-PICKER (Figma draws 3:00–5:00 PM). */
    slots: { from: 10 * 60, to: 21 * 60, step: 30 },
    datePicker: {
      title: "Choose your date",
      description: "Your date’s local timezone: {timezone}.",
      previous: "Previous month",
      next: "Next month",
      weekdays: ["MO", "TU", "WE", "TH", "FR", "SA", "SU"],
      primary: "Use selected date",
      close: "Close",
    },
    timePicker: { title: "Choose your time", description: "{timezone} · {date}", primary: "Use {time}", legend: "Available times", close: "Close" },
  },
  review: {
    title: "Review your invitation",
    badge: "Ready to send",
    description: "Send {name} a plan they can say yes to.",
    send: "Send invitation",
    sending: "Sending…",
    edit: "Edit plan",
  },
  member: { title: "Date with {name}", feedbackLine: "Your date · {date}" },
  rows: { where: "Where", when: "When", timezone: "Timezone", meeting: "Meeting place" },
  pending: {
    title: "Invitation sent",
    badge: "Awaiting response",
    description: "Waiting for {name} to respond. Your match timer is still running.",
    status: "Awaiting response",
    change: "Change invitation",
  },
  invited: {
    title: "You’re invited",
    description: "{name} suggested a plan. Accept it or suggest another time.",
    status: "Invitation received",
    accept: "Accept invitation",
    suggest: "Suggest another time",
  },
  confirmed: {
    title: "Your date is set",
    badge: "Confirmed",
    description: "You and {name} agreed on the plan. Your match countdown is paused.",
    status: "Confirmed",
    manage: "Change or cancel",
  },
  /** A request to move a confirmed date (design-silent; for owner approval). */
  postpone: {
    theirs: "{name} asked to move your date to {when}.",
    mine: "You asked to move the date to {when}. Waiting for {name}.",
    accept: "Accept new time",
    decline: "Keep original time",
    withdraw: "Withdraw request",
  },
  /** Weather on DATE-REVIEW (design-silent). */
  weather: { label: "Weather", value: "{description} · {min}–{max}°C" },
  manage: {
    title: "Manage your date",
    description: "Keep {name} in the loop if your plans change.",
    suggest: "Suggest another time",
    cancel: "Cancel date",
  },
  cancelDialog: {
    title: "Cancel this date?",
    description: "Let {name} know so they aren’t left waiting.",
    reason: "Reason",
    message: "Optional message",
    messagePlaceholder: "I’m sorry, I need to cancel our plan.",
    messageMax: 500,
    confirm: "Cancel date",
    cancelling: "Cancelling…",
    keep: "Keep date",
    close: "Close",
  },
  reasonDialog: {
    title: "Why are you cancelling?",
    description: "Let your date know that your plans changed.",
    legend: "Cancellation reason",
    reasons: [
      { value: "plans", label: "My plans changed" },
      { value: "unwell", label: "I’m feeling unwell" },
      { value: "notMeeting", label: "I no longer want to meet" },
      { value: "safety", label: "A safety concern" },
    ] satisfies { value: CancelReason; label: string }[],
    confirm: "Use this reason",
    keep: "Keep my date",
    close: "Close",
  },
  cancelled: {
    title: "Date cancelled",
    description: "{name} has been notified. You can return to your matches.",
    summary: { icon: calendar, title: "The plan has been cancelled", description: "Your match can see the update. Message them if you want to make another plan." } satisfies StatusSummaryCopy,
    primary: { label: "Back to matches", to: to("MATCHES") } satisfies Action,
  },
  declined: {
    title: "A different plan might work",
    description: "{name} declined this invitation. You can suggest another plan while your match is active.",
    summary: { icon: calendar, title: "There’s room for another plan", description: "Ask your match which place or time would work better." } satisfies StatusSummaryCopy,
    primary: "Suggest another date",
    secondary: "Back to conversation",
  },
  expired: {
    title: "This invitation has expired",
    description: "The match’s 48-hour window ended before the invitation was accepted.",
    summary: { icon: clock, title: "A fresh invitation starts a new plan", description: "Check in with your match before choosing another time." } satisfies StatusSummaryCopy,
    primary: { label: "Discover new connections", to: to("DISCOVER") } satisfies Action,
  },
  attendance: {
    title: "Did you meet {name}?",
    description: "Confirm what happened so we can keep date history accurate.",
    legend: "Did you meet?",
    choices: { met: "Yes, we met", missed: "No, we didn’t meet" },
    met: "We met",
    missed: "We didn’t meet",
  },
  attendanceWait: {
    title: "Your confirmation is saved",
    badge: "Awaiting both responses",
    description: "You confirmed that you met. We’re waiting for {name}’s response.",
    summary: { icon: calendar, title: "Your response is recorded", description: "We’re waiting for your match’s response before updating attendance." } satisfies StatusSummaryCopy,
    feedback: "Leave feedback",
    matches: { label: "Back to matches", to: to("MATCHES") } satisfies Action,
  },
  noShow: {
    title: "Tell us what happened",
    description: "We’ll review conflicting responses before making a trust adjustment.",
    what: "What happened?",
    whatPlaceholder: "Choose what happened",
    /** Figma has no option list; a starter list for owner approval. */
    options: [
      { value: "noArrival", label: "My match didn’t arrive" },
      { value: "couldNotMake", label: "I couldn’t make it" },
      { value: "couldNotFind", label: "We couldn’t find each other" },
      { value: "other", label: "Something else happened" },
    ] satisfies { value: NoShowReason; label: string }[],
    whatRequired: "Choose what happened.",
    details: "Additional details",
    detailsMax: 500,
    submit: "Submit response",
    submitting: "Sending…",
    back: "Back",
  },
  attendanceReview: {
    title: "Your response is under review",
    description: "The attendance responses don’t agree. No final trust adjustment is shown while this is reviewed.",
    summary: { icon: shield, title: "Review in progress", description: "Your Trust Score will not receive a final attendance adjustment during review." } satisfies StatusSummaryCopy,
    primary: { label: "Back to matches", to: to("MATCHES") } satisfies Action,
  },
  feedback: {
    title: "How was your date?",
    description: "Share respectful feedback about your experience with {name}.",
    questions: [
      { id: "kind", title: "Respectful & kind" },
      { id: "punctual", title: "Punctuality" },
      { id: "safe", title: "Felt safe & comfortable" },
      { id: "again", title: "Would you meet again?" },
    ],
    answers: { positive: "Positive experience", better: "Could have been better" } satisfies Record<FeedbackAnswer, string>,
    required: "Answer each question, or skip feedback.",
    submit: "Submit feedback",
    submitting: "Saving…",
    skip: "Skip feedback",
  },
  feedbackDone: {
    title: "Thank you for showing up",
    description: "Your feedback has been saved. Thoughtful responses help build a respectful community.",
    summary: { icon: heart, title: "Your feedback is saved", description: "Thank you for helping make real dates better for everyone." } satisfies StatusSummaryCopy,
    primary: "View completed date",
  },
  complete: {
    title: "A real date, completed",
    badge: "Completed",
    description: "You and {name} both confirmed that you met.",
    status: "Completed",
    chat: "Keep the conversation going",
    story: { label: "Share your story", to: to("STORY-CREATE") } satisfies Action,
  },
  context: {
    title: "A plan for two",
    description: "Choose the details together.",
    match: "Your match",
    venue: "Venue",
    meeting: "Meeting point",
    chat: "Open conversation",
  },
  conversation: "Back to conversation",
};
