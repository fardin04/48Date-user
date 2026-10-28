"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, type FormEvent } from "react";
import { OptionDialogField } from "@/components/pieces/forms/option-dialog-field";
import { SetupStep } from "@/components/pieces/shells/setup-step";
import { SoftPanel } from "@/components/pieces/layout/soft-panel";
import { Text } from "@/components/pieces/content/text";
import { TextField } from "@/components/pieces/forms/text-field";
import { authService } from "@/lib/auth/auth-service";
import { photoStore } from "@/lib/onboarding/photo-store";
import { profileDraft, useProfileDraft } from "@/lib/onboarding/profile-draft";
import { ageFrom } from "@/lib/onboarding/steps";
import { hrefFor } from "@/lib/routes";
import { useOnboardingOptions } from "@/hooks/use-onboarding-options";
import { getBirthdayStep, getOnboardingShared, getStepFlow } from "@/stores/onboarding-store";
import { SetupBack, SetupError, SetupPrimary, SetupTextAction, useSaveStep } from "./step-actions";

/** BIRTHDAY with SELECT-OCCUPATION (dialog) and AGE-GATE (under 18). */
export function BirthdayStep() {
  const copy = getBirthdayStep();
  const shared = getOnboardingShared();
  const router = useRouter();
  const { save, saving, error } = useSaveStep("birthday");
  const occupations = useOnboardingOptions()?.fields.occupation ?? copy.occupation.options;
  const draft = useProfileDraft();
  // Validated on submit only: the age depends on today's date, which prerendering must not read.
  const [errors, setErrors] = useState({ dob: false, occupation: false });
  const [gated, setGated] = useState(false);
  const dobInput = useRef<HTMLInputElement>(null);
  const dob = draft.fields.dob ?? "";
  const occupation = draft.fields.occupation ?? "";

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const age = ageFrom(dob);
    setErrors({ dob: age === null, occupation: !occupation });
    if (age === null || !occupation) return;
    if (age < copy.minimumAge) setGated(true);
    else void save();
  }

  function checkBirthday() {
    setGated(false);
    // The field mounts again with the form; focus it once it is back.
    requestAnimationFrame(() => dobInput.current?.focus());
  }

  /** Leaving sign-up ends the session too, so WELCOME does not forward to the portal. */
  async function leave() {
    profileDraft.clear();
    photoStore.clear();
    await authService.signOut();
    router.push(hrefFor("WELCOME"));
  }

  if (gated) {
    const gate = copy.ageGate;
    return (
      <SetupStep
        intro={gate.intro}
        back={<SetupBack onClick={checkBirthday} />}
        primary={<SetupPrimary label={gate.primary} onClick={checkBirthday} />}
        secondary={<SetupTextAction label={gate.secondary} onClick={leave} />}
      >
        <SoftPanel align="center">
          <Text variant="setupFigure48" tone="rose">
            {gate.figure}
          </Text>
          <Text variant="text16Semibold" tone="strong">
            {gate.title}
          </Text>
          <Text variant="text14Relaxed" tone="sub">
            {gate.description}
          </Text>
        </SoftPanel>
      </SetupStep>
    );
  }

  return (
    <SetupStep
      intro={copy.intro}
      onSubmit={submit}
      back={<SetupBack link={getStepFlow("birthday").back} />}
      primary={<SetupPrimary label={shared.continueLabel} busy={saving} />}
      busy={saving}
      revealDelay={0}
    >
      <TextField
        type="date"
        label={copy.dob.label}
        value={dob}
        onChange={(value) => profileDraft.setFields({ dob: value })}
        autoComplete="bday"
        inputRef={dobInput}
        required
        state={errors.dob ? "error" : "default"}
        message={shared.fieldError}
      />
      <OptionDialogField
        label={copy.occupation.label}
        value={occupation}
        onChange={(value) => profileDraft.setFields({ occupation: value })}
        options={[...occupations]}
        placeholder={copy.occupation.placeholder}
        dialog={copy.occupation.dialog}
        state={errors.occupation && !occupation ? "error" : "default"}
        message={shared.fieldError}
      />
      <SetupError message={error} />
    </SetupStep>
  );
}
