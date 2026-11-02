"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ActionButton } from "@/components/pieces/actions/action-button";
import { ActionRow } from "@/components/pieces/actions/action-row";
import { FormHeader } from "@/components/pieces/forms/form-header";
import { OptionRow } from "@/components/pieces/forms/option-row";
import { PickerButton } from "@/components/pieces/forms/picker-button";
import { PortalBack } from "@/components/pieces/actions/portal-back";
import { PortalDialog } from "@/components/pieces/overlays/portal-dialog";
import { StatusBadge } from "@/components/pieces/feedback/status-badge";
import { TextAreaField } from "@/components/pieces/forms/text-area-field";
import { Button } from "@/components/ui/button";
import { useServiceAction } from "@/hooks/use-service-action";
import { StatusNote } from "@/components/pieces/feedback/status-note";
import type { CancelReason } from "@/data/portal/dates";
import type { MemberId } from "@/data/portal/types";
import { fill } from "@/lib/format";
import { dateService } from "@/lib/portal/date-service";
import { useDatePlan } from "@/hooks/use-date-plan";
import { hrefFor, toItem } from "@/lib/routes";
import { getDatePage, getMemberName } from "@/stores/portal-store";
import { DateContext } from "@/components/sections/portal/dates/date-context";
import { DateSummary } from "@/components/sections/portal/dates/date-summary";
import { Workspace } from "@/components/sections/portal/shared/workspace";

/** W06 / DATE-MANAGE with DATE-CANCEL and SELECT-CANCEL: change the time or cancel with a reason. */
export function ManageView({ memberId }: { memberId: MemberId }) {
  const copy = getDatePage();
  const router = useRouter();
  const { plan } = useDatePlan(memberId);
  const [dialog, setDialog] = useState<"cancel" | "reason" | null>(null);
  const [reason, setReason] = useState<CancelReason>(copy.reasonDialog.reasons[0].value);
  const [picked, setPicked] = useState<CancelReason>(reason);
  const [message, setMessage] = useState("");
  const { busy, failure, run } = useServiceAction(getDatePage().failed);
  const unmanaged = plan !== null && plan.status !== "confirmed";

  // Only a confirmed date can be changed or cancelled; anything else shows on the plan URL.
  useEffect(() => {
    if (unmanaged) router.replace(hrefFor("DATE-PENDING", memberId));
  }, [unmanaged, memberId, router]);

  if (!plan || unmanaged) return null;
  const name = getMemberName(memberId);
  const reasonLabel = copy.reasonDialog.reasons.find((option) => option.value === reason)?.label ?? "";

  const cancel = async () => {
    if (await run(() => dateService.cancel(memberId, reason, message.trim()))) router.push(hrefFor("DATE-PENDING", memberId));
    else setDialog(null);
  };
  const openReason = () => {
    setPicked(reason);
    setDialog("reason");
  };
  const applyReason = () => {
    setReason(picked);
    setDialog("cancel");
  };

  return (
    <Workspace aside={<DateContext member={memberId} place={plan.place} />}>
      <PortalBack action={{ ...copy.back, to: toItem("DATE-PENDING", memberId) }} />
      <FormHeader variant="portal" title={copy.manage.title} description={fill(copy.manage.description, { name })} badge={<StatusBadge variant="success" label={copy.confirmed.badge} />} />
      <DateSummary plan={plan} status={copy.confirmed.status} />
      {failure && <StatusNote variant="alert" message={failure} />}
      <ActionRow>
        <ActionButton action={{ label: copy.manage.suggest, to: toItem("DATE-TIME", memberId) }} variant="confirm" size="portalPill" width="actionSlot" />
        <Button type="button" variant="roseOutline" size="portalPill" width="actionSlot" onClick={() => setDialog("cancel")}>
          {copy.manage.cancel}
        </Button>
      </ActionRow>
      <PortalDialog
        open={dialog === "cancel"}
        onOpenChange={(open) => setDialog(open ? "cancel" : null)}
        header="fit"
        title={copy.cancelDialog.title}
        description={fill(copy.cancelDialog.description, { name })}
        closeLabel={copy.cancelDialog.close}
        actions={
          <>
            <Button type="button" variant="confirm" size="portalPill" width="full" disabled={busy} aria-busy={busy || undefined} onClick={() => void cancel()}>
              {busy ? copy.cancelDialog.cancelling : copy.cancelDialog.confirm}
            </Button>
            <Button type="button" variant="roseOutline" size="portalPill" width="full" disabled={busy} onClick={() => setDialog(null)}>
              {copy.cancelDialog.keep}
            </Button>
          </>
        }
      >
        <PickerButton label={copy.cancelDialog.reason} value={reasonLabel} size="compact" onClick={openReason} />
        <TextAreaField label={copy.cancelDialog.message} value={message} onChange={setMessage} placeholder={copy.cancelDialog.messagePlaceholder} maxLength={copy.cancelDialog.messageMax} disabled={busy} />
      </PortalDialog>
      <PortalDialog
        open={dialog === "reason"}
        onOpenChange={(open) => setDialog(open ? "reason" : "cancel")}
        header="fit"
        title={copy.reasonDialog.title}
        description={copy.reasonDialog.description}
        closeLabel={copy.reasonDialog.close}
        actions={
          <>
            <Button type="button" variant="confirm" size="portalPill" width="full" onClick={applyReason}>
              {copy.reasonDialog.confirm}
            </Button>
            <Button type="button" variant="roseOutline" size="portalPill" width="full" onClick={() => setDialog(null)}>
              {copy.reasonDialog.keep}
            </Button>
          </>
        }
      >
        <fieldset className="flex w-full flex-col gap-3">
          <legend className="sr-only">{copy.reasonDialog.legend}</legend>
          {copy.reasonDialog.reasons.map((option) => (
            <OptionRow key={option.value} variant="choice" name="cancel-reason" value={option.value} label={option.label} checked={picked === option.value} onSelect={() => setPicked(option.value)} />
          ))}
        </fieldset>
      </PortalDialog>
    </Workspace>
  );
}
