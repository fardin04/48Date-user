"use client";

import { useId, type FormEvent } from "react";
import { ChoiceCard } from "@/components/pieces/forms/choice-card";
import { ChoiceGroup } from "@/components/pieces/forms/choice-group";
import { SetupStep } from "@/components/pieces/shells/setup-step";
import { Text } from "@/components/pieces/content/text";
import type { Choice, DraftField, OnboardingStep, SetupIntro } from "@/data/onboarding/types";
import { profileDraft, useProfileDraft } from "@/lib/onboarding/profile-draft";
import { useOnboardingOptions } from "@/hooks/use-onboarding-options";
import { interestChoices } from "@/lib/onboarding/options";
import { getInterestRules, getOnboardingShared, getStepFlow } from "@/stores/onboarding-store";
import { SetupBack, SetupError, SetupPrimary, useSaveStep } from "./step-actions";

type ChoiceStepProps = {
  step: OnboardingStep;
  intro: SetupIntro;
  mode: "single" | "multiple";
  /** Draft field of a single choice; multiple choices are the interests list. */
  field?: DraftField;
  choices: Choice[];
};

/** INTERESTS (up to five cards) and GOALS / PERSONALITY / COMMUNICATION (one card). */
export function ChoiceStep({ step, intro, mode, field, choices: cards }: ChoiceStepProps) {
  const shared = getOnboardingShared();
  const rules = getInterestRules();
  const name = useId();
  const draft = useProfileDraft();
  const options = useOnboardingOptions();
  const { save, saving, error } = useSaveStep(step);
  const multiple = mode === "multiple";
  // Interests carry the API's ids when the API lists them.
  const choices = multiple ? interestChoices(cards, options?.interests, cards[0].icon) : cards;
  // Only answers that are still on offer count (a saved id the list no longer has is dropped).
  const offered = new Set(choices.map((choice) => choice.value));
  const answers = multiple ? draft.interests : [field ? draft.fields[field] : undefined];
  const selected = answers.filter((value): value is string => Boolean(value) && offered.has(value as string));
  const full = multiple && selected.length >= rules.max;

  function toggle(value: string, checked: boolean) {
    if (!multiple) {
      if (field) profileDraft.setFields({ [field]: value });
      return;
    }
    profileDraft.update((current) => {
      const interests = current.interests.filter((item) => item !== value && offered.has(item));
      return { ...current, interests: checked && interests.length < rules.max ? [...interests, value] : interests };
    });
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (selected.length === 0) return;
    if (multiple) profileDraft.update((current) => ({ ...current, interests: selected }));
    void save();
  }

  return (
    <SetupStep
      intro={intro}
      onSubmit={submit}
      back={<SetupBack link={getStepFlow(step).back} />}
      primary={<SetupPrimary label={shared.continueLabel} disabled={selected.length === 0} busy={saving} />}
      busy={saving}
      revealDelay={0}
    >
      <ChoiceGroup legend={intro.title}>
        {choices.map((choice) => {
          const checked = selected.includes(choice.value);
          return (
            <ChoiceCard
              key={choice.value}
              choice={choice}
              type={multiple ? "checkbox" : "radio"}
              name={name}
              checked={checked}
              disabled={full && !checked}
              size={multiple ? "compact" : "regular"}
              onChange={(next) => toggle(choice.value, next)}
            />
          );
        })}
      </ChoiceGroup>
      {multiple && (
        <>
          <Text variant="text12" tone="sub">
            {rules.note}
          </Text>
          <p className="sr-only" aria-live="polite">
            {rules.count.replace("{count}", String(selected.length)).replace("{max}", String(rules.max))}
          </p>
        </>
      )}
      <SetupError message={error} />
    </SetupStep>
  );
}
