"use client";

import { useState, type FormEvent } from "react";
import { ActionButton } from "@/components/pieces/actions/action-button";
import { ActionRow } from "@/components/pieces/actions/action-row";
import { CardHeading } from "@/components/pieces/content/card-heading";
import { FormHeader } from "@/components/pieces/forms/form-header";
import { PortalBack } from "@/components/pieces/actions/portal-back";
import { PortalCard } from "@/components/pieces/layout/portal-card";
import { SelectField } from "@/components/pieces/forms/select-field";
import { StatusNote } from "@/components/pieces/feedback/status-note";
import { TextAreaField } from "@/components/pieces/forms/text-area-field";
import { TextField } from "@/components/pieces/forms/text-field";
import { TickRow } from "@/components/pieces/forms/tick-row";
import { Button } from "@/components/ui/button";
import type { PublicProfile } from "@/data/portal/account";
import { checkProfile } from "@/lib/portal/account-rules";
import { accountService, type FieldErrors } from "@/lib/portal/account-service";
import { useLoaded } from "@/hooks/use-loaded";
import { useOnboardingOptions } from "@/hooks/use-onboarding-options";
import { getAccountPage } from "@/stores/portal-store";
import { ProfileContext } from "@/components/sections/portal/profile/profile-context";
import { ProfileSaved } from "@/components/sections/portal/profile/profile-saved";
import { LoadFailed } from "@/components/sections/portal/shared/load-failed";
import { Workspace } from "@/components/sections/portal/shared/workspace";
import { screenKeys } from "@/lib/screen-keys";

/**
 * W09 / PROFILE-EDIT, then PROFILE-SAVED on the same URL (`PATCH /users/me/profile` with the API).
 * The nickname is permanent; education and interests are read-only where the service can't change them.
 */
export function ProfileEditView() {
  const page = getAccountPage().edit;
  const { value: profile, error, reload } = useLoaded(screenKeys.profile, accountService.getProfile);
  if (profile) return <ProfileForm initial={profile} />;
  return (
    <Workspace aside={<ProfileContext />}>
      <PortalBack action={page.back} />
      <FormHeader variant="portalStatus" title={page.title} description={page.description} />
      {error !== undefined && <LoadFailed onRetry={reload} />}
    </Workspace>
  );
}

function ProfileForm({ initial }: { initial: PublicProfile }) {
  const copy = getAccountPage();
  const page = copy.edit;
  const { editable } = accountService;
  const options = useOnboardingOptions();
  const [profile, setProfile] = useState(initial);
  const [errors, setErrors] = useState<FieldErrors<PublicProfile>>({});
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const interestOptions = editable.interests ? page.interestOptions : initial.interests;

  const change = (patch: Partial<PublicProfile>) => {
    setProfile((current) => ({ ...current, ...patch }));
    setErrors((current) => {
      const next = { ...current };
      for (const key of Object.keys(patch) as (keyof PublicProfile)[]) delete next[key];
      return next;
    });
  };

  const toggleInterest = (interest: string, on: boolean) =>
    change({ interests: on ? page.interestOptions.filter((item) => item === interest || profile.interests.includes(item)) : profile.interests.filter((item) => item !== interest) });

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (busy) return;
    const next = { ...profile, occupation: profile.occupation.trim(), bio: profile.bio.trim() };
    // Values the member can't change here aren't theirs to fix.
    const found = checkProfile(next);
    delete found.nickname;
    if (!editable.interests) delete found.interests;
    setErrors(found);
    setFailed(null);
    if (Object.keys(found).length > 0) return;
    setBusy(true);
    try {
      const result = await accountService.saveProfile(next);
      if (result.ok) setSaved(true);
      else {
        setErrors(result.errors);
        if (result.message) setFailed(result.message);
      }
    } catch {
      setFailed(copy.account.failed);
    }
    setBusy(false);
  };

  if (saved) return <ProfileSaved back={page.back} name={profile.nickname.trim()} />;

  const state = (key: keyof PublicProfile) => (errors[key] ? "error" : "default");
  return (
    <Workspace aside={<ProfileContext />}>
      <PortalBack action={page.back} />
      <form onSubmit={submit} noValidate aria-busy={busy || undefined} className="flex w-full flex-col gap-5">
        <FormHeader variant="portalStatus" title={page.title} description={page.description} />
        <div className="grid gap-4 md:grid-cols-2">
          {/* The nickname is permanent once chosen (D-117). */}
          <TextField label={page.fields.nickname} value={profile.nickname} onChange={() => undefined} state="disabled" />

          <TextField
            label={page.fields.occupation}
            value={profile.occupation}
            onChange={(occupation) => change({ occupation })}
            maxLength={page.limits.occupation}
            autoComplete="organization-title"
            state={state("occupation")}
            message={errors.occupation}
          />
          <SelectField
            label={page.fields.education}
            value={profile.education}
            onChange={(education) => change({ education })}
            options={options?.fields.education ?? page.educationOptions}
            state={editable.education ? "default" : "disabled"}
          />
          <SelectField
            label={page.fields.lookingFor}
            value={profile.lookingFor}
            onChange={(lookingFor) => change({ lookingFor })}
            options={options?.fields.goal ?? page.lookingForOptions}
          />
        </div>
        <TextAreaField label={page.fields.bio} value={profile.bio} onChange={(bio) => change({ bio })} maxLength={page.limits.bio} message={errors.bio} />
        <PortalCard as="section" surface="outline" padding="sm" aria-labelledby="interests-title" className="flex w-full flex-col gap-4">
          <CardHeading id="interests-title" size={14} title={page.interests.title} description={page.interests.description} className="min-h-16 justify-center" />
          <fieldset aria-describedby={errors.interests ? "interests-error" : undefined} className="flex flex-col gap-4">
            <legend className="sr-only">{page.interests.title}</legend>
            {interestOptions.map((interest) => (
              <TickRow
                key={interest}
                label={interest}
                checked={profile.interests.includes(interest)}
                disabled={!editable.interests}
                onChange={(on) => toggleInterest(interest, on)}
              />
            ))}
          </fieldset>
          {errors.interests && <StatusNote id="interests-error" variant="alert" message={errors.interests} />}
        </PortalCard>
        {failed && <StatusNote variant="alert" message={failed} />}
        <ActionRow>
          <Button type="submit" variant="confirm" size="portalPill" width="actionSlot" disabled={busy} aria-busy={busy || undefined}>
            {busy ? page.saving : page.save}
          </Button>
          <ActionButton action={page.managePhotos} variant="roseOutline" size="portalPill" width="actionSlot" />
        </ActionRow>
      </form>
    </Workspace>
  );
}
