"use client";

import { useState } from "react";
import { ActionRow } from "@/components/pieces/actions/action-row";
import { FormHeader } from "@/components/pieces/forms/form-header";
import { PortalBack } from "@/components/pieces/actions/portal-back";
import { StatusNote } from "@/components/pieces/feedback/status-note";
import { SwitchRow } from "@/components/pieces/forms/switch-row";
import { Button } from "@/components/ui/button";
import { notificationKeys, type NotificationPrefs } from "@/data/portal/account";
import { accountService } from "@/lib/portal/account-service";
import { useLoaded } from "@/hooks/use-loaded";
import { getAccountPage } from "@/stores/portal-store";
import { ProfileContext } from "@/components/sections/portal/profile/profile-context";
import { StatusScreen } from "@/components/sections/portal/shared/status-screen";
import { LoadFailed } from "@/components/sections/portal/shared/load-failed";
import { Workspace } from "@/components/sections/portal/shared/workspace";

/** Browser push permission, or "unsupported" where the Notifications API is missing. */
const permission = () => (typeof Notification === "undefined" ? "unsupported" : Notification.permission);

/**
 * W09 / NOTIFY-PREFS with NOTIFY-DENIED and PREFS-SAVED on the same URL. In-app choices are always
 * saved; the browser is asked for push permission only from the Save click, and a refusal (now or
 * earlier) opens NOTIFY-DENIED.
 */
export function NotifyPrefsView() {
  const page = getAccountPage().notifyPrefs;
  const { value: prefs, error, reload } = useLoaded(accountService.getNotificationPrefs);
  if (prefs) return <PrefsForm initial={prefs} />;
  return (
    <Workspace aside={<ProfileContext />}>
      <PortalBack action={page.back} />
      <FormHeader variant="portalStatus" title={page.title} description={page.description} />
      {error !== undefined && <LoadFailed onRetry={reload} />}
    </Workspace>
  );
}

function PrefsForm({ initial }: { initial: NotificationPrefs }) {
  const copy = getAccountPage();
  const page = copy.notifyPrefs;
  const [prefs, setPrefs] = useState(initial);
  const [phase, setPhase] = useState<"form" | "denied" | "saved">("form");
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  const save = async () => {
    if (busy) return;
    setBusy(true);
    setFailed(false);
    try {
      await accountService.saveNotificationPrefs(prefs);
      const wantsPush = notificationKeys.some((key) => prefs[key]);
      let state = permission();
      if (wantsPush && state === "default") state = await Notification.requestPermission();
      setPhase(wantsPush && state === "denied" ? "denied" : "saved");
    } catch {
      setFailed(true);
    }
    setBusy(false);
  };

  const back = <PortalBack action={page.back} />;
  if (phase === "denied") {
    const { denied } = page;
    return (
      <StatusScreen
        back={back}
        title={denied.title}
        description={denied.description}
        summary={denied.summary}
        // A page cannot open browser settings: return to the choices to check again.
        primary={{ label: denied.primary, onClick: () => setPhase("form") }}
        secondary={denied.secondary}
        aside={<ProfileContext />}
        actionWidth="actionSlot"
      />
    );
  }
  if (phase === "saved") {
    const { saved } = page;
    return (
      <StatusScreen back={back} title={saved.title} description={saved.description} summary={saved.summary} primary={saved.primary} aside={<ProfileContext />} actionWidth="actionSlot" />
    );
  }

  return (
    <Workspace aside={<ProfileContext />}>
      {back}
      <FormHeader variant="portalStatus" title={page.title} description={page.description} />
      <fieldset aria-busy={busy || undefined} className="flex w-full flex-col gap-5">
        <legend className="sr-only">{page.title}</legend>
        {notificationKeys.map((key) => (
          <SwitchRow key={key} label={page.options[key]} checked={prefs[key]} disabled={busy} onChange={(on) => setPrefs((current) => ({ ...current, [key]: on }))} />
        ))}
      </fieldset>
      {failed && <StatusNote variant="alert" message={copy.account.failed} />}
      <ActionRow>
        <Button type="button" variant="confirm" size="portalPill" width="actionSlot" disabled={busy} aria-busy={busy || undefined} onClick={() => void save()}>
          {busy ? page.saving : page.save}
        </Button>
        <Button type="button" variant="roseOutline" size="portalPill" width="actionSlot" disabled={busy} onClick={() => setPhase("denied")}>
          {page.help}
        </Button>
      </ActionRow>
    </Workspace>
  );
}
