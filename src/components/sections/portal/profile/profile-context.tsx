"use client";

import Image from "next/image";
import { ActionButton } from "@/components/pieces/actions/action-button";
import { FactList } from "@/components/pieces/cards/fact-list";
import { PortalCard } from "@/components/pieces/layout/portal-card";
import { Text } from "@/components/pieces/content/text";
import { fill } from "@/lib/format";
import { accountService } from "@/lib/portal/account-service";
import { useLoaded } from "@/hooks/use-loaded";
import { useMemberLocation } from "@/hooks/use-member-location";
import { getAccountPage } from "@/stores/portal-store";

/**
 * "Flow support / Profile": the member's own photo, name, completeness and Trust Score. It reads the
 * same overview as PROFILE; the API module shares that request, so the two never fetch twice.
 */
export function ProfileContext() {
  const copy = getAccountPage();
  const { context, defaults } = copy;
  const chosenArea = useMemberLocation();
  const overview = useLoaded(accountService.getOverview).value;
  const name = overview?.nickname ?? defaults.profile.nickname;
  const age = overview ? overview.age : defaults.age;
  const facts = [
    { label: age === null ? name : fill(copy.headline, { name, age }), value: overview?.area ?? chosenArea },
    {
      label: context.completeness.label,
      value: overview?.completeness == null ? context.completeness.value : fill(context.completenessValue, { percent: overview.completeness }),
    },
    { label: context.trust.label, value: overview?.trust ?? context.trust.value },
  ];
  return (
    <PortalCard as="aside" surface="outline" padding="lg" revealDelay={80} aria-labelledby="profile-context-title" className="flex w-full flex-col gap-5">
      <div className="flex flex-col gap-2 border-b border-divider pb-2">
        <Text as="h2" id="profile-context-title" variant="text20SemiboldSnug" tone="strong">
          {context.title}
        </Text>
        <Text variant="text12Medium" tone="sub">
          {context.description}
        </Text>
      </div>
      <div className="relative h-38 w-full">
        <Image src={overview?.photoUrl ?? copy.photo.src} alt="" fill unoptimized={Boolean(overview?.photoUrl)} sizes="96px" className="rounded-12 object-contain" />
      </div>
      <FactList layout="divided" facts={facts} />
      <ActionButton action={context.preview} variant="roseOutline" size="pillCompact" width="full" />
    </PortalCard>
  );
}
