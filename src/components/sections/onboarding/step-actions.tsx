"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ActionButton } from "@/components/pieces/actions/action-button";
import { BackButton } from "@/components/pieces/actions/back-button";
import { StatusNote } from "@/components/pieces/feedback/status-note";
import { Button } from "@/components/ui/button";
import type { OnboardingStep, StepLink } from "@/data/onboarding/types";
import type { Destination } from "@/lib/routes";
import { onboardingService, type SavedProgress, type StepInput } from "@/lib/onboarding/onboarding-service";
import { profileDraft } from "@/lib/onboarding/profile-draft";
import { stepDestination, stepHref } from "@/lib/onboarding/steps";
import { screenKeys } from "@/lib/screen-keys";
import { getOnboardingShared, getStepFlow } from "@/stores/onboarding-store";

type PrimaryProps = {
  label: string;
  disabled?: boolean;
  /** Fades the disabled button while a service call runs (NICK-CHECK, PHOTO-UPLOAD). */
  busy?: boolean;
  /** A button action instead of submitting the step's form. */
  onClick?: () => void;
  /** A destination outside onboarding (not functional yet: VERIFY-INTRO, DISCOVER). */
  to?: Destination;
};

/** 240×56 rose primary of the action row. */
export function SetupPrimary({ label, disabled, busy, onClick, to }: PrimaryProps) {
  if (to) return <ActionButton action={{ label, to }} variant="solid" size="pill" width="setupPrimary" />;
  return (
    <Button
      type={onClick ? "button" : "submit"}
      variant="solid"
      size="pill"
      width="setupPrimary"
      disabled={disabled || busy}
      aria-busy={busy || undefined}
      onClick={onClick}
    >
      <span className="max-sm:truncate">{label}</span>
    </Button>
  );
}

/** Full-width 44px text action under the content ("Enter location manually", "Maybe later"). */
export function SetupTextAction({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <Button type="button" variant="ghost" size="text" width="full" onClick={onClick}>
      {label}
    </Button>
  );
}

/** Back to a step or destination (`link`), or to an earlier state of this screen (`onClick`). */
export function SetupBack({ link, onClick }: { link?: StepLink; onClick?: () => void }) {
  const shared = getOnboardingShared();
  return (
    <BackButton
      label={shared.backLabel}
      icon={shared.backIcon}
      to={link === undefined ? undefined : stepDestination(link)}
      onClick={onClick}
    />
  );
}

/** Opens the step after `step` once its answers are saved. */
export function useAdvance(step: OnboardingStep) {
  const router = useRouter();
  return () => {
    const next = getStepFlow(step).next;
    if (typeof next === "string") router.push(stepHref(next));
  };
}

/**
 * Continue: sends the step's answers through `onboardingService.saveStep`, then opens the next
 * step. `saving` disables the primary (no double submit); `error` is the service's message.
 */
export function useSaveStep(step: OnboardingStep) {
  const advance = useAdvance(step);
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save(extra: Omit<StepInput, "draft"> = {}) {
    if (saving) return;
    setSaving(true);
    setError(null);
    const draft = profileDraft.read();
    const result = await onboardingService.saveStep(step, { draft, ...extra });
    setSaving(false);
    if (result.ok) {
      if (step === "nickname") {
        const savedNickname = draft.fields.nickname;
        if (savedNickname) {
          queryClient.setQueryData(screenKeys.onboardingProgress, (old: SavedProgress | undefined) =>
            old
              ? { ...old, lockedNickname: savedNickname }
              : { completed: false, draft: { fields: { nickname: savedNickname } }, lockedNickname: savedNickname }
          );
        }
      }
      advance();
    } else {
      setError(result.message);
    }
  }

  return { save, saving, error };
}

/** The step's save failure, announced under its content. */
export function SetupError({ message }: { message: string | null }) {
  return message ? <StatusNote variant="error" message={message} /> : null;
}
