"use client";

import { useEffect } from "react";
import { MemberRow } from "@/components/pieces/cards/member-row";
import { PortalCard } from "@/components/pieces/layout/portal-card";
import { Text } from "@/components/pieces/content/text";
import type { MemberId } from "@/data/portal/types";
import { cn } from "@/lib/cn";
import { fill } from "@/lib/format";
import { chatService, type ConversationSummary } from "@/lib/portal/chat-service";
import { formatStamp } from "@/lib/portal/date-format";
import { liveData } from "@/lib/portal/live";
import { useLoaded } from "@/hooks/use-loaded";
import { useMatchClock } from "@/hooks/use-match-clock";
import { toItem } from "@/lib/routes";
import { getChatPage } from "@/stores/portal-store";
import { screenKeys } from "@/lib/screen-keys";

/**
 * The list and conversation panes: 760px as drawn, shrinking to the viewport below the 88px
 * header and workspace padding (browser zoom, short laptop screens) so the composer stays in view.
 */
export const chatPaneHeight = "lg:h-[clamp(420px,calc(100svh-152px),760px)]";

/** A conversation row's last-message time ("2:41 PM", "Yesterday") and unread count (shared with INBOX). */
export function conversationRowStatus(conversation: ConversationSummary, unreadCopy: string) {
  const { at, unread } = conversation;
  return {
    meta: at === null ? undefined : formatStamp(at, Date.now(), false),
    badge: unread > 0 ? { text: unread > 99 ? "99+" : String(unread), label: fill(unreadCopy, { count: unread }) } : undefined,
  };
}

function ConversationRow({ conversation, current }: { conversation: ConversationSummary; current: boolean }) {
  const { status, unread } = getChatPage();
  const member = conversation.partner;
  const memberId = member.id;
  const clock = useMatchClock(memberId);
  const line = clock.status === "open" ? fill(status.open, { hours: clock.left.hours }) : clock.status === "agreed" ? (liveData ? status.agreedLive : status.agreed) : status.plain;
  // The open conversation is being read: its count is about to clear.
  const { meta, badge } = conversationRowStatus(conversation, unread);
  return (
    <li className="flex">
      <MemberRow
        photo={member.photo}
        title={member.name}
        description={line}
        meta={meta}
        badge={current ? undefined : badge}
        variant={current ? "selected" : "list"}
        to={toItem("CHAT-01", memberId)}
        current={current}
      />
    </li>
  );
}

/** "Conversation list": the member's open conversations beside the chat (280px at ≥1024). */
export function ConversationList({ current, className }: { current: MemberId; className?: string }) {
  const copy = getChatPage();
  // New messages and closed conversations update the list as they happen.
  useEffect(() => chatService.watchInbox(), []);
  const conversations = useLoaded(screenKeys.conversations, chatService.getConversations).value ?? [];
  return (
    <PortalCard as="nav" surface="outline" aria-label={copy.listLabel} className={cn("flex w-full flex-col gap-2 px-3 pt-6 pb-5", chatPaneHeight, className)}>
      <Text as="h2" variant="text20SemiboldSnug" tone="strong">
        {copy.listTitle}
      </Text>
      <ul className="flex flex-col gap-2 overflow-y-auto">
        {conversations
          .filter((conversation) => !conversation.blocked)
          .map((conversation) => (
            <ConversationRow key={conversation.member} conversation={conversation} current={conversation.member.toLowerCase() === current.toLowerCase()} />
          ))}
      </ul>
    </PortalCard>
  );
}
