"use client";

import { useState, type FormEvent } from "react";
import { ActionButton } from "@/components/pieces/actions/action-button";
import { ActionRow } from "@/components/pieces/actions/action-row";
import { CheckboxField } from "@/components/pieces/forms/checkbox-field";
import { FormHeader } from "@/components/pieces/forms/form-header";
import { PortalBack } from "@/components/pieces/actions/portal-back";
import { StatusNote } from "@/components/pieces/feedback/status-note";
import { Button } from "@/components/ui/button";
import { authService } from "@/lib/auth/auth-service";
import { accountService } from "@/lib/portal/account-service";
import { getAccountPage } from "@/stores/portal-store";
import { ProfileContext } from "@/components/sections/portal/profile/profile-context";
import { StatusScreen } from "@/components/sections/portal/shared/status-screen";
import { Workspace } from "@/components/sections/portal/shared/workspace";

/**
 * W09 / DELETE-ACCOUNT, then DELETE-DONE. Nothing happens without the confirmation box; once the
 * request is sent the member is signed out and this tab's data is cleared.
 */
export function DeleteAccountView() {
  const page = getAccountPage().deletion;
  const [understood, setUnderstood] = useState(false);
  const [missing, setMissing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const [done, setDone] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (busy) return;
    setMissing(!understood);
    setFailed(false);
    if (!understood) return;
    setBusy(true);
    try {
      await accountService.requestDeletion();
      await authService.signOut();
      setDone(true);
    } catch {
      setFailed(true);
    }
    setBusy(false);
  };

  if (done) {
    const summary = page.done;
    return <StatusScreen title={summary.title} description={summary.description} summary={summary.summary} primary={summary.primary} aside={<ProfileContext />} actionWidth="actionSlot" />;
  }

  return (
    <Workspace aside={<ProfileContext />}>
      <PortalBack action={page.back} />
      <form onSubmit={submit} noValidate aria-busy={busy || undefined} className="flex w-full flex-col gap-5">
        <FormHeader variant="portalStatus" title={page.title} description={page.description} />
        <CheckboxField
          label={page.confirm}
          checked={understood}
          onChange={(checked) => {
            setUnderstood(checked);
            setMissing(false);
          }}
        />
        {missing && <StatusNote variant="alert" message={page.required} />}
        {failed && <StatusNote variant="alert" message={page.failed} />}
        <ActionRow>
          <Button type="submit" variant="confirm" size="portalPill" width="summaryAction" disabled={busy} aria-busy={busy || undefined}>
            {busy ? page.submitting : page.submit}
          </Button>
          <ActionButton action={page.keep} variant="roseOutline" size="portalPill" width="actionSlot" />
        </ActionRow>
      </form>
    </Workspace>
  );
}
