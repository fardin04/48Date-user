import { chatPage } from "@/data/portal/chats";
import type { MemberId } from "@/data/portal/types";
import { fill } from "@/lib/format";
import { forMember } from "@/lib/portal/member-link";
import { notFunctional, type Destination } from "@/lib/routes";

export type ConversationOption = { id: "unmatch" | "block" | "unblock" | "report"; label: string; to?: Destination };

/**
 * The conversation header's three-dot menu (Phase 14): Unmatch, Block / Unblock by the block state,
 * Report a problem. Unmatch stays an honest `notFunctional` until the API has an endpoint (N12).
 */
export function conversationOptions(member: MemberId, name: string, blocked: boolean): ConversationOption[] {
  const copy = chatPage.options;
  return [
    { id: "unmatch", label: copy.unmatch, to: notFunctional(copy.unmatchReason) },
    blocked ? { id: "unblock", label: fill(copy.unblock, { name }) } : { id: "block", label: fill(copy.block, { name }) },
    { id: "report", label: copy.report.label, to: forMember(copy.report, member).to },
  ];
}
