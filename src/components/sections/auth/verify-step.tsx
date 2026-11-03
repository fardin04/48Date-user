"use client";

import { useRouter } from "next/navigation";
import { useEffect, useId, useState, useSyncExternalStore, type FormEvent } from "react";
import { actionLinkClass, ActionLink } from "@/components/pieces/actions/action-link";
import { ActionButton } from "@/components/pieces/actions/action-button";
import { FormHeader } from "@/components/pieces/forms/form-header";
import { CODE_LENGTH, OtpField } from "@/components/pieces/forms/otp-field";
import { StatusNote } from "@/components/pieces/feedback/status-note";
import { TypingDots } from "@/components/pieces/content/typing-dots";
import { Button } from "@/components/ui/button";
import { DevOtpHint } from "@/components/sections/auth/dev-otp-hint"; // TESTING ONLY
import type { AuthFlow } from "@/data/auth/flows";
import type { authShared } from "@/data/auth/shared";
import { authService } from "@/lib/auth/auth-service";
import { maskPhone, phoneSession } from "@/lib/auth/phone";
import { hrefFor, to, type ScreenCode } from "@/lib/routes";

/** OTP · OTP-FILLED (code) · OTP-ERROR · OTP-RESEND · OTP-EXPIRED · OTP-LIMIT · VERIFY-PROCESS */
type Status = "code" | "error" | "resent" | "expired" | "limited" | "processing" | "banned" | "failed";

type VerifyStepProps = {
  copy: AuthFlow["verify"];
  code: (typeof authShared)["code"];
  entry: ScreenCode;
  verified: ScreenCode;
};

/** The verify screen of either flow; every OTP state from Figma is a status of this one URL. */
export function VerifyStep({ copy, code: text, entry, verified }: VerifyStepProps) {
  const router = useRouter();
  const noteId = useId();
  const phone = phoneSession.parse(useSyncExternalStore(phoneSession.subscribe, phoneSession.snapshot, () => null));
  const [status, setStatus] = useState<Status>("code");
  const [code, setCode] = useState("");

  // Arriving without a number (direct visit, new tab): start the flow again.
  useEffect(() => {
    if (!phoneSession.read()) router.replace(hrefFor(entry));
  }, [entry, router]);

  const masked = phone ? maskPhone(phone) : text.phoneFallback;
  const fill = (value: string) => value.replace("{phone}", masked);

  async function verify(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!phone || code.length !== CODE_LENGTH) return;
    setStatus("processing");
    const result = await authService.verifyCode(phone, code);
    if (result === "verified") return router.push(hrefFor(verified));
    // OTP-EXPIRED shows empty cells; OTP-ERROR keeps the digits so they can be edited.
    if (result === "expired") setCode("");
    setStatus(result === "mismatch" ? "error" : result);
  }

  async function resend() {
    if (!phone) return;
    setCode("");
    const result = await authService.resendCode(phone);
    setStatus(result === "sent" ? "resent" : result === "limited" ? "limited" : "failed");
  }

  const changeCode = (value: string) => {
    setCode(value);
    if (status === "error" || status === "resent" || status === "failed") setStatus("code");
  };

  if (status === "limited") {
    return (
      <div className="flex flex-col gap-6">
        <FormHeader eyebrow={copy.limit.intro.eyebrow} title={copy.limit.intro.title} description={copy.limit.intro.description ?? ""} />
        <StatusNote variant="notice" message={text.limited} />
        <ActionButton action={copy.limit.primary} variant="solid" size="pill" width="full" />
        <ActionButton action={copy.limit.secondary} variant="outline" size="pill" width="full" />
      </div>
    );
  }

  if (status === "processing") {
    return (
      <div className="flex flex-col gap-6">
        <FormHeader eyebrow={copy.eyebrow} title={copy.states.processing.title} description={fill(copy.states.processing.description ?? "")} />
        <TypingDots variant="activity" label={text.processingLabel} />
      </div>
    );
  }

  const heading = status === "resent" ? copy.states.resent : status === "expired" ? copy.states.expired : copy.states.code;
  const note =
    status === "error" ? { variant: "error" as const, message: text.mismatch } :
    status === "expired" ? { variant: "error" as const, message: text.expired } :
    status === "resent" ? { variant: "success" as const, message: text.resent } :
    status === "banned" ? { variant: "error" as const, message: text.banned } :
    status === "failed" ? { variant: "error" as const, message: text.failed } : null;

  return (
    <form noValidate onSubmit={verify} className="flex flex-col gap-6">
      <FormHeader eyebrow={copy.eyebrow} title={heading.title} description={fill(heading.description ?? "")} revealDelay={0} />
      <OtpField
        label={text.label}
        value={code}
        onChange={changeCode}
        state={status === "error" ? "error" : status === "expired" ? "disabled" : "default"}
        describedBy={note ? noteId : undefined}
        autoFocus
        revealDelay={60}
      />
      {note && <StatusNote variant={note.variant} id={noteId} message={note.message} />}
      {status !== "expired" && <DevOtpHint />}
      {status === "expired" ? (
        <Button type="button" variant="solid" size="pill" width="full" onClick={resend}>
          {text.sendNew}
        </Button>
      ) : (
        <Button type="submit" variant="solid" size="pill" width="full" disabled={status === "error" || status === "banned" || code.length !== CODE_LENGTH}>
          {status === "error" ? text.editToContinue : text.verify}
        </Button>
      )}
      <div className="flex items-center justify-between gap-4">
        <button type="button" onClick={resend} className={actionLinkClass("authRecovery")}>
          {text.resend}
        </button>
        <ActionLink action={{ label: text.changeNumber, to: to(entry) }} variant="authRecovery" />
      </div>
    </form>
  );
}
