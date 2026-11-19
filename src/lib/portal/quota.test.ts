import { describe, expect, it } from "vitest";
import {
  calculateRemainingConversations,
  evaluateConversationQuota,
} from "./quota";

describe("conversation quota logic (Phase 34)", () => {
  describe("evaluateConversationQuota", () => {
    it("always allows new conversations for Premium members", () => {
      expect(evaluateConversationQuota({ plan: "monthly", conversationsUsed: 10, includedConversations: 1 })).toBe("allowed");
      expect(evaluateConversationQuota({ plan: "weekly", conversationsUsed: 100, includedConversations: 1 })).toBe("allowed");
      expect(evaluateConversationQuota({ plan: "yearly", conversationsUsed: 0, includedConversations: 1 })).toBe("allowed");
    });

    it("allows new conversation for Free members when quota is not used up", () => {
      expect(evaluateConversationQuota({ plan: null, conversationsUsed: 0, includedConversations: 1 })).toBe("allowed");
    });

    it("returns 'limit' for Free members once weekly conversation quota is used", () => {
      expect(evaluateConversationQuota({ plan: null, conversationsUsed: 1, includedConversations: 1 })).toBe("limit");
      expect(evaluateConversationQuota({ plan: null, conversationsUsed: 2, includedConversations: 1 })).toBe("limit");
    });
  });

  describe("calculateRemainingConversations", () => {
    it("returns Infinity for Premium members", () => {
      expect(calculateRemainingConversations({ plan: "monthly", conversationsUsed: 5, includedConversations: 1 })).toBe(Infinity);
    });

    it("calculates remaining count for Free members", () => {
      expect(calculateRemainingConversations({ plan: null, conversationsUsed: 0, includedConversations: 1 })).toBe(1);
      expect(calculateRemainingConversations({ plan: null, conversationsUsed: 1, includedConversations: 1 })).toBe(0);
      expect(calculateRemainingConversations({ plan: null, conversationsUsed: 2, includedConversations: 1 })).toBe(0);
    });
  });
});
