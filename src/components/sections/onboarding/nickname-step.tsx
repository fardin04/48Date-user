"use client";

import { useId, useRef, useState, type FormEvent } from "react";
import { SetupStep } from "@/components/pieces/shells/setup-step";
import { StatusNote } from "@/components/pieces/feedback/status-note";
import { SuggestionChips } from "@/components/pieces/forms/suggestion-chips";
import { TextField } from "@/components/pieces/forms/text-field";
import { onboardingService, type NicknameCheck } from "@/lib/onboarding/onboarding-service";
import { profileDraft, useProfileDraft } from "@/lib/onboarding/profile-draft";
import { useLoaded } from "@/hooks/use-loaded";
import { getNicknameStep, getOnboardingShared, getStepFlow } from "@/stores/onboarding-store";
import { SetupBack, SetupError, SetupPrimary, useSaveStep } from "./step-actions";

/** The API's rule (Postman `07 Save Onboarding Step — Nickname`): 3–20 characters, starts with a letter. */
const NICKNAME = /^[A-Za-z][A-Za-z0-9_.]{2,19}$/;
const MAX_LENGTH = 20;

type Taken = Extract<NicknameCheck, { available: false }>;
type Phase = { kind: "edit"; invalid?: boolean } | { kind: "checking" } | ({ kind: "taken" } & Pick<Taken, "suggestions" | "recommended">);

/** NICKNAME → NICK-CHECK → NICK-TAKEN. The nickname is kept through errors (handoff). */
export function NicknameStep() {
  const copy = getNicknameStep();
  const shared = getOnboardingShared();
  const flow = getStepFlow("nickname");
  const { save, saving, error } = useSaveStep("nickname");
  const suggestions = useLoaded(onboardingService.getNicknameSuggestions).value ?? copy.suggestions;
  const noteId = useId();
  const draft = useProfileDraft();
  const [phase, setPhase] = useState<Phase>({ kind: "edit" });
  // Ignores a response that arrives after Back or a new check.
  const request = useRef(0);
  const nickname = draft.fields.nickname ?? "";

  const edit = (value: string) => {
    request.current += 1;
    profileDraft.setFields({ nickname: value });
    setPhase({ kind: "edit" });
  };

  async function check(value: string) {
    const name = value.trim();
    profileDraft.setFields({ nickname: name });
    if (!NICKNAME.test(name)) {
      setPhase({ kind: "edit", invalid: true });
      return;
    }
    const id = ++request.current;
    setPhase({ kind: "checking" });
    const result = await onboardingService.checkNickname(name);
    if (id !== request.current) return;
    if (!result.available) {
      setPhase({ kind: "taken", suggestions: result.suggestions, recommended: result.recommended });
      return;
    }
    setPhase({ kind: "edit" });
    await save();
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (phase.kind !== "checking" && !saving) void check(nickname);
  }

  const field = { label: copy.field.label, value: nickname, onChange: edit, placeholder: copy.field.placeholder, maxLength: MAX_LENGTH, autoComplete: "nickname" };
  const back = <SetupBack onClick={() => edit(nickname)} />;

  if (phase.kind === "checking") {
    return (
      <SetupStep intro={copy.checking.intro} onSubmit={submit} busy back={back} primary={<SetupPrimary label={copy.checking.primary} busy />}>
        <TextField {...field} state="disabled" describedBy={noteId} />
        <StatusNote variant="pending" id={noteId} message={copy.checking.note} />
      </SetupStep>
    );
  }

  if (phase.kind === "edit") {
    return (
      <SetupStep
        intro={copy.intro}
        onSubmit={submit}
        back={<SetupBack link={flow.back} />}
        primary={<SetupPrimary label={shared.continueLabel} busy={saving} />}
        busy={saving}
        revealDelay={0}
      >
        <TextField {...field} state={phase.invalid ? "error" : "default"} message={copy.invalid} />
        <SuggestionChips label={copy.suggestionsLabel} suggestions={suggestions} onPick={edit} />
        <SetupError message={error} />
      </SetupStep>
    );
  }

  return (
    <SetupStep
      intro={copy.taken.intro}
      onSubmit={submit}
      back={back}
      primary={<SetupPrimary label={copy.taken.primary.replace("{name}", phase.recommended)} onClick={() => void check(phase.recommended)} />}
    >
      <TextField {...field} state="error" message={copy.taken.message} />
      <SuggestionChips label={copy.suggestionsLabel} suggestions={phase.suggestions} onPick={edit} />
    </SetupStep>
  );
}
