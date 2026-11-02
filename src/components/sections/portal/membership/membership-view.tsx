"use client";

import { ActionButton } from "@/components/pieces/actions/action-button";
import { ActionRow } from "@/components/pieces/actions/action-row";
import { DetailRow } from "@/components/pieces/cards/detail-row";
import { FormHeader } from "@/components/pieces/forms/form-header";
import { PortalBack } from "@/components/pieces/actions/portal-back";
import { StatusBadge } from "@/components/pieces/feedback/status-badge";
import { fill } from "@/lib/format";
import { formatFullDay } from "@/lib/portal/date-format";
import { membershipService } from "@/lib/portal/membership-service";
import { useLoaded } from "@/hooks/use-loaded";
import { to, toItem } from "@/lib/routes";
import { usePlans } from "@/hooks/use-plans";
import { getMembershipPage } from "@/stores/portal-store";
import { MembershipContext } from "@/components/sections/portal/membership/membership-context";
import { LoadFailed } from "@/components/sections/portal/shared/load-failed";
import { Workspace } from "@/components/sections/portal/shared/workspace";
import { screenKeys } from "@/lib/screen-keys";

/** W10 / MEMBERSHIP (and -WEEKLY / -YEARLY) for Premium, MEMBERSHIP-FREE on the free plan. */
export function MembershipView() {
  const page = getMembershipPage().membership;
  const { value: membership, error, reload } = useLoaded(screenKeys.membership, membershipService.getMembership);
  const plans = usePlans();
  if (!membership) {
    return (
      <Workspace aside={<MembershipContext />}>
        <PortalBack action={page.back} />
        <FormHeader variant="portal" title={page.title} description={page.description} />
        {error !== undefined && <LoadFailed onRetry={reload} />}
      </Workspace>
    );
  }

  if (!membership.plan || !membership.periodEnds) {
    const { free } = page;
    const used = membership.lastConversation;
    return (
      <Workspace aside={<MembershipContext />}>
        <PortalBack action={page.back} />
        <FormHeader variant="portal" title={free.title} description={free.description} />
        <dl className="flex w-full flex-col gap-2">
          <DetailRow label={free.rows.plan} value={free.planValue} divided />
          <DetailRow
            label={free.rows.conversations}
            value={fill(free.used, { used: membership.conversationsUsed, included: membership.includedConversations })}
            divided
          />
          <DetailRow label={free.rows.premium} value={free.premiumValue} divided />
        </dl>
        <ActionRow>
          <ActionButton action={free.primary} variant="confirm" size="portalPill" width="grow" />
          <ActionButton action={{ label: free.secondary, to: used ? toItem("CHAT-01", used) : to("INBOX") }} variant="roseOutline" size="portalPill" width="grow" />
        </ActionRow>
      </Workspace>
    );
  }

  const plan = plans.find((item) => item.id === membership.plan) ?? plans[0];
  return (
    <Workspace aside={<MembershipContext />}>
      <PortalBack action={page.back} />
      <FormHeader variant="portal" title={page.title} description={page.description} />
      <StatusBadge variant="pending" label={membership.renews ? page.active : page.renewalOff} live={false} />
      <dl className="flex w-full flex-col gap-2">
        <DetailRow label={page.rows.plan} value={fill(page.plan, { plan: plan.name })} divided />
        <DetailRow label={membership.renews ? page.rows.renews : page.rows.endsOn} value={formatFullDay(membership.periodEnds)} divided />
        {membership.renews && <DetailRow label={page.rows.price} value={fill(page.price, { price: plan.price })} divided />}
      </dl>
      <ActionRow>
        {membership.renews && <ActionButton action={page.primary} variant="confirm" size="portalPill" width="grow" />}
        <ActionButton action={page.secondary} variant={membership.renews ? "roseOutline" : "confirm"} size="portalPill" width="grow" />
      </ActionRow>
    </Workspace>
  );
}
