"use client";

import Image from "next/image";
import { useState, type FormEvent } from "react";
import { ActionRow } from "@/components/pieces/actions/action-row";
import { FormHeader } from "@/components/pieces/forms/form-header";
import { PortalBack } from "@/components/pieces/actions/portal-back";
import { TextField } from "@/components/pieces/forms/text-field";
import { Button } from "@/components/ui/button";
import type { MemberSummary } from "@/data/portal/types";
import { fill } from "@/lib/format";
import { getChatPage, getPortalShell } from "@/stores/portal-store";
import { ConversationContext } from "@/components/sections/portal/chats/conversation-context";
import { Workspace } from "@/components/sections/portal/shared/workspace";

type ChatPhotoProps = {
  member: MemberSummary;
  /** Object URL of the chosen photo; the conversation owns and revokes it. */
  url: string;
  onSend: (caption: string) => Promise<void>;
  onCancel: () => void;
};

/** W05 / CHAT-PHOTO: preview the chosen photo, add a caption, send once. */
export function ChatPhoto({ member, url, onSend, onCancel }: ChatPhotoProps) {
  const copy = getChatPage().photo;
  const [caption, setCaption] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    await onSend(caption.trim());
  };

  return (
    <Workspace aside={<ConversationContext partner={member} withAction />}>
      <PortalBack action={getPortalShell().back} onClick={onCancel} />
      <form onSubmit={submit} aria-busy={busy || undefined} className="flex w-full flex-col gap-5">
        <FormHeader variant="portalStatus" title={copy.title} description={fill(copy.description, { name: member.name })} />
        <div className="relative h-95 w-full overflow-hidden rounded-16 bg-canvas-cool max-sm:h-70">
          {/* A local object URL: next/image cannot optimise it. */}
          <Image src={url} alt={copy.previewAlt} fill unoptimized sizes="860px" className="object-cover" />
        </div>
        <TextField label={copy.caption} value={caption} onChange={setCaption} maxLength={copy.captionMax} state={busy ? "disabled" : "default"} />
        <ActionRow>
          <Button type="submit" variant="confirm" size="portalPill" width="actionSlot" disabled={busy} aria-busy={busy || undefined}>
            {busy ? copy.sending : copy.send}
          </Button>
          <Button type="button" variant="roseOutline" size="portalPill" width="actionSlot" disabled={busy} onClick={onCancel}>
            {copy.cancel}
          </Button>
        </ActionRow>
      </form>
    </Workspace>
  );
}
