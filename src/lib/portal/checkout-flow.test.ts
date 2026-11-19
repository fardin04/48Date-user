import { describe, expect, it } from "vitest";
import {
  canProceedToProvider,
  formatProviderSummary,
  isEntitlementActive,
  nextCheckoutPhase,
} from "./checkout-flow";

describe("checkout flow pure logic (Phase 34)", () => {
  describe("canProceedToProvider", () => {
    it("prohibits proceeding to provider when terms are not agreed", () => {
      expect(canProceedToProvider(false)).toBe(false);
    });

    it("allows proceeding to provider when terms are agreed", () => {
      expect(canProceedToProvider(true)).toBe(true);
    });
  });

  describe("nextCheckoutPhase", () => {
    it("transitions to done when payment succeeds", () => {
      expect(nextCheckoutPhase("paid")).toBe("done");
    });

    it("transitions to error when payment fails", () => {
      expect(nextCheckoutPhase("failed")).toBe("error");
    });
  });

  describe("isEntitlementActive", () => {
    it("activates entitlement only from confirmed result (Rule 40)", () => {
      expect(isEntitlementActive("paid")).toBe(true);
      expect(isEntitlementActive("failed")).toBe(false);
      expect(isEntitlementActive("pending")).toBe(false);
    });
  });

  describe("formatProviderSummary", () => {
    it("formats summary line for provider presentation", () => {
      expect(formatProviderSummary("Weekly", "$4.99", "week")).toBe("Weekly: $4.99 USD / week");
      expect(formatProviderSummary("Monthly", "$14.99", "month")).toBe("Monthly: $14.99 USD / month");
    });
  });
});
