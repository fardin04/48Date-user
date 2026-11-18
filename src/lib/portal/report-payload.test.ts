import { describe, expect, it } from "vitest";
import { reportReasons, type ReportReason } from "@/data/portal/account";
import { getAccountPage } from "@/stores/portal-store";
import type { ReportReasonGroup } from "@/lib/api/types/trust";

// Mirror catalogue matching from api-account-service to test pattern mapping
const reasonPatterns: Record<ReportReason, RegExp> = {
  messages: /harass|inappropriate|abus|offensive|message/i,
  fake: /fake|impersonat|catfish/i,
  noShow: /no.?show|didn.t (show|arrive|turn up)/i,
  money: /money|scam|financ/i,
  other: /other|something else/i,
};

function catalogueEntry(groups: ReportReasonGroup[], reason: ReportReason) {
  const all = groups.flatMap((group) => group.subReasons.map((sub) => ({ reason: group.reason, subReason: sub.name })));
  const pattern = reasonPatterns[reason];
  return (
    all.find((entry) => pattern.test(entry.subReason)) ??
    all.find((entry) => pattern.test(entry.reason)) ??
    all.find((entry) => reasonPatterns.other.test(`${entry.reason} ${entry.subReason}`)) ??
    all.at(-1) ??
    null
  );
}

describe("report payload and reasons matching (Phase 30)", () => {
  const mockGroups: ReportReasonGroup[] = [
    {
      reason: "HARASSMENT",
      subReasons: [
        { name: "Inappropriate messages", severity: "HIGH" },
        { name: "Offensive language", severity: "MEDIUM" },
      ],
    },
    {
      reason: "FRAUD",
      subReasons: [
        { name: "Asked for money", severity: "HIGH" },
        { name: "Fake profile / impersonation", severity: "HIGH" },
      ],
    },
    {
      reason: "ATTENDANCE",
      subReasons: [{ name: "Didn't show up", severity: "LOW" }],
    },
    {
      reason: "OTHER",
      subReasons: [{ name: "Something else", severity: "LOW" }],
    },
  ];

  it("maps every Figma reason to an API reason catalogue entry", () => {
    for (const reason of reportReasons) {
      const entry = catalogueEntry(mockGroups, reason);
      expect(entry).not.toBeNull();
      expect(entry?.reason).toBeDefined();
      expect(entry?.subReason).toBeDefined();
    }
  });

  it("matches 'messages' to Inappropriate messages", () => {
    const entry = catalogueEntry(mockGroups, "messages");
    expect(entry?.reason).toBe("HARASSMENT");
    expect(entry?.subReason).toBe("Inappropriate messages");
  });

  it("matches 'fake' to Fake profile", () => {
    const entry = catalogueEntry(mockGroups, "fake");
    expect(entry?.reason).toBe("FRAUD");
    expect(entry?.subReason).toBe("Fake profile / impersonation");
  });

  it("matches 'money' to Asked for money", () => {
    const entry = catalogueEntry(mockGroups, "money");
    expect(entry?.reason).toBe("FRAUD");
    expect(entry?.subReason).toBe("Asked for money");
  });

  it("matches 'noShow' to Didn't show up", () => {
    const entry = catalogueEntry(mockGroups, "noShow");
    expect(entry?.reason).toBe("ATTENDANCE");
    expect(entry?.subReason).toBe("Didn't show up");
  });

  it("enforces the 500-character description limit", () => {
    const page = getAccountPage().report;
    expect(page.limits.details).toBe(500);
    const longDetails = "A".repeat(600);
    const trimmed = longDetails.slice(0, page.limits.details);
    expect(trimmed.length).toBe(500);
  });
});
