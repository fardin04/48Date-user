import type { MatchTab } from "@/data/portal/matches";
import { planIds, type PlanId } from "@/data/portal/membership";
import { memberIdPattern, memberIds, type MemberId } from "@/data/portal/types";
import { apiEnabled } from "@/lib/api/config";
import { getDiscoverPage, getMatchesPage, getStories } from "@/stores/portal-store";
import { screens, type ScreenCode } from "../routes";

export type PortalArea =
  | "discover"
  | "matches"
  | "chats"
  | "dates"
  | "games"
  | "stories"
  | "profile"
  | "settings"
  | "notifications"
  | "report"
  | "membership";

/** W09 and W10 screens, one URL each, grouped by the area that serves them. */
export const accountScreens = {
  profile: ["PROFILE", "PROFILE-EDIT", "PHOTO-MANAGE", "TRUST", "TRUST-HISTORY", "TRUST-HELP"],
  settings: ["SETTINGS", "ACCOUNT", "NOTIFY-PREFS", "PRIVACY", "BLOCKED", "DELETE-ACCOUNT"],
  notifications: ["NOTIFICATIONS"],
  membership: ["MEMBERSHIP", "PLANS", "PAY-RESTORE", "PAY-CANCEL", "QUOTA"],
} as const satisfies Partial<Record<PortalArea, readonly ScreenCode[]>>;

export type AccountScreen = (typeof accountScreens)[keyof typeof accountScreens][number];

/** One portal URL. Figma states of the same screen (SWIPE-*, MATCH-NEW, …) are client states of its view (rule 32). */
export type PortalView =
  | { kind: "discover" }
  | { kind: "filters" }
  | { kind: "profile"; member: MemberId }
  | { kind: "compat"; member: MemberId }
  | { kind: "matches"; tab: MatchTab }
  | { kind: "match"; member: MemberId }
  | { kind: "inbox" }
  | { kind: "chat"; member: MemberId }
  | { kind: "date"; step: DateStep; member: MemberId }
  | { kind: "game"; member: MemberId }
  | { kind: "stories" }
  | { kind: "story"; id: string }
  | { kind: "storyCreate" }
  | { kind: "storyMine" }
  | { kind: "account"; screen: AccountScreen }
  /** REPORT-DETAIL about a member or a story, or with nothing chosen (from Privacy & safety). */
  | { kind: "report"; subject: string | null }
  /** W10 checkout for one Premium plan (`/membership/checkout/<plan>`). */
  | { kind: "checkout"; plan: PlanId };

/** W06 date-planning steps, each `/dates/<step>/<member>`. */
export const dateSteps = {
  venues: "VENUES",
  place: "VENUE-DETAIL",
  time: "DATE-TIME",
  review: "DATE-REVIEW",
  plan: "DATE-PENDING",
  manage: "DATE-MANAGE",
  feedback: "FEEDBACK",
  complete: "DATE-COMPLETE",
} as const satisfies Record<string, ScreenCode>;

export type DateStep = keyof typeof dateSteps;

const deckMembers = () => getDiscoverPage().deck.map((entry) => entry.member);
const matchMembers = () => getMatchesPage().matches.map((match) => match.member);
/** Every sample member has a conversation URL (COMPAT can say hello to anyone in the deck). */
const chatMembers = () => memberIds;

const roots: Record<PortalArea, string> = {
  discover: screens.DISCOVER,
  matches: screens.MATCHES,
  chats: screens.INBOX,
  dates: "/dates",
  games: screens.GAMES,
  stories: screens.STORIES,
  profile: screens.PROFILE,
  settings: screens.SETTINGS,
  notifications: screens.NOTIFICATIONS,
  report: screens["REPORT-DETAIL"],
  membership: screens.MEMBERSHIP,
};

/** Every view of an area with the screen code that owns its path (items append the member id). */
const viewsOf = (area: PortalArea): { screen: ScreenCode; view: PortalView }[] => {
  if (area === "membership")
    return [
      ...accountScreens.membership.map((screen) => ({ screen, view: { kind: "account" as const, screen } })),
      ...planIds.map((plan) => ({ screen: "PAY-REVIEW" as const, view: { kind: "checkout" as const, plan } })),
    ];
  if (area === "profile" || area === "settings" || area === "notifications")
    return accountScreens[area].map((screen) => ({ screen, view: { kind: "account" as const, screen } }));
  if (area === "report")
    return [null, ...memberIds, ...getStories().map((story) => story.id)].map((subject) => ({ screen: "REPORT-DETAIL" as const, view: { kind: "report" as const, subject } }));
  if (area === "games") return matchMembers().map((member) => ({ screen: "GAMES" as const, view: { kind: "game" as const, member } }));
  if (area === "stories")
    return [
      { screen: "STORIES", view: { kind: "stories" } },
      ...getStories().map((story) => ({ screen: "STORY-DETAIL" as const, view: { kind: "story" as const, id: story.id } })),
      { screen: "STORY-CREATE", view: { kind: "storyCreate" } },
      { screen: "STORY-MINE", view: { kind: "storyMine" } },
    ];
  if (area === "dates")
    return (Object.entries(dateSteps) as [DateStep, ScreenCode][]).flatMap(([step, screen]) =>
      matchMembers().map((member) => ({ screen, view: { kind: "date" as const, step, member } })),
    );
  if (area === "chats")
    return [
      { screen: "INBOX", view: { kind: "inbox" } },
      ...chatMembers().map((member) => ({ screen: "CHAT-01" as const, view: { kind: "chat" as const, member } })),
    ];
  return area === "discover"
    ? [
        { screen: "DISCOVER", view: { kind: "discover" } },
        { screen: "FILTERS", view: { kind: "filters" } },
        ...deckMembers().map((member) => ({ screen: "DISCOVER-PROFILE" as const, view: { kind: "profile" as const, member } })),
        ...deckMembers().map((member) => ({ screen: "COMPAT" as const, view: { kind: "compat" as const, member } })),
      ]
    : [
        { screen: "MATCHES", view: { kind: "matches", tab: "all" } },
        { screen: "MATCHES-CANCELLED", view: { kind: "matches", tab: "cancelled" } },
        { screen: "MATCHES-COMPLETE", view: { kind: "matches", tab: "complete" } },
        ...matchMembers().map((member) => ({ screen: "MATCH-EXPIRING" as const, view: { kind: "match" as const, member } })),
      ];
};

/** Path segments below the area root (`/discover`) for one view. */
function segmentsOf(area: PortalArea, screen: ScreenCode, view: PortalView): string[] {
  const root = roots[area];
  const path = screens[screen].slice(root.length).split("/").filter(Boolean);
  if ("member" in view) return [...path, view.member];
  if (view.kind === "report") return view.subject ? [...path, view.subject] : path;
  if (view.kind === "checkout") return [...path, view.plan];
  return view.kind === "story" ? [...path, view.id] : path;
}

/** A path segment as written, or "" when its escapes are malformed (no pattern accepts ""). */
function decodeSegment(segment: string) {
  try {
    return decodeURIComponent(segment);
  } catch {
    return "";
  }
}

/** Story ids from the API (UUIDs); the samples use short slugs. */
const storyIdPattern = /^[A-Za-z0-9-]{1,64}$/;

/**
 * A member or story page the build didn't prerender (API mode): the last segment must look like a
 * nickname (or a story id) and the rest must be a known item path. The page itself then finds out
 * whether that member or story exists.
 */
function resolveItem(area: PortalArea, segments: string[]): PortalView | null {
  const last = segments.at(-1);
  if (!last) return null;
  const prefix = segments.slice(0, -1).join("/");
  const items = viewsOf(area).filter(({ view }) => "member" in view || view.kind === "story" || (view.kind === "report" && view.subject !== null));
  const template = items.find(({ screen, view }) => segmentsOf(area, screen, view).slice(0, -1).join("/") === prefix)?.view;
  if (!template) return null;
  if (template.kind === "story") return storyIdPattern.test(last) ? { kind: "story", id: last } : null;
  if (template.kind === "report") return memberIdPattern.test(last) || storyIdPattern.test(last) ? { kind: "report", subject: last } : null;
  return "member" in template && memberIdPattern.test(last) ? { ...template, member: last } : null;
}

/** `[[...view]]` param → the view it opens, or null for an unknown path. */
export function resolvePortalView(area: PortalArea, param: string[] | undefined): PortalView | null {
  const wanted = (param ?? []).join("/");
  const listed = viewsOf(area).find(({ screen, view }) => segmentsOf(area, screen, view).join("/") === wanted)?.view;
  if (listed) return listed;
  return apiEnabled ? resolveItem(area, (param ?? []).map(decodeSegment)) : null;
}

/** Every URL of an area, as params for generateStaticParams. */
export const portalViewParams = (area: PortalArea) =>
  viewsOf(area).map(({ screen, view }) => ({ view: segmentsOf(area, screen, view) }));
