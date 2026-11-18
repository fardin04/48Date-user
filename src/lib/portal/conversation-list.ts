import { fill } from "@/lib/format";
import type { ConversationSummary } from "@/lib/portal/chat-service";
import { formatStamp } from "@/lib/portal/date-format";

/**
 * The conversations a list shows: blocked or closed ones leave it, and the newest last message comes
 * first, whatever order the API returned (a refetch after a socket `message:new` moves that row up).
 */
export function openConversations(list: ConversationSummary[]): ConversationSummary[] {
  return list.filter((conversation) => !conversation.blocked).sort((a, b) => (b.at ?? 0) - (a.at ?? 0));
}

/** A conversation row's last-message time ("2:41 PM", "Yesterday") and unread count (INBOX and the side list). */
export function conversationRowStatus(conversation: ConversationSummary, unreadCopy: string, now = Date.now()) {
  const { at, unread } = conversation;
  return {
    meta: at === null ? undefined : formatStamp(at, now, false),
    badge: unread > 0 ? { text: unread > 99 ? "99+" : String(unread), label: fill(unreadCopy, { count: unread }) } : undefined,
  };
}
