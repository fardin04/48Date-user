"use client";

import { useState } from "react";
import { ActionButton } from "@/components/pieces/actions/action-button";
import { ActionRow } from "@/components/pieces/actions/action-row";
import { CheckboxField } from "@/components/pieces/forms/checkbox-field";
import { DetailRow } from "@/components/pieces/cards/detail-row";
import { FormHeader } from "@/components/pieces/forms/form-header";
import { PortalBack } from "@/components/pieces/actions/portal-back";
import { StatusNote } from "@/components/pieces/feedback/status-note";
import { Button } from "@/components/ui/button";
import type { PlanId } from "@/data/portal/membership";
import { fill } from "@/lib/format";
import { membershipService } from "@/lib/portal/membership-service";
import { usePlan } from "@/hooks/use-plans";
import { getMembershipPage } from "@/stores/portal-store";
import { MembershipContext } from "@/components/sections/portal/membership/membership-context";
import { StatusScreen } from "@/components/sections/portal/shared/status-screen";
import { Workspace } from "@/components/sections/portal/shared/workspace";

type Phase = "review" | "provider" | "process" | "done" | "error";

/**
 * W10 / PAY-REVIEW with PAY-PROVIDER, PAY-PROCESS, PAY-DONE and PAY-ERROR on the same URL (the
 * -WEEKLY / -YEARLY frames are the same screens for that plan). Payment itself happens on the
 * provider's hosted page; this app never sees card data and waits for the provider's result.
 */
export function CheckoutView({ planId }: { planId: PlanId }) {
  const copy = getMembershipPage();
  const plan = usePlan(planId);
  const [phase, setPhase] = useState<Phase>("review");
  const [agreed, setAgreed] = useState(false);
  const [missing, setMissing] = useState(false);
  const values = { price: plan.price, period: plan.period, plan: plan.name, billing: plan.billing };
  const aside = <MembershipContext />;
  // Back leaves checkout for PLANS, or returns to the previous step when one is given.
  const back = (onClick?: () => void) => <PortalBack action={{ ...copy.plans.back, to: copy.review.secondary.to }} onClick={onClick} />;

  const pay = async () => {
    if (phase === "process") return;
    setPhase("process");
    setPhase((await membershipService.checkout(planId)) === "paid" ? "done" : "error");
  };

  if (phase === "process") {
    const { process } = copy;
    return (
      <StatusScreen
        back={back()}
        title={process.title}
        description={process.description}
        summary={{ icon: process.icon, title: plan.confirming, description: planId === "monthly" ? process.note : process.weeklyNote }}
        primary={{ label: process.busy, onClick: () => undefined, busy: true }}
        aside={aside}
      />
    );
  }
  if (phase === "done") {
    const { done } = copy;
    return (
      <StatusScreen
        title={done.title}
        description={done.description}
        summary={{ icon: done.icon, title: fill(done.summaryTitle, values), description: fill(done.summaryDescription, values) }}
        primary={done.primary}
        secondary={done.secondary}
        aside={aside}
      />
    );
  }
  if (phase === "error") {
    const { error } = copy;
    return (
      <StatusScreen
        back={back(() => setPhase("provider"))}
        title={error.title}
        description={error.description}
        summary={error.summary}
        primary={{ label: error.primary, onClick: () => setPhase("provider") }}
        secondary={error.secondary}
        aside={aside}
      />
    );
  }

  if (phase === "provider") {
    const { provider } = copy;
    return (
      <Workspace aside={aside}>
        {back(() => setPhase("review"))}
        <FormHeader variant="portal" title={provider.title} description={provider.description} />
        <StatusNote variant="highlight" message={provider.note} />
        <dl className="flex w-full flex-col">
          <DetailRow label={provider.row} value={fill(provider.price, values)} />
        </dl>
        <ActionRow>
          <Button type="button" variant="confirm" size="portalPill" width="grow" onClick={() => void pay()}>
            {fill(provider.pay, values)}
          </Button>
          <Button type="button" variant="roseOutline" size="portalPill" width="grow" onClick={() => setPhase("review")}>
            {provider.cancel}
          </Button>
        </ActionRow>
      </Workspace>
    );
  }

  const { review } = copy;
  const proceed = () => {
    setMissing(!agreed);
    if (agreed) setPhase("provider");
  };
  return (
    <Workspace aside={aside}>
      {back()}
      <FormHeader variant="portalStatus" title={review.title} description={review.description} />
      <dl className="flex w-full flex-col gap-2">
        <DetailRow label={review.rows.product} value={plan.name} divided />
        <DetailRow label={review.rows.today} value={fill(review.today, values)} divided />
        <DetailRow label={review.rows.renewal} value={fill(review.renewal, values)} divided />
      </dl>
      <CheckboxField
        label={review.agree}
        checked={agreed}
        onChange={(checked) => {
          setAgreed(checked);
          setMissing(false);
        }}
      />
      {missing && <StatusNote variant="alert" message={review.agreeRequired} />}
      <ActionRow>
        <Button type="button" variant="confirm" size="portalPill" width="grow" onClick={proceed}>
          {review.primary}
        </Button>
        <ActionButton action={review.secondary} variant="roseOutline" size="portalPill" width="grow" />
      </ActionRow>
    </Workspace>
  );
}
