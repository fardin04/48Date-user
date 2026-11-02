"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { ActionRow } from "@/components/pieces/actions/action-row";
import { CardHeading } from "@/components/pieces/content/card-heading";
import { DetailRow } from "@/components/pieces/cards/detail-row";
import { OtpField } from "@/components/pieces/forms/otp-field";
import { PortalCard } from "@/components/pieces/layout/portal-card";
import { StatusNote } from "@/components/pieces/feedback/status-note";
import { TextField } from "@/components/pieces/forms/text-field";
import { Button } from "@/components/ui/button";
import { googleMode } from "@/lib/auth/google-mode";
import { renderGoogleButton } from "@/lib/auth/google-identity";
import { accountService } from "@/lib/portal/account-service";
import { screenKeys } from "@/lib/screen-keys";
import { useLoaded } from "@/hooks/use-loaded";
import { useServiceAction } from "@/hooks/use-service-action";
import { getSignInMethodsCopy } from "@/stores/portal-store";

/** E.164: "+" and 8–15 digits. */
const E164 = /^\+[1-9]\d{7,14}$/;

/** Google's button, linking the Google account it returns. */
function LinkGoogle({ onToken }: { onToken: (idToken: string) => void }) {
  const slot = useRef<HTMLDivElement>(null);
  const latest = useRef(onToken);
  useEffect(() => {
    latest.current = onToken;
  });
  // Rendered once; the newest handler receives the token.
  useEffect(() => {
    if (slot.current) void renderGoogleButton(slot.current, (token) => latest.current(token), () => undefined).catch(() => undefined);
  }, []);
  return <div ref={slot} className="flex min-h-11" />;
}

/**
 * ACCOUNT "Sign-in methods" (design-silent): the masked phone and the Google email, with link and
 * remove. The service refuses to remove the last method and explains why.
 */
export function SignInMethods() {
  const copy = getSignInMethodsCopy();
  const { value: methods, reload } = useLoaded(screenKeys.signInMethods, accountService.getSignInMethods);
  const { busy, failure, run } = useServiceAction(copy.failed);
  const [linking, setLinking] = useState<"idle" | "phone" | "code">("idle");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [phoneError, setPhoneError] = useState(false);

  if (!methods) return null;
  const both = methods.phone !== null && methods.google !== null;
  const act = (action: () => Promise<void>) => run(async () => {
    await action();
    await reload();
  });

  const sendCode = async (event: FormEvent) => {
    event.preventDefault();
    const number = phone.replace(/[\s()-]/g, "");
    if (!E164.test(number)) return setPhoneError(true);
    setPhone(number);
    if (await run(() => accountService.sendLinkCode(number))) setLinking("code");
  };

  const confirm = async (event: FormEvent) => {
    event.preventDefault();
    if (code.length !== 6) return;
    if (await act(() => accountService.linkPhone(phone, code))) {
      setLinking("idle");
      setCode("");
    }
  };

  return (
    <PortalCard as="section" surface="outline" padding="sm" aria-labelledby="sign-in-methods" className="flex w-full flex-col gap-4">
      <CardHeading id="sign-in-methods" size={14} title={copy.title} description={copy.description} />
      <dl className="flex w-full flex-col">
        <DetailRow label={copy.phone} value={methods.phone ?? copy.notLinked} divided />
        <DetailRow label={copy.google} value={methods.google ?? copy.notLinked} divided />
      </dl>
      {failure && <StatusNote variant="alert" message={failure} />}
      {linking === "phone" && (
        <form onSubmit={sendCode} noValidate className="flex flex-col gap-4">
          <TextField
            label={copy.phoneField}
            value={phone}
            onChange={(value) => {
              setPhone(value);
              setPhoneError(false);
            }}
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder={copy.phonePlaceholder}
            state={phoneError ? "error" : busy ? "disabled" : "default"}
            message={phoneError ? copy.phoneInvalid : undefined}
          />
          <ActionRow>
            <Button type="submit" variant="confirm" size="portalPill" width="actionSlot" disabled={busy} aria-busy={busy || undefined}>
              {busy ? copy.sending : copy.sendCode}
            </Button>
            <Button type="button" variant="roseOutline" size="portalPill" width="actionSlot" disabled={busy} onClick={() => setLinking("idle")}>
              {copy.cancel}
            </Button>
          </ActionRow>
        </form>
      )}
      {linking === "code" && (
        <form onSubmit={confirm} noValidate className="flex flex-col gap-4">
          <OtpField label={copy.code} value={code} onChange={setCode} state={busy ? "disabled" : "default"} />
          <ActionRow>
            <Button type="submit" variant="confirm" size="portalPill" width="actionSlot" disabled={busy || code.length !== 6} aria-busy={busy || undefined}>
              {busy ? copy.confirming : copy.confirm}
            </Button>
            <Button type="button" variant="roseOutline" size="portalPill" width="actionSlot" disabled={busy} onClick={() => setLinking("idle")}>
              {copy.cancel}
            </Button>
          </ActionRow>
        </form>
      )}
      {linking === "idle" && (
        <ActionRow>
          {methods.phone === null ? (
            <Button type="button" variant="roseOutline" size="portalPill" width="actionSlot" onClick={() => setLinking("phone")}>
              {copy.linkPhone}
            </Button>
          ) : (
            both && (
              <Button type="button" variant="roseOutline" size="portalPill" width="actionSlot" disabled={busy} onClick={() => void act(accountService.unlinkPhone)}>
                {busy ? copy.removing : `${copy.remove} · ${copy.phone}`}
              </Button>
            )
          )}
          {methods.google === null
            ? googleMode === "live" && <LinkGoogle onToken={(token) => void act(() => accountService.linkGoogle(token))} />
            : both && (
                <Button type="button" variant="roseOutline" size="portalPill" width="actionSlot" disabled={busy} onClick={() => void act(accountService.unlinkGoogle)}>
                  {busy ? copy.removing : `${copy.remove} · ${copy.google}`}
                </Button>
              )}
        </ActionRow>
      )}
    </PortalCard>
  );
}
