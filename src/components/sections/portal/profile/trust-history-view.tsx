"use client";

import { ActionButton } from "@/components/pieces/actions/action-button";
import { ActionRow } from "@/components/pieces/actions/action-row";
import { DetailRow } from "@/components/pieces/cards/detail-row";
import { FormHeader } from "@/components/pieces/forms/form-header";
import { PortalBack } from "@/components/pieces/actions/portal-back";
import { StatusNote } from "@/components/pieces/feedback/status-note";
import { Text } from "@/components/pieces/content/text";
import { useLoaded } from "@/hooks/use-loaded";
import { accountService } from "@/lib/portal/account-service";
import { getAccountPage } from "@/stores/portal-store";
import { ProfileContext } from "@/components/sections/portal/profile/profile-context";
import { LoadFailed } from "@/components/sections/portal/shared/load-failed";
import { Workspace } from "@/components/sections/portal/shared/workspace";

/** W09 / TRUST-HISTORY: verification and attended dates that shape the Trust Score (`GET /trust-score/history`). */
export function TrustHistoryView() {
  const page = getAccountPage().trustHistory;
  const { value: events, error, reload } = useLoaded(accountService.getTrustHistory);
  return (
    <Workspace aside={<ProfileContext />}>
      <PortalBack action={page.back} />
      <FormHeader variant="portalStatus" title={page.title} description={page.description} />
      <StatusNote variant="highlight" message={page.note} />
      {error !== undefined && <LoadFailed onRetry={reload} />}
      {events?.length === 0 && (
        <Text variant="text14Relaxed" tone="sub">
          {page.empty}
        </Text>
      )}
      <dl className="flex w-full flex-col" aria-busy={(!events && error === undefined) || undefined}>
        {events?.map((event, index) => (
          <DetailRow key={`${event.label}-${index}`} label={event.label} value={event.value} divided />
        ))}
      </dl>
      <ActionRow>
        <ActionButton action={page.primary} variant="confirm" size="portalPill" width="actionSlot" />
        <ActionButton action={page.secondary} variant="roseOutline" size="portalPill" width="actionSlot" />
      </ActionRow>
    </Workspace>
  );
}
