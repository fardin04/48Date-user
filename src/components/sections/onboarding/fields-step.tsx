"use client";

import { useState, type FormEvent } from "react";
import { SelectField } from "@/components/pieces/forms/select-field";
import { SetupStep } from "@/components/pieces/shells/setup-step";
import { TextField } from "@/components/pieces/forms/text-field";
import type { OnboardingStep, SetupField, SetupIntro } from "@/data/onboarding/types";
import { profileDraft, useProfileDraft } from "@/lib/onboarding/profile-draft";
import { useOnboardingOptions } from "@/hooks/use-onboarding-options";
import { getOnboardingShared, getStepFlow } from "@/stores/onboarding-store";
import { SetupBack, SetupError, SetupPrimary, useSaveStep } from "./step-actions";

const MAX_LENGTH = 50;

type FieldsStepProps = {
  step: OnboardingStep;
  intro: SetupIntro;
  fields: SetupField[];
};

/** PRIVATE-NAME, IDENTITY, LIFESTYLE and DETAILS: labelled fields saved as they change. */
export function FieldsStep({ step, intro, fields }: FieldsStepProps) {
  const shared = getOnboardingShared();
  const draft = useProfileDraft();
  const options = useOnboardingOptions();
  const { save, saving, error } = useSaveStep(step);
  const [attempted, setAttempted] = useState(false);

  const value = (field: SetupField) => draft.fields[field.key] ?? "";
  const missing = (field: SetupField) => !field.optional && !value(field).trim();

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAttempted(true);
    if (fields.some(missing)) return;
    profileDraft.setFields(Object.fromEntries(fields.map((field) => [field.key, value(field).trim()])));
    void save();
  }

  const renderField = (field: SetupField) => {
    const common = {
      label: field.label,
      value: value(field),
      onChange: (next: string) => profileDraft.setFields({ [field.key]: next }),
      state: attempted && missing(field) ? ("error" as const) : ("default" as const),
      message: shared.fieldError,
      required: !field.optional,
    };
    return field.type === "select" ? (
      <SelectField key={field.key} {...common} options={options?.fields[field.key] ?? field.options ?? []} placeholder={field.placeholder} />
    ) : (
      <TextField key={field.key} {...common} placeholder={field.placeholder} autoComplete={field.autoComplete} maxLength={MAX_LENGTH} />
    );
  };

  // Fields sharing a `row` sit side by side; the rest stack.
  const rows = fields.reduce<SetupField[][]>((list, field) => {
    const last = list.at(-1);
    if (field.row && last?.[0]?.row === field.row) last.push(field);
    else list.push([field]);
    return list;
  }, []);

  return (
    <SetupStep
      intro={intro}
      onSubmit={submit}
      back={<SetupBack link={getStepFlow(step).back} />}
      primary={<SetupPrimary label={shared.continueLabel} busy={saving} />}
      busy={saving}
      revealDelay={0}
    >
      {rows.map((row) =>
        row.length > 1 ? (
          <div key={row[0].key} className="grid gap-4 sm:grid-cols-2">
            {row.map(renderField)}
          </div>
        ) : (
          renderField(row[0])
        ),
      )}
      <SetupError message={error} />
    </SetupStep>
  );
}
