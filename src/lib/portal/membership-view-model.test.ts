import { describe, expect, it } from "vitest";
import type { Plan } from "@/data/portal/membership";
import {
  formatConversationUsage,
  formatPlanPricing,
  formatUsd,
  resolvePlan,
  resolveRenewalStatus,
} from "./membership-view-model";

const samplePlans: Plan[] = [
  { id: "weekly", name: "Weekly", headline: "$4.99", price: "$4.99", billing: "Renews weekly", choose: "Choose Weekly", period: "week", confirming: "Confirming", renewalDays: 7 },
  { id: "monthly", name: "Monthly", headline: "$14.99", price: "$14.99", billing: "Renews monthly", choose: "Choose Monthly", period: "month", confirming: "Confirming", renewalDays: 30 },
  { id: "yearly", name: "Yearly", headline: "$5.00/mo", price: "$59.99", billing: "$59.99 billed yearly", choose: "Choose Yearly", period: "year", confirming: "Confirming", renewalDays: 365 },
];

describe("membership view-model logic (Phase 33)", () => {
  describe("formatUsd", () => {
    it("formats amounts as standard USD currency", () => {
      expect(formatUsd(4.99)).toBe("$4.99");
      expect(formatUsd(14.99)).toBe("$14.99");
      expect(formatUsd(59.99)).toBe("$59.99");
      expect(formatUsd(5)).toBe("$5.00");
    });
  });

  describe("formatPlanPricing", () => {
    it("formats weekly plan pricing", () => {
      const result = formatPlanPricing("weekly", 4.99);
      expect(result.price).toBe("$4.99");
      expect(result.headline).toBe("$4.99");
      expect(result.billing).toBeUndefined();
    });

    it("formats monthly plan pricing", () => {
      const result = formatPlanPricing("monthly", 14.99);
      expect(result.price).toBe("$14.99");
      expect(result.headline).toBe("$14.99");
      expect(result.billing).toBeUndefined();
    });

    it("formats yearly plan pricing leading with monthly equivalent", () => {
      const result = formatPlanPricing("yearly", 59.99);
      expect(result.price).toBe("$59.99");
      expect(result.headline).toBe("$5.00/mo");
      expect(result.billing).toBe("$59.99 billed yearly");
    });
  });

  describe("resolveRenewalStatus", () => {
    it("returns active label when renews is true", () => {
      expect(resolveRenewalStatus(true, "Active", "Renewal off")).toBe("Active");
    });

    it("returns renewalOff label when renews is false", () => {
      expect(resolveRenewalStatus(false, "Active", "Renewal off")).toBe("Renewal off");
    });
  });

  describe("formatConversationUsage", () => {
    it("formats usage counts for the free tier", () => {
      expect(formatConversationUsage(0, 1)).toBe("0 of 1 used");
      expect(formatConversationUsage(1, 1)).toBe("1 of 1 used");
    });
  });

  describe("resolvePlan", () => {
    it("resolves the requested plan by id", () => {
      expect(resolvePlan(samplePlans, "weekly").name).toBe("Weekly");
      expect(resolvePlan(samplePlans, "yearly").name).toBe("Yearly");
    });

    it("falls back to the first plan if null, undefined, or missing", () => {
      expect(resolvePlan(samplePlans, null).name).toBe("Weekly");
      expect(resolvePlan(samplePlans, undefined).name).toBe("Weekly");
    });
  });
});
