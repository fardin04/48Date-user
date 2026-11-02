"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { ActionRow } from "@/components/pieces/actions/action-row";
import { CardHeading } from "@/components/pieces/content/card-heading";
import { FormHeader } from "@/components/pieces/forms/form-header";
import { MemberRow } from "@/components/pieces/cards/member-row";
import { OptionRow } from "@/components/pieces/forms/option-row";
import { PortalBack } from "@/components/pieces/actions/portal-back";
import { PortalCard } from "@/components/pieces/layout/portal-card";
import { StatusNote } from "@/components/pieces/feedback/status-note";
import { Button } from "@/components/ui/button";
import { useServiceAction } from "@/hooks/use-service-action";
import type { FeedbackAnswer } from "@/data/portal/dates";
import type { MemberId } from "@/data/portal/types";
import { fill } from "@/lib/format";
import { formatDay } from "@/lib/portal/date-format";
import { dateService } from "@/lib/portal/date-service";
import { useDatePlan } from "@/hooks/use-date-plan";
import { hrefFor, toItem } from "@/lib/routes";
import { getDatePage } from "@/stores/portal-store";
import { DateContext } from "@/components/sections/portal/dates/date-context";
import { StatusScreen } from "@/components/sections/portal/shared/status-screen";
import { Workspace } from "@/components/sections/portal/shared/workspace";

/** W06 / FEEDBACK and FEEDBACK-DONE: four respectful questions; skipping opens DATE-COMPLETE. */
export function FeedbackView({ memberId }: { memberId: MemberId }) {
  const copy = getDatePage();
  const router = useRouter();
  const { plan, setPlan } = useDatePlan(memberId);
  const [answers, setAnswers] = useState<Record<string, FeedbackAnswer>>({});
  const [error, setError] = useState(false);
  const { busy, failure, run } = useServiceAction(getDatePage().failed);
  if (!plan) return null;

  const back = <PortalBack action={{ ...copy.back, to: toItem("DATE-PENDING", memberId) }} />;
  const aside = <DateContext member={memberId} place={plan.place} />;
  const complete = toItem("DATE-COMPLETE", memberId);

  if (plan.feedback === "submitted") {
    const done = copy.feedbackDone;
    return <StatusScreen back={back} title={done.title} description={done.description} summary={done.summary} primary={{ label: done.primary, to: complete }} aside={aside} actionWidth="actionSlot" />;
  }

  const questions = copy.feedback.questions;
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (busy) return;
    if (questions.some((question) => !answers[question.id])) return setError(true);
    await run(async () => setPlan(await dateService.submitFeedback(memberId, answers)));
  };
  const skip = async () => {
    if (await run(() => dateService.submitFeedback(memberId, null))) router.push(hrefFor("DATE-COMPLETE", memberId));
  };

  return (
    <Workspace aside={aside}>
      {back}
      <form onSubmit={submit} noValidate aria-busy={busy || undefined} className="flex w-full flex-col gap-5">
        <FormHeader variant="portalStatus" title={copy.feedback.title} description={fill(copy.feedback.description, { name: plan.partner.name })} />
        <MemberRow photo={plan.partner.photo} title={plan.partner.name} description={fill(copy.member.feedbackLine, { date: plan.date ? formatDay(plan.date) : "" })} />
        {questions.map((question) => (
          <PortalCard key={question.id} as="section" surface="outline" padding="sm" aria-labelledby={`feedback-${question.id}`} className="flex w-full flex-col gap-4">
            <CardHeading as="h2" id={`feedback-${question.id}`} size={14} title={question.title} />
            <fieldset className="flex flex-col gap-4">
              <legend className="sr-only">{question.title}</legend>
              {(Object.keys(copy.feedback.answers) as FeedbackAnswer[]).map((answer) => (
                <OptionRow
                  key={answer}
                  variant="choice"
                  name={`feedback-${question.id}`}
                  value={answer}
                  label={copy.feedback.answers[answer]}
                  checked={answers[question.id] === answer}
                  onSelect={() => {
                    setAnswers((current) => ({ ...current, [question.id]: answer }));
                    setError(false);
                  }}
                />
              ))}
            </fieldset>
          </PortalCard>
        ))}
        {error && <StatusNote variant="alert" message={copy.feedback.required} />}
        {failure && <StatusNote variant="alert" message={failure} />}
        <ActionRow>
          <Button type="submit" variant="confirm" size="portalPill" width="actionSlot" disabled={busy} aria-busy={busy || undefined}>
            {busy ? copy.feedback.submitting : copy.feedback.submit}
          </Button>
          <Button type="button" variant="roseOutline" size="portalPill" width="actionSlot" disabled={busy} onClick={() => void skip()}>
            {copy.feedback.skip}
          </Button>
        </ActionRow>
      </form>
    </Workspace>
  );
}
