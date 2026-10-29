"use client";

import { useRouter } from "next/navigation";
import { useId, useState, type FormEvent } from "react";
import { ActionButton } from "@/components/pieces/actions/action-button";
import { ActionRow } from "@/components/pieces/actions/action-row";
import { FormHeader } from "@/components/pieces/forms/form-header";
import { OptionRow } from "@/components/pieces/forms/option-row";
import { PickerButton } from "@/components/pieces/forms/picker-button";
import { PortalBack } from "@/components/pieces/actions/portal-back";
import { PortalDialog } from "@/components/pieces/overlays/portal-dialog";
import { StatusNote } from "@/components/pieces/feedback/status-note";
import { TextAreaField } from "@/components/pieces/forms/text-area-field";
import { Button } from "@/components/ui/button";
import { reportReasons, type ReportReason } from "@/data/portal/account";
import { memberIds, type MemberId } from "@/data/portal/types";
import type { Action } from "@/data/types";
import { fill } from "@/lib/format";
import { accountService, type ReportSubject } from "@/lib/portal/account-service";
import { chatService } from "@/lib/portal/chat-service";
import { hrefFor, to, toItem } from "@/lib/routes";
import { getAccountPage, getChatPage, getMember } from "@/stores/portal-store";
import { ProfileContext } from "@/components/sections/portal/profile/profile-context";
import { StatusScreen } from "@/components/sections/portal/shared/status-screen";
import { Workspace } from "@/components/sections/portal/shared/workspace";

type Errors = { reason?: string; details?: string };

const isMember = (id: string): id is MemberId => (memberIds as readonly string[]).includes(id);

/**
 * W09 / REPORT-DETAIL with SELECT-REPORT (opened on arrival, as drawn) and REPORT-DONE on the same
 * URL. The report is private: the member never sees who sent it.
 */
export function ReportView({ subject: param }: { subject: string | null }) {
  const copy = getAccountPage();
  const page = copy.report;
  const router = useRouter();
  const name = useId();
  const member = param && isMember(param) ? param : null;
  const subject: ReportSubject = param ? { kind: member ? "member" : "story", id: param } : null;
  // Cancel returns to where the report started: the conversation, the story, or Privacy & safety.
  const cancel: Action = {
    label: page.cancel,
    to: member ? toItem("CHAT-01", member) : param ? toItem("STORY-DETAIL", param) : to("PRIVACY"),
  };
  const back: Action = { ...page.back, to: cancel.to };

  const [reason, setReason] = useState<ReportReason | null>(null);
  const [choice, setChoice] = useState<ReportReason>(reportReasons[0]);
  const [picking, setPicking] = useState(true);
  const [details, setDetails] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const [sent, setSent] = useState(false);
  const [blocking, setBlocking] = useState(false);

  const openPicker = (open: boolean) => {
    if (open) setChoice(reason ?? reportReasons[0]);
    setPicking(open);
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (busy) return;
    const found: Errors = {};
    if (!reason) found.reason = page.errors.reason;
    if (details.trim().length < page.limits.detailsMin) found.details = page.errors.details;
    setErrors(found);
    setFailed(false);
    if (!reason || Object.keys(found).length > 0) return;
    setBusy(true);
    try {
      await accountService.report(subject, reason, details.trim());
      setSent(true);
    } catch {
      setFailed(true);
    }
    setBusy(false);
  };

  const block = async () => {
    if (!member || busy) return;
    setBusy(true);
    await chatService.block(member);
    router.push(hrefFor("CHAT-01", member));
  };

  if (sent) {
    const { done } = page;
    const blockCopy = getChatPage().block;
    return (
      <>
        <StatusScreen
          back={<PortalBack action={back} />}
          title={done.title}
          description={done.description}
          summary={done.summary}
          primary={member ? { label: done.block, onClick: () => setBlocking(true) } : done.secondary}
          secondary={member ? done.secondary : undefined}
          aside={<ProfileContext />}
          actionWidth="actionSlot"
        />
        {member && (
          <PortalDialog
            open={blocking}
            onOpenChange={setBlocking}
            title={fill(blockCopy.title, { name: getMember(member).name })}
            description={blockCopy.description}
            closeLabel={blockCopy.close}
            header="fit"
            actions={
              <>
                <Button type="button" variant="confirm" size="portalPill" width="full" disabled={busy} aria-busy={busy || undefined} onClick={() => void block()}>
                  {blockCopy.confirm}
                </Button>
                <Button type="button" variant="roseOutline" size="portalPill" width="full" disabled={busy} onClick={() => setBlocking(false)}>
                  {blockCopy.keep}
                </Button>
              </>
            }
          />
        )}
      </>
    );
  }

  return (
    <Workspace aside={<ProfileContext />}>
      <PortalBack action={back} />
      <form onSubmit={submit} noValidate aria-busy={busy || undefined} className="flex w-full flex-col gap-5">
        <FormHeader variant="portalStatus" title={page.title} description={page.description} />
        <PickerButton
          label={page.fields.reason}
          value={reason ? page.reasons[reason] : ""}
          placeholder={page.placeholders.reason}
          onClick={() => openPicker(true)}
          state={errors.reason ? "error" : "default"}
          message={errors.reason}
        />
        <TextAreaField
          label={page.fields.details}
          value={details}
          onChange={(value) => {
            setDetails(value);
            setErrors((current) => ({ ...current, details: undefined }));
          }}
          placeholder={page.placeholders.details}
          maxLength={page.limits.details}
          message={errors.details}
        />
        {failed && <StatusNote variant="alert" message={page.failed} />}
        <ActionRow>
          <Button type="submit" variant="confirm" size="portalPill" width="actionSlot" disabled={busy} aria-busy={busy || undefined}>
            {busy ? page.submitting : page.submit}
          </Button>
          <ActionButton action={cancel} variant="roseOutline" size="portalPill" width="actionSlot" />
        </ActionRow>
      </form>
      <PortalDialog
        open={picking}
        onOpenChange={openPicker}
        title={page.dialog.title}
        description={page.dialog.description}
        closeLabel={page.dialog.close}
        header="fit"
        actions={
          <Button
            type="button"
            variant="confirm"
            size="portalPill"
            width="full"
            onClick={() => {
              setReason(choice);
              setErrors((current) => ({ ...current, reason: undefined }));
              setPicking(false);
            }}
          >
            {page.dialog.confirm}
          </Button>
        }
      >
        <fieldset className="flex w-full flex-col gap-6">
          <legend className="sr-only">{page.dialog.title}</legend>
          {reportReasons.map((item) => (
            <OptionRow key={item} variant="choice" name={name} value={item} label={page.reasons[item]} checked={choice === item} onSelect={() => setChoice(item)} />
          ))}
        </fieldset>
      </PortalDialog>
    </Workspace>
  );
}
