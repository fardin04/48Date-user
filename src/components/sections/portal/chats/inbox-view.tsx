"use client";

import { ActionButton } from "@/components/pieces/actions/action-button";
import { FormHeader } from "@/components/pieces/forms/form-header";
import { MemberRow } from "@/components/pieces/cards/member-row";
import { PortalBack } from "@/components/pieces/actions/portal-back";
import { fill } from "@/lib/format";
import { chatService } from "@/lib/portal/chat-service";
import { useLoaded } from "@/hooks/use-loaded";
import { toItem } from "@/lib/routes";
import { getInboxPage, getMember } from "@/stores/portal-store";
import { ConversationContext } from "@/components/sections/portal/chats/conversation-context";
import { StatusScreen } from "@/components/sections/portal/shared/status-screen";
import { Workspace } from "@/components/sections/portal/shared/workspace";

/** W05 / INBOX, or CHAT-EMPTY once no conversation is open. */
export function InboxView() {
  const copy = getInboxPage();
  const loaded = useLoaded(chatService.getConversations).value;
  if (!loaded) return null;

  const open = copy.conversations.filter((sample) => !loaded.some((conversation) => conversation.member === sample.member && conversation.blocked));
  if (open.length === 0) {
    const { empty } = copy;
    return (
      <StatusScreen
        back={<PortalBack action={copy.back} />}
        title={empty.title}
        description={empty.description}
        summary={empty.summary}
        primary={empty.primary}
        actionWidth="actionSlot"
      />
    );
  }

  const first = getMember(open[0].member);
  return (
    <Workspace aside={<ConversationContext member={first.id} withAction />}>
      <FormHeader variant="portalDivided" title={copy.title} description={copy.description} />
      <ul className="flex w-full flex-col gap-5">
        {open.map((sample, index) => {
          const member = getMember(sample.member);
          return (
            <li key={sample.member} className="flex">
              <MemberRow photo={member.photo} title={member.name} description={sample.preview} variant="list" to={toItem("CHAT-01", member.id)} revealDelay={index * 40} />
            </li>
          );
        })}
      </ul>
      <ActionButton action={{ label: fill(copy.open, { name: first.name }), to: toItem("CHAT-01", first.id) }} variant="confirm" size="portalPill" width="actionSlot" />
    </Workspace>
  );
}
