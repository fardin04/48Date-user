import { venueIds, type VenueId } from "@/data/portal/dates";
import { memberIds, type MemberId, type MemberSummary } from "@/data/portal/types";
import { getDatePage, getMember, getMemberCopy, getVenue, getVenues } from "@/stores/portal-store";
import type { DatePlan, DateService, PlanStatus } from "@/lib/portal/date-service";
import { addDays, isIsoDay, todayIso } from "@/lib/portal/date-format";

/**
 * MOCK — stands in for the real date-planning API so every W06 state can be reviewed.
 * Not for production: replace `dateService` in ./date-service.ts.
 *
 * - Samples: GoldenHour has no plan yet, WildRose has invited you for three days ahead (CHAT-INVITE), RiverStone's
 *   date (24 Oct, 4:00 PM) is confirmed and has passed, so it asks about attendance.
 * - A sent invitation is answered after ~6s: WildRose declines (DATE-DECLINED), everyone else accepts.
 * - While offline no places are found (VENUES-EMPTY). Answers are stored in sessionStorage for this
 *   tab only, validated on read; free-text messages are kept only in memory of the call.
 */
const STORAGE_KEY = "48date.mock.dates";
const LATENCY_MS = 700;
const ANSWER_MS = 6000;
const DECLINES: MemberId[] = ["wildrose"];
const STATUSES: PlanStatus[] = ["draft", "invited", "pending", "confirmed", "declined", "cancelled"];
const SAMPLE_DATE = "2026-10-24";
const SAMPLE_TIME = 16 * 60;
const INVITE_IN_DAYS = 3;

/** What the mock stores: the plan without its display details (partner, place), which are looked up. */
type StoredPlan = Omit<DatePlan, "partner" | "place" | "postpone"> & { sentAt?: number };
type Stored = Partial<Record<MemberId, StoredPlan>>;

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null && !Array.isArray(value);

function sample(member: MemberId): StoredPlan {
  const timezone = getDatePage().time.timezones[0];
  const base: StoredPlan = { member, venue: "amber", date: null, time: null, timezone, status: "draft", attendance: null, feedback: null };
  // Invitations are for an upcoming day, so accepting one opens DATE-CONFIRMED.
  if (member === "wildrose") return { ...base, date: addDays(todayIso(), INVITE_IN_DAYS), time: SAMPLE_TIME, status: "invited" };
  if (member === "riverstone") return { ...base, date: SAMPLE_DATE, time: SAMPLE_TIME, status: "confirmed" };
  return base;
}

function validPlan(member: MemberId, value: unknown): StoredPlan | null {
  if (!isRecord(value)) return null;
  const { venue, date, time, timezone, status, attendance, feedback, sentAt } = value;
  if (!venueIds.some((id) => id === venue) || !STATUSES.some((option) => option === status)) return null;
  if (date !== null && !isIsoDay(date)) return null;
  if (time !== null && !(Number.isInteger(time) && (time as number) >= 0 && (time as number) < 24 * 60)) return null;
  if (typeof timezone !== "string" || !getDatePage().time.timezones.includes(timezone)) return null;
  return {
    member,
    venue: venue as VenueId,
    date: date as string | null,
    time: time as number | null,
    timezone,
    status: status as PlanStatus,
    attendance: attendance === "waiting" || attendance === "review" ? attendance : null,
    feedback: feedback === "submitted" || feedback === "skipped" ? feedback : null,
    sentAt: typeof sentAt === "number" ? sentAt : undefined,
  };
}

function read(): Stored {
  try {
    const value: unknown = JSON.parse(sessionStorage.getItem(STORAGE_KEY) ?? "null");
    if (!isRecord(value)) return {};
    const stored: Stored = {};
    for (const member of memberIds) {
      const plan = validPlan(member, value[member]);
      if (plan) stored[member] = plan;
    }
    return stored;
  } catch {
    return {};
  }
}

function save(plan: StoredPlan) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ ...read(), [plan.member]: plan }));
  } catch {
    // Blocked storage: the plan then lasts only for this page.
  }
  return visible(plan);
}

function partnerOf(member: MemberId): MemberSummary {
  const sample = getMember(member);
  return sample
    ? { id: member, name: sample.name, age: sample.age, photo: sample.photo, verified: sample.verified }
    : { id: member, name: member, age: null, photo: getMemberCopy().placeholder, verified: false };
}

/** The plan without the mock's private send time, with its partner and place. */
const visible = (plan: StoredPlan): DatePlan => ({
  member: plan.member,
  partner: partnerOf(plan.member),
  venue: plan.venue,
  place: getVenue(plan.venue),
  date: plan.date,
  time: plan.time,
  timezone: plan.timezone,
  status: plan.status,
  attendance: plan.attendance,
  feedback: plan.feedback,
  postpone: null,
});

/** The stored plan, with a sent invitation answered once the mock response time has passed. */
function current(member: MemberId) {
  const plan: StoredPlan = read()[member] ?? sample(member);
  if (plan.status === "pending" && plan.sentAt && Date.now() - plan.sentAt >= ANSWER_MS) {
    return save({ ...plan, status: DECLINES.includes(member) ? "declined" : "confirmed", sentAt: undefined });
  }
  return plan;
}

const wait = () => new Promise((resolve) => setTimeout(resolve, LATENCY_MS));

const update = (member: MemberId, change: Partial<StoredPlan>) => save({ ...current(member), ...change });

export const mockDateService: DateService = {
  async getVenues() {
    await wait();
    return navigator.onLine ? getVenues() : [];
  },
  async getPlan(member) {
    return visible(current(member));
  },
  async saveDraft(member, change) {
    return update(member, change);
  },
  async sendInvitation(member) {
    await wait();
    return update(member, { status: "pending", sentAt: Date.now(), attendance: null, feedback: null });
  },
  async acceptInvitation(member) {
    await wait();
    return update(member, { status: "confirmed" });
  },
  async cancel(member) {
    await wait();
    return update(member, { status: "cancelled" });
  },
  async recordAttendance(member, answer) {
    await wait();
    return update(member, { attendance: answer.met ? "waiting" : "review" });
  },
  async answerPostpone(member) {
    return visible(current(member));
  },
  async getWeather() {
    return null;
  },
  async submitFeedback(member, answers) {
    await wait();
    return update(member, { feedback: answers ? "submitted" : "skipped" });
  },
};
