"use client";

import { useState } from "react";
import { NotificationPreview } from "@/components/pieces/illustrations/notification-preview";
import { SetupStep } from "@/components/pieces/shells/setup-step";
import { profileDraft } from "@/lib/onboarding/profile-draft";
import { getNotifyStep, getStepFlow } from "@/stores/onboarding-store";
import { SetupBack, SetupError, SetupPrimary, SetupTextAction, useSaveStep } from "./step-actions";

/**
 * NOTIFY → NOTIFY-DENIED. The browser owns allow / deny; a refusal never blocks setup. The step is
 * saved as `skipped` unless the browser granted notifications.
 */
export function NotifyStep() {
  const copy = getNotifyStep();
  const { save, saving, error } = useSaveStep("notify");
  const [denied, setDenied] = useState(false);
  const [asking, setAsking] = useState(false);
  const busy = asking || saving;

  const finish = (granted: boolean) => {
    profileDraft.setFields({ notifications: granted ? "granted" : "skipped" });
    void save();
  };

  async function enable() {
    if (!("Notification" in window)) {
      setDenied(true);
      return;
    }
    setAsking(true);
    const permission = await Notification.requestPermission();
    setAsking(false);
    if (permission === "granted") finish(true);
    else if (permission === "denied") setDenied(true);
  }

  if (denied) {
    return (
      <SetupStep
        intro={copy.denied.intro}
        busy={saving}
        back={<SetupBack onClick={() => setDenied(false)} />}
        primary={<SetupPrimary label={copy.denied.primary} busy={saving} onClick={() => finish(false)} />}
      >
        <NotificationPreview preview={copy.preview} help={copy.denied.help} />
        <SetupError message={error} />
      </SetupStep>
    );
  }

  return (
    <SetupStep
      intro={copy.intro}
      busy={busy}
      back={<SetupBack link={getStepFlow("notify").back} />}
      primary={<SetupPrimary label={copy.primary} busy={busy} onClick={() => void enable()} />}
      secondary={<SetupTextAction label={copy.secondary} onClick={() => finish(false)} />}
      revealDelay={0}
    >
      <NotificationPreview preview={copy.preview} />
      <SetupError message={error} />
    </SetupStep>
  );
}
