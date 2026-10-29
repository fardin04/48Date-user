"use client";

import { useState } from "react";
import { ActionRow } from "@/components/pieces/actions/action-row";
import { FormHeader } from "@/components/pieces/forms/form-header";
import { PortalBack } from "@/components/pieces/actions/portal-back";
import { PortalDialog } from "@/components/pieces/overlays/portal-dialog";
import { SettingsRow } from "@/components/pieces/cards/settings-row";
import { Button } from "@/components/ui/button";
import type { MemberId } from "@/data/portal/types";
import { fill } from "@/lib/format";
import { chatService } from "@/lib/portal/chat-service";
import { useLoaded } from "@/hooks/use-loaded";
import { getAccountPage, getMember } from "@/stores/portal-store";
import { ProfileContext } from "@/components/sections/portal/profile/profile-context";
import { StatusScreen } from "@/components/sections/portal/shared/status-screen";
import { Workspace } from "@/components/sections/portal/shared/workspace";

/** W09 / BLOCKED with the UNBLOCK dialog, or BLOCKED-EMPTY once nobody is blocked. */
export function BlockedView() {
  const page = getAccountPage().blocked;
  const { value: blocked, reload } = useLoaded(chatService.getBlocked);
  const [unblocking, setUnblocking] = useState<MemberId | null>(null);
  const [busy, setBusy] = useState(false);
  const back = <PortalBack action={page.back} />;

  if (!blocked) return null;
  if (blocked.length === 0) {
    const { empty } = page;
    return <StatusScreen back={back} title={empty.title} description={empty.description} summary={empty.summary} primary={empty.primary} aside={<ProfileContext />} actionWidth="actionSlot" />;
  }

  const unblock = async () => {
    if (!unblocking || busy) return;
    setBusy(true);
    await chatService.unblock(unblocking);
    setBusy(false);
    setUnblocking(null);
    reload();
  };

  const name = unblocking ? getMember(unblocking).name : "";
  return (
    <Workspace aside={<ProfileContext />}>
      {back}
      <FormHeader variant="portal" title={page.title} description={page.description} />
      <ul className="flex w-full flex-col">
        {blocked.map((member) => (
          <li key={member}>
            <SettingsRow label={getMember(member).name} value={page.status} pill="blocked" />
          </li>
        ))}
      </ul>
      <ActionRow>
        {blocked.map((member) => (
          <Button key={member} type="button" variant="confirm" size="portalPill" width="actionSlot" aria-haspopup="dialog" onClick={() => setUnblocking(member)}>
            {fill(page.unblock, { name: getMember(member).name })}
          </Button>
        ))}
      </ActionRow>
      <PortalDialog
        open={unblocking !== null}
        onOpenChange={(open) => !open && !busy && setUnblocking(null)}
        title={fill(page.dialog.title, { name })}
        description={page.dialog.description}
        closeLabel={page.dialog.close}
        header="fit"
        actions={
          <>
            <Button type="button" variant="confirm" size="portalPill" width="full" disabled={busy} aria-busy={busy || undefined} onClick={() => void unblock()}>
              {busy ? page.dialog.busy : page.dialog.confirm}
            </Button>
            <Button type="button" variant="roseOutline" size="portalPill" width="full" disabled={busy} onClick={() => setUnblocking(null)}>
              {page.dialog.keep}
            </Button>
          </>
        }
      />
    </Workspace>
  );
}
