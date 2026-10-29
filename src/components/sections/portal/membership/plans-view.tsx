"use client";

import { ActionButton } from "@/components/pieces/actions/action-button";
import { ActionRow } from "@/components/pieces/actions/action-row";
import { FormHeader } from "@/components/pieces/forms/form-header";
import { PlanCard } from "@/components/pieces/cards/plan-card";
import { PortalBack } from "@/components/pieces/actions/portal-back";
import { fill } from "@/lib/format";
import { toItem } from "@/lib/routes";
import { usePlans } from "@/hooks/use-plans";
import { getMembershipPage } from "@/stores/portal-store";
import { Workspace } from "@/components/sections/portal/shared/workspace";

/** W10 / PLANS: the three Premium billing periods side by side (stacked below 1024px), priced by the service. */
export function PlansView() {
  const copy = getMembershipPage();
  const plans = usePlans();
  const page = copy.plans;
  return (
    <Workspace>
      <PortalBack action={page.back} />
      <FormHeader variant="portalStatus" title={page.title} description={page.description} />
      <div className="grid w-full gap-6 lg:grid-cols-3">
        {plans.map((plan, index) => (
          <PlanCard
            key={plan.id}
            name={plan.name}
            headline={plan.headline}
            billing={plan.billing}
            features={copy.features}
            featuresLabel={fill(page.featuresLabel, { plan: plan.name })}
            action={{ label: plan.choose, to: toItem("PAY-REVIEW", plan.id) }}
            surface={plan.id === copy.featured ? "featured" : "plain"}
            revealDelay={40 * index}
          />
        ))}
      </div>
      <ActionRow>
        <ActionButton action={{ label: page.continue, to: toItem("PAY-REVIEW", copy.featured) }} variant="confirm" size="portalPill" width="actionSlot" />
        <ActionButton action={page.restore} variant="roseOutline" size="portalPill" width="actionSlot" />
      </ActionRow>
    </Workspace>
  );
}
