"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ActionButton } from "@/components/pieces/actions/action-button";
import { ActionRow } from "@/components/pieces/actions/action-row";
import { DetailRow } from "@/components/pieces/cards/detail-row";
import { FormHeader } from "@/components/pieces/forms/form-header";
import { PortalBack } from "@/components/pieces/actions/portal-back";
import { StatusNote } from "@/components/pieces/feedback/status-note";
import { Button } from "@/components/ui/button";
import { fill } from "@/lib/format";
import { formatFullDay } from "@/lib/portal/date-format";
import { membershipService } from "@/lib/portal/membership-service";
import { useLoaded } from "@/hooks/use-loaded";
import { hrefFor } from "@/lib/routes";
import { usePlans } from "@/hooks/use-plans";
import { getMembershipPage } from "@/stores/portal-store";
import { MembershipContext } from "@/components/sections/portal/membership/membership-context";
import { StatusScreen } from "@/components/sections/portal/shared/status-screen";
import { LoadFailed } from "@/components/sections/portal/shared/load-failed";
import { Workspace } from "@/components/sections/portal/shared/workspace";

/** W10 / PAY-CANCEL, then PAY-CANCELLED (also shown when renewal is already off). Free members go to MEMBERSHIP. */
export function SubscriptionView() {
  const page = getMembershipPage().manage;
  const router = useRouter();
  const { value: membership, error, reload } = useLoaded(membershipService.getMembership);
  const plans = usePlans();
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const free = membership !== undefined && !membership.plan;

  useEffect(() => {
    if (free) router.replace(hrefFor("MEMBERSHIP"));
  }, [free, router]);

  if (!membership?.plan || !membership.periodEnds) {
    return (
      <Workspace aside={<MembershipContext />}>
        <PortalBack action={page.back} />
        <FormHeader variant="portal" title={page.title} description={page.description} />
        {error !== undefined && <LoadFailed onRetry={reload} />}
      </Workspace>
    );
  }
  const ends = formatFullDay(membership.periodEnds);

  if (!membership.renews) {
    const { stopped } = page;
    return (
      <StatusScreen
        back={<PortalBack action={page.back} />}
        title={stopped.title}
        description={fill(stopped.description, { date: ends })}
        summary={stopped.summary}
        primary={stopped.primary}
        aside={<MembershipContext />}
      />
    );
  }

  const stop = async () => {
    if (busy) return;
    setBusy(true);
    setFailed(false);
    try {
      await membershipService.stopRenewal();
      reload();
    } catch {
      setFailed(true);
    }
    setBusy(false);
  };

  return (
    <Workspace aside={<MembershipContext />}>
      <PortalBack action={page.back} />
      <FormHeader variant="portal" title={page.title} description={page.description} />
      <dl className="flex w-full flex-col gap-2">
        <DetailRow label={page.rows.plan} value={fill(getMembershipPage().membership.plan, { plan: (plans.find((item) => item.id === membership.plan) ?? plans[0]).name })} divided />
        <DetailRow label={page.rows.through} value={ends} divided />
      </dl>
      {failed && <StatusNote variant="alert" message={page.failed} />}
      <ActionRow>
        <Button type="button" variant="confirm" size="portalPill" width="grow" disabled={busy} aria-busy={busy || undefined} onClick={() => void stop()}>
          {busy ? page.busy : page.primary}
        </Button>
        <ActionButton action={page.secondary} variant="roseOutline" size="portalPill" width="grow" />
      </ActionRow>
    </Workspace>
  );
}
