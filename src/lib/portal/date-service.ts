import type { CancelReason, FeedbackAnswer, NoShowReason, Venue, VenueId } from "@/data/portal/dates";
import type { MemberId } from "@/data/portal/types";
import { mockDateService } from "@/lib/portal/mocks/mock-date-service";

/**
 * draft → pending (sent) → confirmed / declined; invited (they sent one) → confirmed;
 * confirmed → cancelled. An open invitation whose match window closes is shown as expired.
 */
export type PlanStatus = "draft" | "invited" | "pending" | "confirmed" | "declined" | "cancelled";

export type DatePlan = {
  member: MemberId;
  venue: VenueId;
  /** `YYYY-MM-DD`, or null until chosen. */
  date: string | null;
  /** Minutes after midnight, or null until chosen. */
  time: number | null;
  timezone: string;
  status: PlanStatus;
  /** After the date: the member's answer (waiting for the match, or under review after a no-show). */
  attendance: "waiting" | "review" | null;
  feedback: "submitted" | "skipped" | null;
};

/** Contract the date-planning screens talk to (rule 37). Responses and timing come from the service. */
export type DateService = {
  /** Public places near the shared area; empty when none fit (VENUES-EMPTY). */
  getVenues: (member: MemberId) => Promise<Venue[]>;
  getPlan: (member: MemberId) => Promise<DatePlan>;
  /** Saves the venue, date, time or timezone while the plan is being made. */
  saveDraft: (member: MemberId, change: Partial<Pick<DatePlan, "venue" | "date" | "time" | "timezone">>) => Promise<DatePlan>;
  sendInvitation: (member: MemberId) => Promise<DatePlan>;
  acceptInvitation: (member: MemberId) => Promise<DatePlan>;
  cancel: (member: MemberId, reason: CancelReason, message: string) => Promise<DatePlan>;
  /** ATTENDANCE: met → ATTENDANCE-WAIT; NO-SHOW → ATTENDANCE-REVIEW. */
  recordAttendance: (member: MemberId, answer: { met: true } | { met: false; reason: NoShowReason; details: string }) => Promise<DatePlan>;
  /** null skips feedback. */
  submitFeedback: (member: MemberId, answers: Record<string, FeedbackAnswer> | null) => Promise<DatePlan>;
};

/** Swap this for the real implementation when the date-planning API is available. */
export const dateService: DateService = mockDateService;
