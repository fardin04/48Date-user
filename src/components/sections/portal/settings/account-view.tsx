"use client";

import { useState, type FormEvent } from "react";
import { ActionRow } from "@/components/pieces/actions/action-row";
import { FormHeader } from "@/components/pieces/forms/form-header";
import { PortalBack } from "@/components/pieces/actions/portal-back";
import { StatusNote } from "@/components/pieces/feedback/status-note";
import { TextField } from "@/components/pieces/forms/text-field";
import { Button } from "@/components/ui/button";
import type { AccountDetails } from "@/data/portal/account";
import { checkAccount } from "@/lib/portal/account-rules";
import { accountService, type FieldErrors } from "@/lib/portal/account-service";
import { useLoaded } from "@/hooks/use-loaded";
import { getAccountPage } from "@/stores/portal-store";
import { ProfileContext } from "@/components/sections/portal/profile/profile-context";
import { ProfileSaved } from "@/components/sections/portal/profile/profile-saved";
import { Workspace } from "@/components/sections/portal/shared/workspace";
import { screenKeys } from "@/lib/screen-keys";
import { SignInMethods } from "@/components/sections/portal/settings/sign-in-methods";

/** W09 / ACCOUNT (private name, mobile, email), then PROFILE-SAVED. Never shown on the public profile. */
export function AccountView() {
  const account = useLoaded(screenKeys.account, accountService.getAccount).value;
  const nickname = useLoaded(screenKeys.profile, accountService.getProfile).value?.nickname;
  if (!account || !nickname) return null;
  return <AccountForm initial={account} nickname={nickname} />;
}

function AccountForm({ initial, nickname }: { initial: AccountDetails; nickname: string }) {
  const page = getAccountPage().account;
  const [account, setAccount] = useState(initial);
  const [errors, setErrors] = useState<FieldErrors<AccountDetails>>({});
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const change = (key: keyof AccountDetails, value: string) => {
    setAccount((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (busy) return;
    const next = { privateName: account.privateName.trim(), phone: account.phone.trim(), email: account.email.trim() };
    const found = checkAccount(next);
    setErrors(found);
    setFailed(false);
    if (Object.keys(found).length > 0) return;
    setBusy(true);
    try {
      const result = await accountService.saveAccount(next);
      if (result.ok) setSaved(true);
      else {
        setErrors(result.errors);
        setNotice(result.message ?? null);
      }
    } catch {
      setFailed(true);
    }
    setBusy(false);
  };

  if (saved) return <ProfileSaved back={page.back} name={nickname} />;

  const field = (key: keyof AccountDetails) => ({
    label: page.fields[key],
    value: account[key],
    onChange: (value: string) => change(key, value),
    placeholder: page.placeholders[key],
    maxLength: page.limits[key],
    state: errors[key] ? ("error" as const) : ("default" as const),
    message: errors[key],
  });

  return (
    <Workspace aside={<ProfileContext />}>
      <PortalBack action={page.back} />
      <form onSubmit={submit} noValidate aria-busy={busy || undefined} className="flex w-full flex-col gap-5">
        <FormHeader variant="portalStatus" title={page.title} description={page.description} />
        <TextField {...field("privateName")} autoComplete="name" />
        <div className="grid gap-4 md:grid-cols-2">
          <TextField {...field("phone")} type="tel" inputMode="tel" autoComplete="tel" />
          <TextField {...field("email")} type="email" inputMode="email" autoComplete="email" />
        </div>
        {failed && <StatusNote variant="alert" message={page.failed} />}
        {notice && <StatusNote variant="notice" message={notice} />}
        <ActionRow>
          <Button type="submit" variant="confirm" size="portalPill" width="actionSlot" disabled={busy} aria-busy={busy || undefined}>
            {busy ? page.saving : page.save}
          </Button>
        </ActionRow>
      </form>
      <SignInMethods />
    </Workspace>
  );
}
