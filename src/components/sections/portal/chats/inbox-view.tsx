"use client";

import { useEffect } from "react";
import { ActionButton } from "@/components/pieces/actions/action-button";
import { FormHeader } from "@/components/pieces/forms/form-header";
import { MemberRow } from "@/components/pieces/cards/member-row";
import { PortalBack } from "@/components/pieces/actions/portal-back";
import { fill } from "@/lib/format";
import { chatService } from "@/lib/portal/chat-service";
import { useLoaded } from "@/hooks/use-loaded";
import { toItem } from "@/lib/routes";
import { getInboxPage } from "@/stores/portal-store";
import { LoadFailed } from "@/components/sections/portal/shared/load-failed";
import { ConversationContext } from "@/components/sections/portal/chats/conversation-context";
import { StatusScreen } from "@/components/sections/portal/shared/status-screen";
import { Workspace } from "@/components/sections/portal/shared/workspace";
import { screenKeys } from "@/lib/screen-keys";

/** W05 / INBOX, or CHAT-EMPTY once no conversation is open. */
export function InboxView() {
  const copy = getInboxPage();
  // New messages and closed conversations update the list as they happen.
  useEffect(() => chatService.watchInbox(), []);
  const { value: loaded, error, reload } = useLoaded(screenKeys.conversations, chatService.getConversations, { refetchOnWindowFocus: true });
  if (error && !loaded) return <LoadFailed onRetry={() => void reload()} error={error} />;
  if (!loaded) return null;

  const open = loaded.filter((conversation) => !conversation.blocked);
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

  const first = open[0].partner;
  return (
    <Workspace aside={<ConversationContext partner={first} withAction />}>
      <FormHeader variant="portalDivided" title={copy.title} description={copy.description} />
      <ul className="flex w-full flex-col gap-5">
        {open.map((conversation, index) => {
          const member = conversation.partner;
          return (
            <li key={conversation.member} className="flex">
              <MemberRow photo={member.photo} title={member.name} description={conversation.preview} variant="list" to={toItem("CHAT-01", member.id)} revealDelay={index * 40} />
            </li>
          );
        })}
      </ul>
      <ActionButton action={{ label: fill(copy.open, { name: first.name }), to: toItem("CHAT-01", first.id) }} variant="confirm" size="portalPill" width="actionSlot" />
    </Workspace>
  );
}
