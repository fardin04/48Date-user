import { distanceValues, isSampleMember, type MemberId, type MemberSummary, type Preferences } from "@/data/portal/types";
import { getDiscoverPage, getFiltersPage, getMatchesPage, getMember } from "@/stores/portal-store";
import type { Match, MatchOutcome, PortalService } from "@/lib/portal/portal-service";

/**
 * MOCK — stands in for the real portal API so every W04 state can be reviewed.
 * Not for production: replace `portalService` in ./portal-service.ts.
 *
 * - Preferences filter the sample deck (Wildflower, then GoldenHour) by who to meet, age,
 *   distance and verification; "Share one of my interests" is kept but not applied.
 * - A like or Super Like on GoldenHour is mutual (MATCH-NEW); every other decision is not.
 * - The three sample matches count down from when this tab first opened the portal.
 * - State lives in sessionStorage for this tab only and is validated on read.
 */
const STORAGE_KEY = "48date.mock.portal";
const SAVE_MS = 600;
const MINUTE_MS = 60_000;
const MUTUAL: MemberId[] = ["goldenhour"];

type MockState = { preferences: Preferences; decided: MemberId[]; startedAt: number };

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isAge = (value: unknown): value is number => {
  const { min, max } = getFiltersPage().ageLimits;
  return Number.isInteger(value) && (value as number) >= min && (value as number) <= max;
};

/** Untrusted preferences → valid preferences, or null. */
function validPreferences(value: unknown): Preferences | null {
  if (!isRecord(value)) return null;
  const { meet, distance, minAge, maxAge, verifiedOnly, sharedInterest } = value;
  const meets = getFiltersPage().fields.meet.options.map((option) => option.value);
  if (!meets.some((option) => option === meet)) return null;
  if (!distanceValues.some((option) => option === distance)) return null;
  if (!isAge(minAge) || !isAge(maxAge) || minAge > maxAge) return null;
  if (typeof verifiedOnly !== "boolean" || typeof sharedInterest !== "boolean") return null;
  return { meet: meet as Preferences["meet"], distance: distance as Preferences["distance"], minAge, maxAge, verifiedOnly, sharedInterest };
}

function read(): MockState {
  const fresh: MockState = { preferences: getFiltersPage().defaults, decided: [], startedAt: Date.now() };
  try {
    const value: unknown = JSON.parse(sessionStorage.getItem(STORAGE_KEY) ?? "null");
    if (!isRecord(value)) return write(fresh);
    const decided = Array.isArray(value.decided) ? value.decided.filter((id): id is MemberId => typeof id === "string" && isSampleMember(id)) : [];
    const startedAt = typeof value.startedAt === "number" && value.startedAt <= Date.now() ? value.startedAt : fresh.startedAt;
    return { preferences: validPreferences(value.preferences) ?? fresh.preferences, decided, startedAt };
  } catch {
    return fresh;
  }
}

function write(state: MockState) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Blocked storage: the portal then resets on every page.
  }
  return state;
}

function fits(member: MemberId, preferences: Preferences) {
  const profile = getMember(member);
  if (!profile) return false;
  const miles = preferences.distance === "any" ? Infinity : Number(preferences.distance);
  const gender = preferences.meet === "everyone" || (preferences.meet === "women" ? profile.gender === "woman" : profile.gender === "man");
  return (
    gender &&
    profile.age >= preferences.minAge &&
    profile.age <= preferences.maxAge &&
    (profile.distanceMiles ?? 0) <= miles &&
    (!preferences.verifiedOnly || profile.verified)
  );
}

/** A sample member as a list row. */
function summaryOf(member: MemberId): MemberSummary {
  const profile = getMember(member) ?? getMember("goldenhour")!;
  return { id: member, name: profile.name, age: profile.age, photo: profile.photo, verified: profile.verified };
}

function matchesFor(state: MockState): Match[] {
  return getMatchesPage().matches.map((sample) => ({
    member: sample.member,
    summary: summaryOf(sample.member),
    preview: sample.preview,
    confirmed: sample.confirmed === true,
    expiresAt: sample.confirmed ? null : state.startedAt + sample.minutesLeft * MINUTE_MS,
  }));
}

const isOpen = (match: Match) => match.expiresAt === null || match.expiresAt > Date.now();

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const mockPortalService: PortalService = {
  async getPreferences() {
    return read().preferences;
  },
  async savePreferences(preferences) {
    const valid = validPreferences(preferences);
    if (!valid) throw new Error("Invalid preferences");
    await wait(SAVE_MS);
    write({ ...read(), preferences: valid });
  },
  async resetPreferences() {
    const { defaults } = getFiltersPage();
    write({ ...read(), preferences: defaults });
    return defaults;
  },
  async getDeck() {
    const state = read();
    const fitting = getDiscoverPage().deck.map((entry) => entry.member).filter((member) => fits(member, state.preferences));
    return { remaining: fitting.filter((member) => !state.decided.includes(member)), fitting: fitting.length };
  },
  async decide(member, decision) {
    const state = read();
    if (!state.decided.includes(member)) write({ ...state, decided: [...state.decided, member] });
    return { matched: decision !== "pass" && MUTUAL.includes(member) };
  },
  async refreshDeck() {
    write({ ...read(), decided: [] });
  },
  async getMatches() {
    return matchesFor(read()).filter(isOpen);
  },
  async getMatch(member) {
    return matchesFor(read()).find((match) => match.member === member) ?? null;
  },
  async getMember(member) {
    return getMember(member) ?? null;
  },
  async getActiveCount() {
    return matchesFor(read()).filter(isOpen).length;
  },
  async getOutcomes(tab) {
    const { cancelled, complete } = getMatchesPage();
    // The samples: the plan WildRose cancelled, the date with GoldenHour.
    const outcome: MatchOutcome =
      tab === "cancelled"
        ? { member: cancelled.photoOf, summary: summaryOf(cancelled.photoOf), meta: cancelled.meta, image: summaryOf(cancelled.photoOf).photo }
        : { member: "goldenhour", summary: summaryOf("goldenhour"), meta: complete.meta, image: complete.image };
    return [outcome];
  },
  async getUnseenMatch() {
    return null;
  },
  async markMatchSeen() {},
  async findMatches() {},
};
