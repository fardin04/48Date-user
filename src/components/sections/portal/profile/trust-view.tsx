"use client";

import { ActionButton } from "@/components/pieces/actions/action-button";
import { ActionRow } from "@/components/pieces/actions/action-row";
import { CardHeading } from "@/components/pieces/content/card-heading";
import { FormHeader } from "@/components/pieces/forms/form-header";
import { Icon } from "@/components/pieces/content/icon";
import { PortalBack } from "@/components/pieces/actions/portal-back";
import { PortalCard } from "@/components/pieces/layout/portal-card";
import { SettingsRow } from "@/components/pieces/cards/settings-row";
import { Text } from "@/components/pieces/content/text";
import { onboardingService } from "@/lib/onboarding/onboarding-service";
import { accountService } from "@/lib/portal/account-service";
import { useLoaded } from "@/hooks/use-loaded";
import { getAccountPage } from "@/stores/portal-store";
import { ProfileContext } from "@/components/sections/portal/profile/profile-context";
import { LoadFailed } from "@/components/sections/portal/shared/load-failed";
import { Workspace } from "@/components/sections/portal/shared/workspace";
import { screenKeys } from "@/lib/screen-keys";

/** W09 / TRUST: the score, what builds it and the three signals behind it (`GET /users/me/trust-score`). */
export function TrustView() {
  const page = getAccountPage().trust;
  const { value: trust, error, reload } = useLoaded(screenKeys.trust, accountService.getTrust);
  const status = useLoaded(screenKeys.verification, onboardingService.getVerification, { refetchOnWindowFocus: true }).value?.status;
  // The selfie review's own status (the score's flag only says verified or not); the flag until it loads.
  const verification = status === undefined ? (trust?.verification ?? "") : page.verification[status];
  const rows = [
    { label: page.rows.verification, value: verification },
    { label: page.rows.dates, value: trust?.dates ?? "" },
    { label: page.rows.feedback, value: trust?.feedback ?? "" },
  ];
  return (
    <Workspace aside={<ProfileContext />}>
      <PortalBack action={page.back} />
      <FormHeader variant="portal" title={page.title} description={page.description} />
      <PortalCard as="section" surface="outline" padding="sm" aria-labelledby="trust-card" className="flex w-full flex-col items-start gap-4">
        <CardHeading id="trust-card" size={14} title={trust?.title ?? page.card.title} description={page.card.description} className="min-h-16 justify-center" />
        <Icon name="shield-01" size={56} tone="rose" />
        <Text variant="text16" tone="sub">
          {page.card.body}
        </Text>
      </PortalCard>
      {error !== undefined && <LoadFailed onRetry={reload} />}
      <ul className="flex w-full flex-col gap-7" aria-busy={!trust || undefined}>
        {rows.map((row) => (
          <li key={row.label}>
            <SettingsRow label={row.label} value={row.value} pill="status" />
          </li>
        ))}
      </ul>
      <ActionRow>
        <ActionButton action={page.primary} variant="confirm" size="portalPill" width="actionSlot" />
      </ActionRow>
    </Workspace>
  );
}
