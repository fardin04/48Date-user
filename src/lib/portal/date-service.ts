import type { CancelReason, FeedbackAnswer, NoShowReason, Venue, VenueId } from "@/data/portal/dates";
import type { MemberId, MemberSummary } from "@/data/portal/types";
import { apiEnabled } from "@/lib/api/config";
import { apiDateService } from "@/lib/portal/api-date-service";
import { mockDateService } from "@/lib/portal/mocks/mock-date-service";

/**
 * draft → pending (sent) → confirmed / declined; invited (they sent one) → confirmed;
 * confirmed → cancelled. An open invitation whose match window closes is shown as expired.
 */
export type PlanStatus = "draft" | "invited" | "pending" | "confirmed" | "declined" | "cancelled";

export type DatePlan = {
  member: MemberId;
  /** Who the date is with. */
  partner: MemberSummary;
  venue: VenueId;
  /** The chosen place, as the plan screens show it. */
  place: Venue;
  /** `YYYY-MM-DD`, or null until chosen. */
  date: string | null;
  /** Minutes after midnight, or null until chosen. */
  time: number | null;
  timezone: string;
  status: PlanStatus;
  /** After the date: the member's answer (waiting for the match, or under review after a no-show). */
  attendance: "waiting" | "review" | null;
  feedback: "submitted" | "skipped" | null;
  /** A pending request to move a confirmed date: its new day and time, and who asked. */
  postpone: { date: string; time: number; mine: boolean } | null;
};

/** Contract the date-planning screens talk to (rule 37). Responses and timing come from the service. */
export type DateService = {
  /** Public places near the shared area; empty when none fit (VENUES-EMPTY). */
  getVenues: (member: MemberId) => Promise<Venue[]>;
  getPlan: (member: MemberId) => Promise<DatePlan>;
  /** Saves the venue, date, time or timezone while the plan is being made. */
  saveDraft: (member: MemberId, change: Partial<Pick<DatePlan, "venue" | "date" | "time" | "timezone">>) => Promise<DatePlan>;
  /** Sends the plan (replacing an open invitation, or asking to move a confirmed date). */
  sendInvitation: (member: MemberId) => Promise<DatePlan>;
  acceptInvitation: (member: MemberId) => Promise<DatePlan>;
  cancel: (member: MemberId, reason: CancelReason, message: string) => Promise<DatePlan>;
  /** ATTENDANCE: met → ATTENDANCE-WAIT; NO-SHOW → ATTENDANCE-REVIEW. */
  recordAttendance: (member: MemberId, answer: { met: true } | { met: false; reason: NoShowReason; details: string }) => Promise<DatePlan>;
  /** null skips feedback. */
  submitFeedback: (member: MemberId, answers: Record<string, FeedbackAnswer> | null) => Promise<DatePlan>;
  /** Accept or decline the match's request to move the date; withdraw one's own. */
  answerPostpone: (member: MemberId, answer: "accept" | "decline" | "withdraw") => Promise<DatePlan>;
  /** A weather hint for the chosen place and day ("Mainly clear · 14–22°C"), or null. */
  getWeather: (member: MemberId) => Promise<{ description: string; min: number; max: number } | null>;
};

/** The API (`NEXT_PUBLIC_API_BASE_URL` set) or the marked mock. */
export const dateService: DateService = apiEnabled ? apiDateService : mockDateService;
