import { describe, expect, it } from "vitest";
import { decideVerification, fromSnapshot } from "@/lib/onboarding/api-onboarding-service";

describe("selfie review result: decided vs still in review", () => {
  it("maps attempt statuses (case-insensitive); an unknown status reads as still in review", () => {
    for (const status of ["QUEUED", "PROCESSING", "MANUAL_REVIEW", "NEEDS_REVIEW", "PENDING", "queued", "SOMETHING_NEW"]) expect(fromSnapshot({ status }).status, status).toBe("pending");
    for (const status of ["PASSED", "APPROVED", "VERIFIED"]) expect(fromSnapshot({ status }).status, status).toBe("verified");
    for (const status of ["FAILED", "REJECTED", "EXPIRED", "CANCELLED"]) expect(fromSnapshot({ status }).status, status).toBe("retry");
  });

  it("keeps the reviewer's note or the first reason code only when sent back", () => {
    expect(fromSnapshot({ status: "REJECTED", rejectReason: "Face not clearly visible" })).toEqual({ status: "retry", reason: "Face not clearly visible" });
    expect(fromSnapshot({ status: "FAILED", reasonCodes: ["LOW_SIMILARITY", "NO_GESTURE"] })).toEqual({ status: "retry", reason: "LOW_SIMILARITY" });
    expect(fromSnapshot({ status: "PASSED", reasonCodes: ["NOTE"] })).toEqual({ status: "verified" });
  });

  it("the profile's VERIFIED wins over any attempt", () => {
    expect(decideVerification("VERIFIED", { status: "FAILED" })).toEqual({ status: "verified" });
    expect(decideVerification("verified", null)).toEqual({ status: "verified" });
  });

  it("without an attempt, the profile status decides", () => {
    expect(decideVerification("PENDING", null)).toEqual({ status: "pending" });
    expect(decideVerification("UNVERIFIED", null)).toEqual({ status: "none" });
    expect(decideVerification("REJECTED", null)).toEqual({ status: "retry" });
  });

  it("an attempt still in review counts as decided against once the profile has left PENDING", () => {
    expect(decideVerification("PENDING", { status: "MANUAL_REVIEW" })).toEqual({ status: "pending" });
    expect(decideVerification("UNVERIFIED", { status: "MANUAL_REVIEW" })).toEqual({ status: "retry" });
  });

  it("a decided attempt keeps its result and reason", () => {
    expect(decideVerification("UNVERIFIED", { status: "REJECTED", rejectReason: "Too dark" })).toEqual({ status: "retry", reason: "Too dark" });
  });
});
