"use client";

import Image from "next/image";
import { ActionButton } from "@/components/pieces/actions/action-button";
import { FactList } from "@/components/pieces/cards/fact-list";
import { PortalCard } from "@/components/pieces/layout/portal-card";
import { Text } from "@/components/pieces/content/text";
import type { MemberId } from "@/data/portal/types";
import { cn } from "@/lib/cn";
import { fill } from "@/lib/format";
import { forMember } from "@/lib/portal/member-link";
import { useMatchClock } from "@/hooks/use-match-clock";
import { getChatPage, getMember } from "@/stores/portal-store";

type ConversationContextProps = {
  member: MemberId;
  /** INBOX and the full-width W05 screens end with "Plan a date"; the chat column does not. */
  withAction?: boolean;
  /** Placement only (rule 17). */
  className?: string;
};

/** "48Date / Web / Flow context" (Flow=Conversation): who you're talking to and the time left. */
export function ConversationContext({ member: memberId, withAction, className }: ConversationContextProps) {
  const { context } = getChatPage();
  const member = getMember(memberId);
  const clock = useMatchClock(memberId);
  const time =
    clock.status === "open"
      ? fill(context.timeValue, { hours: clock.left.hours, minutes: clock.left.minutes })
      : clock.status === "agreed"
        ? context.agreedValue
        : context.noDeadline;
  return (
    <PortalCard as="aside" surface="outline" padding="lg" revealDelay={80} aria-labelledby="conversation-context-title" className={cn("flex w-full flex-col gap-5", className)}>
      <div className="flex flex-col gap-2 border-b border-divider pb-2">
        <Text as="h2" id="conversation-context-title" variant="text20SemiboldSnug" tone="strong">
          {context.title}
        </Text>
        <Text variant="text12Medium" tone="sub">
          {context.description}
        </Text>
      </div>
      <div className="relative h-38 w-full overflow-hidden rounded-12">
        <Image src={member.photo.src} alt={member.photo.alt} fill sizes="304px" className="object-contain" />
      </div>
      <FactList
        layout="divided"
        facts={[
          { label: member.name, value: context.verified },
          { label: context.time, value: clock.status === "loading" ? "" : time },
          { label: context.enjoy, value: context.enjoyValue },
        ]}
      />
      {withAction && <ActionButton action={forMember(context.action, memberId)} variant="roseOutline" size="pillCompact" width="full" />}
    </PortalCard>
  );
}
