"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { ActionRow } from "@/components/pieces/actions/action-row";
import { CheckboxField } from "@/components/pieces/forms/checkbox-field";
import { FormHeader } from "@/components/pieces/forms/form-header";
import { PortalBack } from "@/components/pieces/actions/portal-back";
import { SelectField } from "@/components/pieces/forms/select-field";
import { Text } from "@/components/pieces/content/text";
import { TextField } from "@/components/pieces/forms/text-field";
import { Button } from "@/components/ui/button";
import type { DistancePreference, MeetPreference, Preferences } from "@/data/portal/types";
import { hrefFor } from "@/lib/routes";
import { portalService } from "@/lib/portal/portal-service";
import { useLoaded } from "@/hooks/use-loaded";
import { getFiltersPage, getPortalShell } from "@/stores/portal-store";
import { FlowContext } from "@/components/sections/portal/shared/flow-context";
import { Workspace } from "@/components/sections/portal/shared/workspace";
import { screenKeys } from "@/lib/screen-keys";

type AgeErrors = { min?: string; max?: string };

/** Whole ages only ("25"), within the allowed limits; anything else is null. */
function parseAge(value: string) {
  const { min, max } = getFiltersPage().ageLimits;
  if (!/^\d{1,3}$/.test(value.trim())) return null;
  const age = Number(value);
  return age >= min && age <= max ? age : null;
}

/** W04 / FILTERS: saved preferences are edited as one form; Show matches and Reset filters open DISCOVER. */
export function FiltersView() {
  const saved = useLoaded(screenKeys.preferences, portalService.getPreferences).value;
  // The form mounts once the saved preferences are read, so it starts from them.
  return (
    <Workspace aside={<FlowContext />}>
      <PortalBack action={getPortalShell().back} />
      {saved ? <FiltersForm saved={saved} /> : <FiltersHeading />}
    </Workspace>
  );
}

function FiltersHeading() {
  const copy = getFiltersPage();
  return <FormHeader variant="portal" title={copy.title} description={copy.description} />;
}

function FiltersForm({ saved }: { saved: Preferences }) {
  const copy = getFiltersPage();
  const router = useRouter();
  const [meet, setMeet] = useState<MeetPreference>(saved.meet);
  const [distance, setDistance] = useState<DistancePreference>(saved.distance);
  const [minAge, setMinAge] = useState(String(saved.minAge));
  const [maxAge, setMaxAge] = useState(String(saved.maxAge));
  const [verifiedOnly, setVerifiedOnly] = useState(saved.verifiedOnly);
  const [sharedInterest, setSharedInterest] = useState(saved.sharedInterest);
  const [errors, setErrors] = useState<AgeErrors>({});
  const [busy, setBusy] = useState(false);

  const validate = (): Preferences | null => {
    const min = parseAge(minAge);
    const max = parseAge(maxAge);
    const next: AgeErrors = { min: min === null ? copy.ageInvalid : undefined, max: max === null ? copy.ageInvalid : undefined };
    if (min !== null && max !== null && min > max) next.min = copy.ageError;
    setErrors(next);
    if (next.min || next.max || min === null || max === null) return null;
    return { meet, distance, minAge: min, maxAge: max, verifiedOnly, sharedInterest };
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (busy) return;
    const preferences = validate();
    if (!preferences) return;
    setBusy(true);
    try {
      await portalService.savePreferences(preferences);
      router.push(hrefFor("DISCOVER"));
    } catch {
      setBusy(false);
    }
  };

  const reset = async () => {
    if (busy) return;
    setBusy(true);
    await portalService.resetPreferences();
    router.push(hrefFor("DISCOVER"));
  };

  const ageField = (label: string, value: string, onChange: (value: string) => void, error?: string) => (
    <TextField
      label={label}
      value={value}
      onChange={onChange}
      inputMode="numeric"
      maxLength={3}
      required
      state={error ? "error" : "default"}
      message={error}
      className="sm:flex-1"
    />
  );

  return (
    <form onSubmit={submit} noValidate aria-busy={busy || undefined} className="flex w-full flex-col gap-5">
      <FiltersHeading />
      <div className="flex flex-col gap-4 sm:flex-row">
        <SelectField
          label={copy.fields.meet.label}
          value={meet}
          onChange={(value) => setMeet(copy.fields.meet.options.find((option) => option.value === value)?.value ?? meet)}
          options={copy.fields.meet.options}
          className="sm:flex-1"
        />
        <SelectField
          label={copy.fields.distance.label}
          value={distance}
          onChange={(value) => setDistance(copy.fields.distance.options.find((option) => option.value === value)?.value ?? distance)}
          options={copy.fields.distance.options}
          className="sm:flex-1"
        />
      </div>
      <fieldset>
        <Text as="legend" variant="text14Semibold" tone="strong" className="mb-2">
          {copy.fields.ageRange.label}
        </Text>
        <div className="flex flex-col gap-4 sm:flex-row">
          {ageField(copy.fields.ageRange.min, minAge, setMinAge, errors.min)}
          {ageField(copy.fields.ageRange.max, maxAge, setMaxAge, errors.max)}
        </div>
      </fieldset>
      <div className="flex flex-col gap-3 sm:flex-row">
        <CheckboxField label={copy.fields.verifiedOnly} checked={verifiedOnly} onChange={setVerifiedOnly} className="sm:flex-1" />
        <CheckboxField label={copy.fields.sharedInterest} checked={sharedInterest} onChange={setSharedInterest} className="sm:flex-1" />
      </div>
      <ActionRow>
        <Button type="submit" variant="confirm" size="portalPill" width="grow" disabled={busy} aria-busy={busy || undefined}>
          {busy ? copy.saving : copy.primary}
        </Button>
        <Button type="button" variant="roseOutline" size="portalPill" width="grow" disabled={busy} onClick={() => void reset()}>
          {copy.reset}
        </Button>
      </ActionRow>
    </form>
  );
}
