import type { ApiDatePlan } from "@/lib/api/types/dates";
import { hasPassed } from "@/lib/portal/date-format";
import type { DatePlan, PlanStatus } from "@/lib/portal/date-service";

/** API status → plan status. A declined invitation arrives as CANCELLED with `cancelReason` DECLINED. */
export function statusOf(plan: ApiDatePlan | null): PlanStatus {
  if (!plan) return "draft";
  switch (plan.status) {
    case "REQUESTED":
      return plan.canAccept || plan.canDecline ? "invited" : "pending";
    case "SET":
    case "AWAITING_CONFIRMATION":
    case "COMPLETED":
    case "NO_SHOW":
      return "confirmed";
    case "DECLINED":
      return "declined";
    default:
      return plan.cancelReason === "DECLINED" ? "declined" : "cancelled";
  }
}

/** After the date, from the member's own answer: met (waiting), a no-show under review, or not answered (null). */
export function attendanceOf(plan: ApiDatePlan | null): DatePlan["attendance"] {
  if (!plan) return null;
  const mine = plan.myConfirmation;
  if (plan.status === "NO_SHOW" || mine?.attended === false) return "review";
  return mine?.attended || plan.hasRated ? "waiting" : null;
}

export type PlanScreen = "draft" | "expired" | "declined" | "cancelled" | "attendance" | "details";

/** Which `/dates/plan/<member>` state a plan shows; an open invitation whose match window closed is expired. */
export function planScreen(plan: DatePlan, clock: "open" | "expired" | "stopped" | "loading" | string, now = new Date()): PlanScreen {
  if (plan.status === "draft") return "draft";
  const open = plan.status === "pending" || plan.status === "invited";
  if (open && clock === "expired") return "expired";
  if (plan.status === "declined" || plan.status === "cancelled") return plan.status;
  if (plan.status === "confirmed" && plan.date && plan.time !== null && hasPassed(plan.date, plan.time, now)) return "attendance";
  return "details";
}

export type AttendanceSection = "details" | "question" | "wait" | "review";

/** Requirement 7.4: after the date the confirmed details lead; the attendance step follows them. */
export function attendanceSections(attendance: DatePlan["attendance"]): AttendanceSection[] {
  return ["details", attendance === "waiting" ? "wait" : attendance === "review" ? "review" : "question"];
}
