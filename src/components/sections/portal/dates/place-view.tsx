"use client";

import Image from "next/image";
import { ActionButton } from "@/components/pieces/actions/action-button";
import { ActionRow } from "@/components/pieces/actions/action-row";
import { CardHeading } from "@/components/pieces/content/card-heading";
import { DetailRow } from "@/components/pieces/cards/detail-row";
import { FormHeader } from "@/components/pieces/forms/form-header";
import { PortalBack } from "@/components/pieces/actions/portal-back";
import { PortalCard } from "@/components/pieces/layout/portal-card";
import { Text } from "@/components/pieces/content/text";
import type { MemberId } from "@/data/portal/types";
import { useDatePlan } from "@/hooks/use-date-plan";
import { toItem } from "@/lib/routes";
import { getDatePage } from "@/stores/portal-store";
import { DateContext } from "@/components/sections/portal/dates/date-context";
import { Workspace } from "@/components/sections/portal/shared/workspace";
import { isRawImage } from "@/lib/image";

/** W06 / VENUE-DETAIL for the place chosen on VENUES (Amber & Oak, Garden Bistro or Lumen). */
export function PlaceView({ memberId }: { memberId: MemberId }) {
  const copy = getDatePage();
  const { plan } = useDatePlan(memberId);
  if (!plan) return null;
  const venue = plan.place;
  const venues = toItem("VENUES", memberId);
  return (
    <Workspace aside={<DateContext member={memberId} place={venue} />}>
      <PortalBack action={{ ...copy.back, to: venues }} />
      <FormHeader variant="portalStatus" title={venue.name} description={copy.place.description} />
      <div className="relative h-65 w-full overflow-hidden rounded-16">
        <Image src={venue.photo.src} unoptimized={isRawImage(venue.photo.src)} alt={venue.photo.alt} fill sizes="(min-width: 1280px) 860px, 100vw" className="object-cover" />
      </div>
      <PortalCard surface="outline" padding="sm" className="flex w-full flex-col gap-4">
        <CardHeading as="h2" size={14} title={venue.name} description={venue.detailMeta} />
        <Text variant="text16" tone="sub">
          {venue.description}
        </Text>
      </PortalCard>
      <dl className="flex w-full flex-col gap-2">
        <DetailRow label={copy.place.rows.arrival} value={venue.arrival} divided />
        <DetailRow label={copy.place.rows.privacy} value={copy.place.rows.privacyValue} divided />
      </dl>
      <ActionRow>
        <ActionButton action={{ label: copy.place.choose, to: toItem("DATE-TIME", memberId) }} variant="confirm" size="portalPill" width="actionSlot" />
        <ActionButton action={{ label: copy.place.others, to: venues }} variant="roseOutline" size="portalPill" width="actionSlot" />
      </ActionRow>
    </Workspace>
  );
}
