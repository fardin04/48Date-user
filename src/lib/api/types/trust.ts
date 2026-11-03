/** User / 11 - Trust & Safety (reports, blocks, warnings). Enums are case-sensitive. */

export type Severity = "HIGH" | "MEDIUM" | "LOW";

export type ReportReasonGroup = { reason: string; subReasons: { name: string; severity: Severity }[] };

export type ReportSource = "PROFILE" | "CHAT" | "DATE";

export type ReportBody = {
  reportedNickname: string;
  reason: string;
  subReason: string;
  description?: string;
  source?: ReportSource;
  conversationId?: string;
  dateId?: string;
  alsoBlock?: boolean;
};

export type ReportData = { id: string; code: string; reason: string; subReason: string; severity: Severity; status: string; createdAt: string };

export type BlockSource = "CHAT" | "PROFILE" | "REPORT";

export type BlockedUser = { id: string; nickname: string; photoUrl: string | null; blockedAt: string; source: BlockSource };

export type Warning = { id: string; category: string; message: string; createdAt: string; acknowledgedAt: string | null };
