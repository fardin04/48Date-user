"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { ActionButton } from "@/components/pieces/actions/action-button";
import { ActionRow } from "@/components/pieces/actions/action-row";
import { FormHeader } from "@/components/pieces/forms/form-header";
import { OptionRow } from "@/components/pieces/forms/option-row";
import { PortalBack } from "@/components/pieces/actions/portal-back";
import { SelectField } from "@/components/pieces/forms/select-field";
import { StatusBadge } from "@/components/pieces/feedback/status-badge";
import { StatusNote } from "@/components/pieces/feedback/status-note";
import { StatusSummary } from "@/components/pieces/feedback/status-summary";
import { TextAreaField } from "@/components/pieces/forms/text-area-field";
import { Button } from "@/components/ui/button";
import type { NoShowReason } from "@/data/portal/dates";
import type { MemberId } from "@/data/portal/types";
import { fill } from "@/lib/format";
import { formatShortDay, formatTime, hasPassed } from "@/lib/portal/date-format";
import { dateService, type DatePlan } from "@/lib/portal/date-service";
import { useDatePlan } from "@/hooks/use-date-plan";
import { useMatchClock } from "@/hooks/use-match-clock";
import { useServiceAction } from "@/hooks/use-service-action";
import { hrefFor, toItem } from "@/lib/routes";
import { getDatePage, getMemberName } from "@/stores/portal-store";
import { DateContext } from "@/components/sections/portal/dates/date-context";
import { DateSummary } from "@/components/sections/portal/dates/date-summary";
import { StatusScreen } from "@/components/sections/portal/shared/status-screen";
import { Workspace } from "@/components/sections/portal/shared/workspace";

/**
 * `/dates/plan/<member>` (rule 32): DATE-PENDING, the received invitation, DATE-CONFIRMED,
 * DATE-DECLINED, DATE-CANCELLED and DATE-INVITE-EXPIRED, then — once the date has passed —
 * ATTENDANCE, NO-SHOW, ATTENDANCE-WAIT and ATTENDANCE-REVIEW.
 */
export function PlanView({ memberId }: { memberId: MemberId }) {
  const router = useRouter();
  const clock = useMatchClock(memberId);
  const { plan, setPlan } = useDatePlan(memberId);
  const draft = plan?.status === "draft";

  // No plan yet (direct visit): start with a place.
  useEffect(() => {
    if (draft) router.replace(hrefFor("VENUES", memberId));
  }, [draft, memberId, router]);

  if (!plan || draft || clock.status === "loading") return null;
  const open = plan.status === "pending" || plan.status === "invited";
  if (open && clock.status === "expired") return <PlanStatus plan={plan} state="expired" />;
  if (plan.status === "declined" || plan.status === "cancelled") return <PlanStatus plan={plan} state={plan.status} />;
  if (plan.status === "confirmed" && plan.date && plan.time !== null && hasPassed(plan.date, plan.time)) return <Attendance plan={plan} onChange={setPlan} />;
  return <PlanDetails plan={plan} onChange={setPlan} />;
}

function PlanStatus({ plan, state }: { plan: DatePlan; state: "expired" | "declined" | "cancelled" }) {
  const copy = getDatePage();
  const name = getMemberName(plan.member);
  const chat = toItem("CHAT-01", plan.member);
  const common = {
    back: <PortalBack action={{ ...copy.back, to: chat }} />,
    aside: <DateContext member={plan.member} place={plan.place} />,
    actionWidth: "actionSlot" as const,
  };
  if (state === "declined") {
    const { declined } = copy;
    return (
      <StatusScreen
        {...common}
        title={declined.title}
        description={fill(declined.description, { name })}
        summary={declined.summary}
        primary={{ label: declined.primary, to: toItem("VENUES", plan.member) }}
        secondary={{ label: copy.conversation, to: chat }}
      />
    );
  }
  const ended = state === "cancelled" ? copy.cancelled : copy.expired;
  return <StatusScreen {...common} title={ended.title} description={fill(ended.description, { name })} summary={ended.summary} primary={ended.primary} />;
}

function PlanDetails({ plan, onChange }: { plan: DatePlan; onChange: (plan: DatePlan) => void }) {
  const copy = getDatePage();
  const { busy, failure, run } = useServiceAction(getDatePage().failed);
  const name = getMemberName(plan.member);
  const chat = toItem("CHAT-01", plan.member);
  const time = toItem("DATE-TIME", plan.member);
  const state = plan.status === "pending" ? copy.pending : plan.status === "invited" ? copy.invited : copy.confirmed;
  const badge =
    plan.status === "pending" ? (
      <StatusBadge variant="pending" label={copy.pending.badge} live={false} />
    ) : plan.status === "confirmed" ? (
      <StatusBadge variant="success" label={copy.confirmed.badge} />
    ) : undefined;

  const accept = () => run(async () => onChange(await dateService.acceptInvitation(plan.member)));
  const answer = (choice: "accept" | "decline" | "withdraw") => run(async () => onChange(await dateService.answerPostpone(plan.member, choice)));

  return (
    <Workspace aside={<DateContext member={plan.member} place={plan.place} />}>
      <PortalBack action={{ ...copy.back, to: chat }} />
      <FormHeader variant="portal" title={state.title} description={fill(state.description, { name })} badge={badge} />
      <DateSummary plan={plan} status={state.status} />
      {plan.postpone && (
        <StatusNote
          variant="pending"
          message={fill(plan.postpone.mine ? copy.postpone.mine : copy.postpone.theirs, {
            name,
            when: `${formatShortDay(plan.postpone.date)} · ${formatTime(plan.postpone.time)}`,
          })}
        />
      )}
      {plan.postpone && (
        <ActionRow>
          {plan.postpone.mine ? (
            <Button type="button" variant="roseOutline" size="portalPill" width="actionSlot" disabled={busy} onClick={() => void answer("withdraw")}>
              {copy.postpone.withdraw}
            </Button>
          ) : (
            <>
              <Button type="button" variant="confirm" size="portalPill" width="actionSlot" disabled={busy} aria-busy={busy || undefined} onClick={() => void answer("accept")}>
                {copy.postpone.accept}
              </Button>
              <Button type="button" variant="roseOutline" size="portalPill" width="actionSlot" disabled={busy} onClick={() => void answer("decline")}>
                {copy.postpone.decline}
              </Button>
            </>
          )}
        </ActionRow>
      )}
      {failure && <StatusNote variant="alert" message={failure} />}
      <ActionRow>
        {plan.status === "invited" ? (
          <>
            <Button type="button" variant="confirm" size="portalPill" width="actionSlot" disabled={busy} aria-busy={busy || undefined} onClick={() => void accept()}>
              {copy.invited.accept}
            </Button>
            <ActionButton action={{ label: copy.invited.suggest, to: time }} variant="roseOutline" size="portalPill" width="actionSlot" />
          </>
        ) : plan.status === "pending" ? (
          <>
            <ActionButton action={{ label: copy.conversation, to: chat }} variant="confirm" size="portalPill" width="actionSlot" />
            <ActionButton action={{ label: copy.pending.change, to: time }} variant="roseOutline" size="portalPill" width="actionSlot" />
          </>
        ) : (
          <>
            <ActionButton action={{ label: copy.context.chat, to: chat }} variant="confirm" size="portalPill" width="actionSlot" />
            <ActionButton action={{ label: copy.confirmed.manage, to: toItem("DATE-MANAGE", plan.member) }} variant="roseOutline" size="portalPill" width="actionSlot" />
          </>
        )}
      </ActionRow>
    </Workspace>
  );
}

function Attendance({ plan, onChange }: { plan: DatePlan; onChange: (plan: DatePlan) => void }) {
  const copy = getDatePage();
  const name = getMemberName(plan.member);
  const [choice, setChoice] = useState<"met" | "missed">("met");
  const [noShow, setNoShow] = useState(false);
  const [reason, setReason] = useState<NoShowReason | "">("");
  const [details, setDetails] = useState("");
  const [error, setError] = useState(false);
  const { busy, failure, run } = useServiceAction(getDatePage().failed);
  const back = <PortalBack action={{ ...copy.back, to: toItem("CHAT-01", plan.member) }} />;
  const aside = <DateContext member={plan.member} place={plan.place} />;

  if (plan.attendance === "waiting") {
    const wait = copy.attendanceWait;
    return (
      <Workspace aside={aside}>
        {back}
        <FormHeader variant="portal" title={wait.title} description={fill(wait.description, { name })} badge={<StatusBadge variant="pending" label={wait.badge} live={false} />} />
        <StatusSummary summary={wait.summary} />
        <ActionRow>
          <ActionButton action={{ label: wait.feedback, to: toItem("FEEDBACK", plan.member) }} variant="confirm" size="portalPill" width="actionSlot" />
          <ActionButton action={wait.matches} variant="roseOutline" size="portalPill" width="actionSlot" />
        </ActionRow>
      </Workspace>
    );
  }
  if (plan.attendance === "review") {
    const review = copy.attendanceReview;
    return <StatusScreen back={back} title={review.title} description={review.description} summary={review.summary} primary={review.primary} aside={aside} actionWidth="actionSlot" />;
  }

  const record = async (met: boolean) => {
    if (busy) return;
    if (!met && !reason) return setError(true);
    await run(async () => onChange(await dateService.recordAttendance(plan.member, met ? { met: true } : { met: false, reason: reason as NoShowReason, details: details.trim() })));
  };

  if (noShow) {
    const form = copy.noShow;
    const submit = (event: FormEvent) => {
      event.preventDefault();
      void record(false);
    };
    return (
      <Workspace aside={aside}>
        <PortalBack action={{ ...copy.back, to: toItem("CHAT-01", plan.member) }} onClick={() => setNoShow(false)} />
        <form onSubmit={submit} noValidate aria-busy={busy || undefined} className="flex w-full flex-col gap-5">
          <FormHeader variant="portalStatus" title={form.title} description={form.description} />
          <SelectField
            label={form.what}
            value={reason}
            onChange={(value) => {
              setReason(form.options.find((option) => option.value === value)?.value ?? "");
              setError(false);
            }}
            options={form.options}
            placeholder={form.whatPlaceholder}
            state={error ? "error" : "default"}
            message={form.whatRequired}
            required
          />
          <TextAreaField label={form.details} value={details} onChange={setDetails} maxLength={form.detailsMax} />
          {failure && <StatusNote variant="alert" message={failure} />}
          <ActionRow>
            <Button type="submit" variant="confirm" size="portalPill" width="actionSlot" disabled={busy} aria-busy={busy || undefined}>
              {busy ? form.submitting : form.submit}
            </Button>
            <Button type="button" variant="roseOutline" size="portalPill" width="actionSlot" disabled={busy} onClick={() => setNoShow(false)}>
              {form.back}
            </Button>
          </ActionRow>
        </form>
      </Workspace>
    );
  }

  const ask = copy.attendance;
  return (
    <Workspace aside={aside}>
      {back}
      <FormHeader variant="portalStatus" title={fill(ask.title, { name })} description={ask.description} />
      <fieldset className="flex w-full flex-col gap-5">
        <legend className="sr-only">{ask.legend}</legend>
        <OptionRow variant="choice" name="attendance" value="met" label={ask.choices.met} checked={choice === "met"} onSelect={() => setChoice("met")} />
        <OptionRow variant="choice" name="attendance" value="missed" label={ask.choices.missed} checked={choice === "missed"} onSelect={() => setChoice("missed")} />
      </fieldset>
      {failure && <StatusNote variant="alert" message={failure} />}
      <ActionRow>
        <Button type="button" variant="confirm" size="portalPill" width="actionSlot" disabled={busy} aria-busy={busy || undefined} onClick={() => void record(true)}>
          {ask.met}
        </Button>
        <Button type="button" variant="roseOutline" size="portalPill" width="actionSlot" disabled={busy} onClick={() => setNoShow(true)}>
          {ask.missed}
        </Button>
      </ActionRow>
    </Workspace>
  );
}
