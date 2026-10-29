"use client";

import { MemberRow } from "@/components/pieces/cards/member-row";
import { PortalCard } from "@/components/pieces/layout/portal-card";
import { Text } from "@/components/pieces/content/text";
import type { MemberId } from "@/data/portal/types";
import { cn } from "@/lib/cn";
import { fill } from "@/lib/format";
import { chatService } from "@/lib/portal/chat-service";
import { useLoaded } from "@/hooks/use-loaded";
import { useMatchClock } from "@/hooks/use-match-clock";
import { toItem } from "@/lib/routes";
import { getChatPage, getMember } from "@/stores/portal-store";

function ConversationRow({ member: memberId, current }: { member: MemberId; current: boolean }) {
  const { status } = getChatPage();
  const member = getMember(memberId);
  const clock = useMatchClock(memberId);
  const line = clock.status === "open" ? fill(status.open, { hours: clock.left.hours }) : clock.status === "agreed" ? status.agreed : status.plain;
  return (
    <li className="flex">
      <MemberRow photo={member.photo} title={member.name} description={line} variant={current ? "selected" : "list"} to={toItem("CHAT-01", memberId)} current={current} />
    </li>
  );
}

/** "Conversation list": the member's open conversations beside the chat (280px at ≥1024). */
export function ConversationList({ current, className }: { current: MemberId; className?: string }) {
  const copy = getChatPage();
  const conversations = useLoaded(chatService.getConversations).value ?? [];
  return (
    <PortalCard as="nav" surface="outline" aria-label={copy.listLabel} className={cn("flex w-full flex-col gap-2 px-3 pt-6 pb-5 lg:h-190", className)}>
      <Text as="h2" variant="text20SemiboldSnug" tone="strong">
        {copy.listTitle}
      </Text>
      <ul className="flex flex-col gap-2 overflow-y-auto">
        {conversations
          .filter((conversation) => !conversation.blocked)
          .map((conversation) => (
            <ConversationRow key={conversation.member} member={conversation.member} current={conversation.member === current} />
          ))}
      </ul>
    </PortalCard>
  );
}
