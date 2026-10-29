"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ActionButton } from "@/components/pieces/actions/action-button";
import { ActionRow } from "@/components/pieces/actions/action-row";
import { FormHeader } from "@/components/pieces/forms/form-header";
import { PortalBack } from "@/components/pieces/actions/portal-back";
import { StatusBadge } from "@/components/pieces/feedback/status-badge";
import { Button } from "@/components/ui/button";
import type { MemberId } from "@/data/portal/types";
import { fill } from "@/lib/format";
import { dateService } from "@/lib/portal/date-service";
import { useDatePlan } from "@/hooks/use-date-plan";
import { hrefFor, toItem } from "@/lib/routes";
import { getDatePage, getMember } from "@/stores/portal-store";
import { DateContext } from "@/components/sections/portal/dates/date-context";
import { DateSummary } from "@/components/sections/portal/dates/date-summary";
import { Workspace } from "@/components/sections/portal/shared/workspace";

/** W06 / DATE-REVIEW: the plan as the match will see it; Send invitation opens DATE-PENDING. */
export function ReviewView({ memberId }: { memberId: MemberId }) {
  const copy = getDatePage();
  const router = useRouter();
  const { plan } = useDatePlan(memberId);
  const [busy, setBusy] = useState(false);
  const incomplete = plan !== null && (!plan.date || plan.time === null);

  // Nothing to review yet (direct visit): choose the date and time first.
  useEffect(() => {
    if (incomplete) router.replace(hrefFor("DATE-TIME", memberId));
  }, [incomplete, memberId, router]);

  if (!plan || incomplete) return null;
  const name = getMember(memberId).name;
  const send = async () => {
    if (busy) return;
    setBusy(true);
    await dateService.sendInvitation(memberId);
    router.push(hrefFor("DATE-PENDING", memberId));
  };

  return (
    <Workspace aside={<DateContext member={memberId} venue={plan.venue} />}>
      <PortalBack action={{ ...copy.back, to: toItem("DATE-TIME", memberId) }} />
      <FormHeader variant="portal" title={copy.review.title} description={fill(copy.review.description, { name })} badge={<StatusBadge variant="pending" label={copy.review.badge} live={false} />} />
      <DateSummary plan={plan} status={copy.review.badge} />
      <ActionRow>
        <Button type="button" variant="confirm" size="portalPill" width="actionSlot" disabled={busy} aria-busy={busy || undefined} onClick={() => void send()}>
          {busy ? copy.review.sending : copy.review.send}
        </Button>
        <ActionButton action={{ label: copy.review.edit, to: toItem("DATE-TIME", memberId) }} variant="roseOutline" size="portalPill" width="actionSlot" />
      </ActionRow>
    </Workspace>
  );
}
