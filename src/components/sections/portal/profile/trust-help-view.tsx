"use client";

import { useState, type FormEvent } from "react";
import { ActionRow } from "@/components/pieces/actions/action-row";
import { FormHeader } from "@/components/pieces/forms/form-header";
import { PortalBack } from "@/components/pieces/actions/portal-back";
import { SelectField } from "@/components/pieces/forms/select-field";
import { StatusNote } from "@/components/pieces/feedback/status-note";
import { TextAreaField } from "@/components/pieces/forms/text-area-field";
import { Button } from "@/components/ui/button";
import { accountService } from "@/lib/portal/account-service";
import { getAccountPage } from "@/stores/portal-store";
import { ProfileContext } from "@/components/sections/portal/profile/profile-context";
import { StatusScreen } from "@/components/sections/portal/shared/status-screen";
import { Workspace } from "@/components/sections/portal/shared/workspace";

type Errors = { event?: string; explanation?: string };

/** W09 / TRUST-HELP, then TRUST-REVIEW on the same URL. The request stays private to the review team. */
export function TrustHelpView() {
  const copy = getAccountPage();
  const page = copy.trustHelp;
  const events = copy.trustHistory.events.map((event) => ({ value: event.label, label: event.label }));
  const [event, setEvent] = useState("");
  const [explanation, setExplanation] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async (submitEvent: FormEvent) => {
    submitEvent.preventDefault();
    if (busy) return;
    const found: Errors = {};
    if (!event) found.event = page.errors.event;
    if (explanation.trim().length < page.limits.explanationMin) found.explanation = page.errors.explanation;
    setErrors(found);
    setFailed(false);
    if (Object.keys(found).length > 0) return;
    setBusy(true);
    try {
      await accountService.requestTrustReview(event, explanation.trim());
      setSent(true);
    } catch {
      setFailed(true);
    }
    setBusy(false);
  };

  if (sent) {
    const { done } = page;
    return (
      <StatusScreen
        back={<PortalBack action={page.back} />}
        title={done.title}
        description={done.description}
        summary={done.summary}
        primary={done.primary}
        aside={<ProfileContext />}
        actionWidth="actionSlot"
      />
    );
  }

  return (
    <Workspace aside={<ProfileContext />}>
      <PortalBack action={page.back} />
      <form onSubmit={submit} noValidate aria-busy={busy || undefined} className="flex w-full flex-col gap-5">
        <FormHeader variant="portalStatus" title={page.title} description={page.description} />
        <SelectField
          label={page.fields.event}
          value={event}
          onChange={(value) => {
            setEvent(value);
            setErrors((current) => ({ ...current, event: undefined }));
          }}
          options={events}
          placeholder={page.placeholders.event}
          state={errors.event ? "error" : "default"}
          message={errors.event}
        />
        <TextAreaField
          label={page.fields.explanation}
          value={explanation}
          onChange={(value) => {
            setExplanation(value);
            setErrors((current) => ({ ...current, explanation: undefined }));
          }}
          placeholder={page.placeholders.explanation}
          maxLength={page.limits.explanation}
          message={errors.explanation}
        />
        {failed && <StatusNote variant="alert" message={page.failed} />}
        <ActionRow>
          <Button type="submit" variant="confirm" size="portalPill" width="actionSlot" disabled={busy} aria-busy={busy || undefined}>
            {busy ? page.submitting : page.submit}
          </Button>
        </ActionRow>
      </form>
    </Workspace>
  );
}
