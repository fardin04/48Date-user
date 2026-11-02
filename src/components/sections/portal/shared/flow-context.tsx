"use client";

import { ActionButton } from "@/components/pieces/actions/action-button";
import { FactList } from "@/components/pieces/cards/fact-list";
import { PortalCard } from "@/components/pieces/layout/portal-card";
import { Text } from "@/components/pieces/content/text";
import { portalService } from "@/lib/portal/portal-service";
import { preferenceFacts } from "@/lib/portal/preference-facts";
import { useLoaded } from "@/hooks/use-loaded";
import { useMemberLocation } from "@/hooks/use-member-location";
import { getFiltersPage, getPortalShell } from "@/stores/portal-store";
import { screenKeys } from "@/lib/screen-keys";

/** "48Date / Web / Flow context" (Flow=Discovery): the saved discovery preferences beside a status screen. */
export function FlowContext() {
  const { flowContext } = getPortalShell();
  const location = useMemberLocation();
  const preferences = useLoaded(screenKeys.preferences, portalService.getPreferences).value ?? getFiltersPage().defaults;
  return (
    <PortalCard as="aside" surface="outline" padding="lg" revealDelay={80} aria-labelledby="flow-context-title" className="flex w-full flex-col gap-5">
      <div className="flex flex-col gap-2 border-b border-divider pb-2">
        <Text as="h2" id="flow-context-title" variant="text20SemiboldSnug" tone="strong">
          {flowContext.title}
        </Text>
        <Text variant="text12Medium" tone="sub">
          {flowContext.description}
        </Text>
      </div>
      <FactList layout="divided" facts={preferenceFacts(preferences, location, ["location", "distance", "ageRange", "interestedIn"])} />
      <ActionButton action={flowContext.action} variant="roseOutline" size="pillCompact" width="full" />
    </PortalCard>
  );
}
