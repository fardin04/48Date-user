import { describe, expect, it } from "vitest";
import { hrefFor } from "@/lib/routes";
import { conversationOptions } from "@/lib/portal/conversation-menu";

describe("conversation options menu", () => {
  it("lists Unmatch, Block and Report for an open conversation", () => {
    expect(conversationOptions("zara_ahmed", "Zara", false).map(({ id, label }) => `${id}:${label}`)).toEqual([
      "unmatch:Unmatch",
      "block:Block Zara",
      "report:Report a problem",
    ]);
  });

  it("offers Unblock instead of Block once the member is blocked", () => {
    expect(conversationOptions("zara_ahmed", "Zara", true).map(({ id }) => id)).toEqual(["unmatch", "unblock", "report"]);
  });

  it("keeps Unmatch notFunctional while no endpoint exists", () => {
    const unmatch = conversationOptions("zara_ahmed", "Zara", false)[0];
    expect(unmatch.to).toEqual({ notFunctional: "Unmatch needs a backend endpoint" });
  });

  it("sends Report to REPORT-DETAIL for this member", () => {
    const report = conversationOptions("zara_ahmed", "Zara", false)[2];
    expect(report.to && !("notFunctional" in report.to) ? hrefFor(report.to.screen, report.to.param) : null).toBe("/report/zara_ahmed");
  });
});
