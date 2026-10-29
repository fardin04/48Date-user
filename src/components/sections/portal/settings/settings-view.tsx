"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ActionButton } from "@/components/pieces/actions/action-button";
import { ActionRow } from "@/components/pieces/actions/action-row";
import { FormHeader } from "@/components/pieces/forms/form-header";
import { PortalBack } from "@/components/pieces/actions/portal-back";
import { PortalDialog } from "@/components/pieces/overlays/portal-dialog";
import { SettingsRow } from "@/components/pieces/cards/settings-row";
import { Button } from "@/components/ui/button";
import { authService } from "@/lib/auth/auth-service";
import { hrefFor } from "@/lib/routes";
import { getAccountPage } from "@/stores/portal-store";
import { ProfileContext } from "@/components/sections/portal/profile/profile-context";
import { Workspace } from "@/components/sections/portal/shared/workspace";

/** W09 / SETTINGS with the SIGNOUT dialog. Logging out clears this tab's member data, then opens WELCOME. */
export function SettingsView() {
  const page = getAccountPage().settings;
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);
  const [busy, setBusy] = useState(false);

  const signOut = async () => {
    if (busy) return;
    setBusy(true);
    await authService.signOut();
    router.replace(hrefFor("WELCOME"));
  };

  return (
    <Workspace aside={<ProfileContext />}>
      <PortalBack action={page.back} />
      <FormHeader variant="portal" title={page.title} description={page.description} />
      <ul className="flex w-full flex-col">
        {page.links.map((link) => (
          <li key={link.label}>
            <SettingsRow label={link.label} value={page.open} pill="open" to={link.to} />
          </li>
        ))}
        <li>
          <SettingsRow label={page.signOut} value={page.open} pill="open" onClick={() => setSigningOut(true)} />
        </li>
      </ul>
      <ActionRow>
        <ActionButton action={page.primary} variant="confirm" size="portalPill" width="actionSlot" />
      </ActionRow>
      <PortalDialog
        open={signingOut}
        onOpenChange={(open) => !busy && setSigningOut(open)}
        title={page.dialog.title}
        description={page.dialog.description}
        closeLabel={page.dialog.close}
        header="fit"
        actions={
          <>
            <Button type="button" variant="confirm" size="portalPill" width="full" disabled={busy} aria-busy={busy || undefined} onClick={() => void signOut()}>
              {busy ? page.dialog.busy : page.dialog.confirm}
            </Button>
            <Button type="button" variant="roseOutline" size="portalPill" width="full" disabled={busy} onClick={() => setSigningOut(false)}>
              {page.dialog.keep}
            </Button>
          </>
        }
      />
    </Workspace>
  );
}
