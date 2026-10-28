"use client";

import { useRouter } from "next/navigation";
import { useId, useState, useSyncExternalStore, type FormEvent } from "react";
import { FormHeader } from "@/components/pieces/forms/form-header";
import { PhoneField } from "@/components/pieces/forms/phone-field";
import { StatusNote } from "@/components/pieces/feedback/status-note";
import { Text } from "@/components/pieces/content/text";
import { Button } from "@/components/ui/button";
import type { Country } from "@/data/auth/countries";
import type { Intro } from "@/data/types";
import { authService } from "@/lib/auth/auth-service";
import { isValidNational, phoneSession, toPhoneNumber, type PhoneDraft } from "@/lib/auth/phone";
import { hrefFor, type ScreenCode } from "@/lib/routes";

type PhoneStepProps = {
  intro: Intro;
  field: { label: string; countryLabel: string; placeholder: string; hint: string; invalid: string; limited: string; failed: string };
  submitLabel: string;
  countries: Country[];
  defaultCountryIso: string;
  /** Screen opened once the code is sent (OTP / OTP-SIGNIN). */
  next: ScreenCode;
};

/**
 * WELCOME / PHONE / PHONE-ERROR and SIGNIN / SIGNIN-PHONE: one phone form whose
 * state follows the input. Country and number survive validation errors and "Change number".
 */
export function PhoneStep({ intro, field, submitLabel, countries, defaultCountryIso, next }: PhoneStepProps) {
  const router = useRouter();
  const inputId = useId();
  const errorId = useId();
  const hintId = useId();
  const stored = phoneSession.parse(
    useSyncExternalStore(phoneSession.subscribe, phoneSession.snapshot, () => null),
  );
  const [draft, setDraft] = useState<PhoneDraft | null>(null);
  const [invalid, setInvalid] = useState(false);
  const [pending, setPending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);

  const value = draft ?? (stored ? { iso: stored.iso, national: stored.national } : { iso: defaultCountryIso, national: "" });
  const country = countries.find((option) => option.iso === value.iso) ?? countries[0];

  const update = (change: Partial<PhoneDraft>) => {
    setDraft({ ...value, ...change });
    setInvalid(false);
    setSendError(null);
  };

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!isValidNational(country, value.national)) {
      setInvalid(true);
      return;
    }
    if (pending) return;
    setPending(true);
    phoneSession.write(country, value.national);
    const result = await authService.sendCode(toPhoneNumber(country, value.national));
    if (result === "sent") return router.push(hrefFor(next));
    setSendError(result === "limited" ? field.limited : field.failed);
    setPending(false);
  }

  return (
    <form noValidate onSubmit={submit} aria-busy={pending} className="flex flex-col gap-6">
      <FormHeader eyebrow={intro.eyebrow} title={intro.title} description={intro.description ?? ""} revealDelay={0} />
      <PhoneField
        id={inputId}
        label={field.label}
        countryLabel={field.countryLabel}
        placeholder={field.placeholder}
        countries={countries}
        country={country}
        national={value.national}
        onCountryChange={(iso) => update({ iso })}
        onNationalChange={(national) => update({ national })}
        invalid={invalid}
        describedBy={invalid ? `${errorId} ${hintId}` : hintId}
        revealDelay={60}
      />
      {invalid && <StatusNote variant="error" id={errorId} message={field.invalid} />}
      {sendError && <StatusNote variant="error" message={sendError} />}
      <span id={hintId}>
        <Text variant="text14Relaxed" tone="sub">
          {field.hint}
        </Text>
      </span>
      <Button type="submit" variant="solid" size="pill" width="full" disabled={pending}>
        {submitLabel}
      </Button>
    </form>
  );
}
