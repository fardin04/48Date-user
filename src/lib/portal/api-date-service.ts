import type { FeedbackAnswer, Venue } from "@/data/portal/dates";
import type { MemberId, MemberSummary } from "@/data/portal/types";
import { onCacheClear } from "@/lib/api/cache";
import { isApiError } from "@/lib/api/errors";
import { datesApi } from "@/lib/api/modules/dates-api";
import type { ApiDatePlan, ApiVenue, SendInviteBody, VenueCategory } from "@/lib/api/types/dates";
import { fill } from "@/lib/format";
import { memberPhoto, toSummary } from "@/lib/portal/api-members";
import { findMatch, requireMatch } from "@/lib/portal/api-match-lookup";
import { isIsoDay, isoToZoned, zonedToIso } from "@/lib/portal/date-format";
import type { DatePlan, DateService, PlanStatus } from "@/lib/portal/date-service";
import { getDatePage, getLiveVenueCopy, getMemberCopy } from "@/stores/portal-store";

const DRAFTS_KEY = "48date.dates.drafts";
const CATEGORIES: VenueCategory[] = ["CAFE", "RESTAURANT", "BAR", "PARK", "ACTIVITY"];
/** Pins stay inside the map art (percent of the frame). */
const PIN_MIN = 12;
const PIN_SPAN = 70;

const same = (a: string, b: string) => a.toLowerCase() === b.toLowerCase();
const keyOf = (member: MemberId) => member.toLowerCase();
const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null && !Array.isArray(value);
const text = (value: unknown, max = 300) => (typeof value === "string" ? value.slice(0, max) : null);
const num = (value: unknown) => (typeof value === "number" && Number.isFinite(value) ? value : null);

/** What the invitation needs about a place beyond what the screens show. */
type PlaceDetails = { ref: string | null; runId: string | null; address: string | null; category: string | null; latitude: number | null; longitude: number | null };

/** The plan being made in this tab (the API has no draft): kept in sessionStorage, validated on read. */
type Draft = {
  venue: string | null;
  place: Venue | null;
  details: PlaceDetails | null;
  date: string | null;
  time: number | null;
  timezone: string | null;
  updatedAt: number;
  /** After the date, per plan id: "We met" (waiting), or a no-show sent for review. */
  attendance: Record<string, "waiting" | "review">;
  feedback: Record<string, "submitted" | "skipped">;
  /** Postpone requests this member sent (the API doesn't say who asked). */
  postpones: string[];
};

const emptyDraft = (): Draft => ({ venue: null, place: null, details: null, date: null, time: null, timezone: null, updatedAt: 0, attendance: {}, feedback: {}, postpones: [] });

/** Keeps a finished draft's after-date answers and sent requests. */
const keptOf = (draft: Draft): Draft => ({ ...emptyDraft(), attendance: draft.attendance, feedback: draft.feedback, postpones: draft.postpones });

function validPlace(value: unknown): Venue | null {
  if (!isRecord(value) || !isRecord(value.photo) || !isRecord(value.pin)) return null;
  const name = text(value.name);
  const src = text(value.photo.src, 2000);
  if (!name || !src || !(src.startsWith("/") || /^https?:\/\//.test(src))) return null;
  return {
    id: text(value.id) ?? name,
    name,
    meta: text(value.meta) ?? "",
    highlight: text(value.highlight) ?? "",
    highlightTone: value.highlightTone === "rose" ? "rose" : "success",
    detailMeta: text(value.detailMeta) ?? "",
    description: text(value.description, 1000) ?? "",
    meetingPlace: text(value.meetingPlace) ?? "",
    arrival: text(value.arrival) ?? "",
    photo: { src, alt: text(value.photo.alt) ?? "", width: 720, height: 1080 },
    pin: { left: text(value.pin.left, 8) ?? "50%", top: text(value.pin.top, 8) ?? "50%" },
  };
}

function validDetails(value: unknown): PlaceDetails | null {
  if (!isRecord(value)) return null;
  return {
    ref: text(value.ref),
    runId: text(value.runId),
    address: text(value.address),
    category: text(value.category),
    latitude: num(value.latitude),
    longitude: num(value.longitude),
  };
}

function readDrafts(): Record<string, Draft> {
  try {
    const value: unknown = JSON.parse(sessionStorage.getItem(DRAFTS_KEY) ?? "{}");
    if (!isRecord(value)) return {};
    const drafts: Record<string, Draft> = {};
    for (const [member, raw] of Object.entries(value).slice(0, 50)) {
      if (!isRecord(raw)) continue;
      const time = num(raw.time);
      const states = (input: unknown, allowed: string[]) =>
        Object.fromEntries(Object.entries(isRecord(input) ? input : {}).filter(([, state]) => typeof state === "string" && allowed.includes(state)));
      drafts[member] = {
        venue: text(raw.venue),
        place: validPlace(raw.place),
        details: validDetails(raw.details),
        date: isIsoDay(raw.date) ? raw.date : null,
        time: time !== null && Number.isInteger(time) && time >= 0 && time < 24 * 60 ? time : null,
        timezone: text(raw.timezone, 64),
        updatedAt: num(raw.updatedAt) ?? 0,
        attendance: states(raw.attendance, ["waiting", "review"]) as Draft["attendance"],
        feedback: states(raw.feedback, ["submitted", "skipped"]) as Draft["feedback"],
        postpones: Array.isArray(raw.postpones) ? raw.postpones.filter((id): id is string => typeof id === "string").slice(-20) : [],
      };
    }
    return drafts;
  } catch {
    return {};
  }
}

const readDraft = (member: MemberId) => readDrafts()[keyOf(member)] ?? emptyDraft();

function writeDraft(member: MemberId, draft: Draft) {
  try {
    sessionStorage.setItem(DRAFTS_KEY, JSON.stringify({ ...readDrafts(), [keyOf(member)]: draft }));
  } catch {
    // Blocked storage: the plan being made lasts only for this page.
  }
}

/** Places of the last suggestions run per member, so a chosen id can be turned into a full place. */
const suggested = new Map<string, { runId: string; venues: ApiVenue[]; places: Venue[] }>();
onCacheClear(() => suggested.clear());

function categoryLabel(category: string | null | undefined) {
  const copy = getLiveVenueCopy();
  return (category && copy.categories[category]) || copy.place;
}

function toPlace(venue: ApiVenue, pin: Venue["pin"]): Venue {
  const copy = getLiveVenueCopy();
  const kind = categoryLabel(venue.category);
  const distance = venue.distanceKmFromMe ?? venue.distanceKm ?? null;
  const km = distance === null ? null : fill(copy.distance, { km: distance.toFixed(1) });
  const rating = venue.rating === null ? null : venue.rating.toFixed(1);
  const photo = memberPhoto(venue.name, venue.photoUrl, copy.photoAlt);
  return {
    id: venue.venueRef,
    name: venue.name,
    meta: [kind, copy.public, km].filter(Boolean).join(" · "),
    highlight: venue.isAiPick ? (rating ? fill(copy.aiPick, { rating }) : copy.aiPickOnly) : rating ? fill(copy.rating, { rating }) : "",
    highlightTone: venue.isAiPick ? "rose" : "success",
    detailMeta: [kind, km, copy.midway].filter(Boolean).join(" · "),
    description: venue.address ?? "",
    meetingPlace: venue.address ?? copy.arrival,
    arrival: copy.arrival,
    photo: { ...photo, height: 1080 },
    pin,
  };
}

/** Spreads the places over the map art by their real positions (the art itself is illustrative). */
function pins(venues: ApiVenue[]): Venue["pin"][] {
  const lats = venues.map((venue) => venue.latitude);
  const lngs = venues.map((venue) => venue.longitude);
  const [minLat, maxLat, minLng, maxLng] = [Math.min(...lats), Math.max(...lats), Math.min(...lngs), Math.max(...lngs)];
  const at = (value: number, min: number, max: number) => (max === min ? 50 : PIN_MIN + ((value - min) / (max - min)) * PIN_SPAN);
  return venues.map((venue) => ({ left: `${at(venue.longitude, minLng, maxLng).toFixed(1)}%`, top: `${(100 - at(venue.latitude, minLat, maxLat)).toFixed(1)}%` }));
}

/** The place of a plan the API holds (no suggestions run needed). */
function remotePlace(plan: ApiDatePlan): Venue {
  return toPlace(
    {
      venueRef: `plan:${plan.id}`,
      name: plan.venueName,
      address: plan.venueAddress,
      latitude: plan.venueLatitude ?? 0,
      longitude: plan.venueLongitude ?? 0,
      category: plan.venueCategory ?? "",
      rating: plan.venueRating,
      priceLevel: null,
      photoUrl: plan.venuePhotoRef,
      distanceKm: plan.distanceKmFromMe,
      isAiPick: false,
    },
    { left: "50%", top: "50%" },
  );
}

const defaultTimezone = () => {
  const zones = getDatePage().time.timezones;
  const local = Intl.DateTimeFormat().resolvedOptions().timeZone;
  return zones.includes(local) ? local : zones[0];
};

/** The member's newest plan with this match (the API keeps one open plan per match). */
async function latestPlan(member: MemberId): Promise<ApiDatePlan | null> {
  const { data } = await datesApi.list();
  return (
    data
      .filter((plan) => same(plan.counterpart.nickname, member))
      .sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt))[0] ?? null
  );
}

function statusOf(plan: ApiDatePlan | null): PlanStatus {
  if (!plan) return "draft";
  switch (plan.status) {
    case "REQUESTED":
      return plan.canAccept || plan.canDecline ? "invited" : "pending";
    case "SET":
    case "COMPLETED":
      return "confirmed";
    case "DECLINED":
      return "declined";
    default:
      return "cancelled";
  }
}

function partnerOf(plan: ApiDatePlan | null, fallback: MemberSummary): MemberSummary {
  if (!plan) return fallback;
  const { counterpart } = plan;
  return toSummary({
    nickname: counterpart.nickname,
    age: counterpart.age,
    mainPhotoUrl: counterpart.mainPhotoUrl ?? counterpart.primaryPhotoUrl,
    isVerified: counterpart.isVerified ?? counterpart.verificationStatus === "VERIFIED",
  });
}

async function planFor(member: MemberId): Promise<DatePlan> {
  const [remote, match] = await Promise.all([latestPlan(member), findMatch(member).catch(() => null)]);
  const draft = readDraft(member);
  const fallback = match ? toSummary(match.otherUser) : toSummary({ nickname: member });
  const open = remote !== null && (remote.status === "REQUESTED" || remote.status === "SET" || remote.status === "COMPLETED");
  // A plan being made (a first one, a new time, a plan after a decline) shows the draft's choices.
  const composing = draft.updatedAt > 0 && (!remote || draft.updatedAt > Date.parse(remote.updatedAt));
  const timezone = (composing ? draft.timezone : null) ?? remote?.timeZone ?? draft.timezone ?? defaultTimezone();
  const scheduled = remote ? isoToZoned(remote.scheduledAt, remote.timeZone ?? timezone) : null;
  const status = composing && !open ? "draft" : statusOf(remote);
  const place = (composing ? draft.place : null) ?? (remote ? remotePlace(remote) : (draft.place ?? emptyPlace()));
  const answered = remote ? draft.attendance[remote.id] : undefined;
  const request = remote?.status === "SET" ? remote.pendingPostponeRequest : null;
  const moved = request?.status === "PENDING" && request.newScheduledAt ? isoToZoned(request.newScheduledAt, timezone) : null;
  return {
    member,
    partner: partnerOf(remote, fallback),
    venue: place.id,
    place,
    date: (composing ? draft.date : null) ?? scheduled?.day ?? null,
    time: (composing ? draft.time : null) ?? scheduled?.minutes ?? null,
    timezone,
    status,
    attendance: answered ?? (remote?.hasRated ? "waiting" : null),
    feedback: (remote && draft.feedback[remote.id]) ?? (remote?.hasRated && answered !== "review" ? "submitted" : null),
    postpone: request && moved ? { date: moved.day, time: moved.minutes, mine: draft.postpones.includes(request.id) } : null,
  };
}

/** No place chosen yet: the screens show the first suggestion once VENUES has loaded. */
function emptyPlace(): Venue {
  const copy = getLiveVenueCopy();
  return {
    id: "",
    name: "",
    meta: "",
    highlight: "",
    highlightTone: "success",
    detailMeta: "",
    description: "",
    meetingPlace: "",
    arrival: copy.arrival,
    photo: { ...getMemberCopy().placeholder, height: 1080 },
    pin: { left: "50%", top: "50%" },
  };
}

async function requireRemote(member: MemberId) {
  const remote = await latestPlan(member);
  if (!remote) throw new Error("There is no plan with this member.");
  return remote;
}

const score = (answer: FeedbackAnswer | undefined) => (answer ? getLiveVenueCopy().scores[answer] : undefined);

/**
 * User / 09 - Dates. Places come from the match's suggestions run (cached), plans from the
 * member's date list; the plan being made stays in this tab until it is sent.
 */
export const apiDateService: DateService = {
  async getVenues(member) {
    const match = await requireMatch(member);
    const { data: run } = await datesApi.venues(match.id);
    const ordered = [...run.venues].sort((a, b) => Number(b.isAiPick) - Number(a.isAiPick));
    const positions = pins(ordered);
    const places = ordered.map((venue, index) => toPlace(venue, positions[index]));
    suggested.set(keyOf(member), { runId: run.runId, venues: ordered, places });
    return places;
  },
  getPlan: planFor,
  async saveDraft(member, change) {
    const draft = readDraft(member);
    const next: Draft = { ...draft, updatedAt: Date.now() };
    if (change.venue !== undefined) {
      const run = suggested.get(keyOf(member));
      const index = run?.places.findIndex((place) => place.id === change.venue) ?? -1;
      if (run && index >= 0) {
        const venue = run.venues[index];
        next.venue = change.venue;
        next.place = run.places[index];
        next.details = { ref: venue.venueRef, runId: run.runId, address: venue.address, category: venue.category, latitude: venue.latitude, longitude: venue.longitude };
      }
    }
    if (change.date !== undefined) next.date = change.date;
    if (change.time !== undefined) next.time = change.time;
    if (change.timezone !== undefined) next.timezone = change.timezone;
    // A draft without a place starts from the plan's current one ("Suggest another time").
    if (!next.place) {
      const current = await planFor(member);
      if (current.place.id) {
        next.place = current.place;
        next.venue = current.place.id;
      }
    }
    writeDraft(member, next);
    return planFor(member);
  },
  async sendInvitation(member) {
    const [match, remote] = await Promise.all([requireMatch(member), latestPlan(member)]);
    const draft = readDraft(member);
    const plan = await planFor(member);
    if (!plan.date || plan.time === null || !plan.place.name) throw new Error("Choose a place, a date and a time.");
    const scheduledAt = zonedToIso(plan.date, plan.time, plan.timezone);
    // A confirmed date moves only when the match agrees: ask to postpone it.
    if (remote?.status === "SET" && remote.canPostpone) {
      const { data: request } = await datesApi.postpone(remote.id, scheduledAt, getLiveVenueCopy().postponeReason);
      writeDraft(member, { ...keptOf(draft), postpones: [...draft.postpones, request.id] });
      return planFor(member);
    }
    // One open plan per match: an invitation of ours is withdrawn, one to us declined, before the new one.
    if (remote?.status === "REQUESTED") {
      if (remote.canWithdraw) await datesApi.act(remote.id, "withdraw");
      else if (remote.canDecline) await datesApi.act(remote.id, "decline");
    }
    const details = draft.details;
    const category = CATEGORIES.find((item) => item === details?.category);
    const body: SendInviteBody = {
      scheduledAt,
      venueName: plan.place.name,
      ...(details?.address ? { venueAddress: details.address } : {}),
      ...(category ? { venueCategory: category } : {}),
      ...(details?.ref && !details.ref.startsWith("plan:") ? { venueRef: details.ref } : {}),
      ...(details?.latitude !== null && details?.latitude !== undefined && details.longitude !== null ? { latitude: details.latitude, longitude: details.longitude } : {}),
      ...(details?.runId ? { runId: details.runId } : {}),
    };
    await datesApi.invite(match.id, body);
    writeDraft(member, keptOf(draft));
    return planFor(member);
  },
  async acceptInvitation(member) {
    const remote = await requireRemote(member);
    if (remote.canAccept) await datesApi.act(remote.id, "accept");
    return planFor(member);
  },
  async cancel(member, reason, message) {
    const remote = await requireRemote(member);
    const label = getDatePage().reasonDialog.reasons.find((item) => item.value === reason)?.label ?? reason;
    if (remote.canCancel) await datesApi.cancel(remote.id, label, message || undefined);
    else if (remote.canWithdraw) await datesApi.act(remote.id, "withdraw");
    else if (remote.canDecline) await datesApi.act(remote.id, "decline");
    return planFor(member);
  },
  async recordAttendance(member, answer) {
    const remote = await requireRemote(member);
    const draft = readDraft(member);
    if (!answer.met) {
      const label = getDatePage().noShow.options.find((option) => option.value === answer.reason)?.label ?? answer.reason;
      try {
        await datesApi.rate(remote.id, { showedUp: false, comment: [label, answer.details].filter(Boolean).join(" · ").slice(0, 1000) });
      } catch (error) {
        if (!(isApiError(error) && error.code === "DATE_RATING_DONE")) throw error;
      }
    }
    // "We met" is sent with the feedback (the API takes attendance and ratings together).
    writeDraft(member, { ...draft, attendance: { ...draft.attendance, [remote.id]: answer.met ? "waiting" : "review" } });
    return planFor(member);
  },
  async answerPostpone(member, answer) {
    const remote = await requireRemote(member);
    const request = remote.pendingPostponeRequest;
    if (request?.status === "PENDING") await datesApi.answerPostpone(remote.id, request.id, answer);
    return planFor(member);
  },
  async getWeather(member) {
    const [plan, draft] = [await planFor(member), readDraft(member)];
    const details = draft.details;
    if (!plan.date || !details?.runId || !details.ref || details.ref.startsWith("plan:")) return null;
    try {
      const { data } = await datesApi.weather(details.runId, plan.date, details.ref);
      return { description: data.weatherDescription, min: Math.round(data.temperatureMinC), max: Math.round(data.temperatureMaxC) };
    } catch {
      // A hint only: no weather is shown when the forecast isn't available.
      return null;
    }
  },
  async submitFeedback(member, answers) {
    const remote = await requireRemote(member);
    const draft = readDraft(member);
    try {
      await datesApi.rate(
        remote.id,
        answers
          ? { showedUp: true, overall: score(answers.again), behavior: score(answers.kind), punctuality: score(answers.punctual), safety: score(answers.safe) }
          : { showedUp: true },
      );
    } catch (error) {
      // Rated already (another device), or skipping isn't accepted without stars: the answer stays recorded here.
      if (!(isApiError(error) && (error.code === "DATE_RATING_DONE" || (!answers && error.status === 400)))) throw error;
    }
    writeDraft(member, { ...draft, feedback: { ...draft.feedback, [remote.id]: answers ? "submitted" : "skipped" } });
    return planFor(member);
  },
};
