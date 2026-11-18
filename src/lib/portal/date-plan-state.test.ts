import { describe, expect, it } from "vitest";
import type { ApiDatePlan } from "@/lib/api/types/dates";
import type { DatePlan } from "./date-service";
import { attendanceOf, planScreen, statusOf } from "./date-plan-state";

/** Phase 17: API status → plan view state. */
const api = (fields: Partial<ApiDatePlan>) => ({ status: "SET", canAccept: false, canDecline: false, cancelReason: null, myConfirmation: null, hasRated: false, ...fields }) as ApiDatePlan;

const plan = (fields: Partial<DatePlan>) => ({ status: "confirmed", date: "2026-11-25", time: 16 * 60, attendance: null, ...fields }) as DatePlan;
const now = new Date(2026, 10, 18, 12, 0);

describe("statusOf", () => {
  it("maps every API status", () => {
    expect(statusOf(null)).toBe("draft");
    expect(statusOf(api({ status: "REQUESTED", canAccept: true }))).toBe("invited");
    expect(statusOf(api({ status: "REQUESTED" }))).toBe("pending");
    for (const status of ["SET", "AWAITING_CONFIRMATION", "COMPLETED", "NO_SHOW"] as const) expect(statusOf(api({ status }))).toBe("confirmed");
    expect(statusOf(api({ status: "DECLINED" }))).toBe("declined");
    expect(statusOf(api({ status: "CANCELLED", cancelReason: "DECLINED" }))).toBe("declined");
    expect(statusOf(api({ status: "CANCELLED", cancelReason: "OTHER" }))).toBe("cancelled");
  });
});

describe("planScreen", () => {
  it("shows an open invitation whose match window closed as expired", () => {
    expect(planScreen(plan({ status: "pending" }), "expired", now)).toBe("expired");
    expect(planScreen(plan({ status: "invited" }), "expired", now)).toBe("expired");
    expect(planScreen(plan({ status: "pending" }), "open", now)).toBe("details");
  });

  it("keeps a confirmed date on its details until it has passed, then asks about attendance", () => {
    expect(planScreen(plan({}), "stopped", now)).toBe("details");
    expect(planScreen(plan({ date: "2026-11-17" }), "stopped", now)).toBe("attendance");
    // A confirmed date doesn't expire with the window.
    expect(planScreen(plan({}), "expired", now)).toBe("details");
  });

  it("passes the ended states and the draft through", () => {
    expect(planScreen(plan({ status: "declined" }), "open", now)).toBe("declined");
    expect(planScreen(plan({ status: "cancelled" }), "open", now)).toBe("cancelled");
    expect(planScreen(plan({ status: "draft" }), "open", now)).toBe("draft");
  });
});

describe("attendanceOf", () => {
  it("reads the member's own confirmation", () => {
    expect(attendanceOf(api({ status: "AWAITING_CONFIRMATION" }))).toBeNull();
    expect(attendanceOf(api({ myConfirmation: { attended: true } as ApiDatePlan["myConfirmation"] }))).toBe("waiting");
    expect(attendanceOf(api({ myConfirmation: { attended: false } as ApiDatePlan["myConfirmation"] }))).toBe("review");
    expect(attendanceOf(api({ status: "NO_SHOW" }))).toBe("review");
  });
});
