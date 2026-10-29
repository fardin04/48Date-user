"use client";

import { ActionButton } from "@/components/pieces/actions/action-button";
import { ActionRow } from "@/components/pieces/actions/action-row";
import { FormHeader } from "@/components/pieces/forms/form-header";
import { PortalBack } from "@/components/pieces/actions/portal-back";
import { StatusBadge } from "@/components/pieces/feedback/status-badge";
import type { MemberId } from "@/data/portal/types";
import { fill } from "@/lib/format";
import { useDatePlan } from "@/hooks/use-date-plan";
import { to, toItem } from "@/lib/routes";
import { getDatePage, getMember } from "@/stores/portal-store";
import { DateContext } from "@/components/sections/portal/dates/date-context";
import { DateSummary } from "@/components/sections/portal/dates/date-summary";
import { Workspace } from "@/components/sections/portal/shared/workspace";

/** W06 / DATE-COMPLETE: the date both members confirmed. */
export function CompleteView({ memberId }: { memberId: MemberId }) {
  const copy = getDatePage();
  const { plan } = useDatePlan(memberId);
  if (!plan) return null;
  const chat = toItem("CHAT-01", memberId);
  return (
    <Workspace aside={<DateContext member={memberId} venue={plan.venue} />}>
      <PortalBack action={{ ...copy.back, to: to("MATCHES-COMPLETE") }} />
      <FormHeader
        variant="portal"
        title={copy.complete.title}
        description={fill(copy.complete.description, { name: getMember(memberId).name })}
        badge={<StatusBadge variant="success" label={copy.complete.badge} />}
      />
      <DateSummary plan={plan} status={copy.complete.status} />
      <ActionRow>
        <ActionButton action={{ label: copy.complete.chat, to: chat }} variant="confirm" size="portalPill" width="actionSlot" />
        <ActionButton action={copy.complete.story} variant="roseOutline" size="portalPill" width="actionSlot" />
      </ActionRow>
    </Workspace>
  );
}
