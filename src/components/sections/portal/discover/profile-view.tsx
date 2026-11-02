"use client";

import Image from "next/image";
import { ActionButton } from "@/components/pieces/actions/action-button";
import { CardHeading } from "@/components/pieces/content/card-heading";
import { Chip } from "@/components/pieces/content/chip";
import { DetailRow } from "@/components/pieces/cards/detail-row";
import { FactList } from "@/components/pieces/cards/fact-list";
import { PortalCard } from "@/components/pieces/layout/portal-card";
import { StatusBadge } from "@/components/pieces/feedback/status-badge";
import { StatusNote } from "@/components/pieces/feedback/status-note";
import { Text } from "@/components/pieces/content/text";
import type { MemberId } from "@/data/portal/types";
import { fill } from "@/lib/format";
import { forMember } from "@/lib/portal/member-link";
import { getDiscoverPage, getProfilePage } from "@/stores/portal-store";
import { useMember } from "@/hooks/use-member";
import { sharedInterestsText } from "@/lib/portal/shared-interests";
import { MemberUnavailable } from "@/components/sections/portal/shared/member-unavailable";
import { ProfileDecisions } from "@/components/sections/portal/discover/profile-decisions";
import { Workspace } from "@/components/sections/portal/shared/workspace";
import { isRawImage } from "@/lib/image";

/** W04 / DISCOVER-PROFILE: every profile detail, without leaving the discovery journey. */
export function ProfileView({ memberId }: { memberId: MemberId }) {
  const copy = getProfilePage();
  const member = useMember(memberId);
  if (member === null) return <MemberUnavailable />;
  if (!member) return null;
  return (
    <Workspace>
      <ActionButton action={copy.back} variant="roseOutline" size="pillCompact" width="portalAction" revealDelay={0} />
      <Text as="h1" variant="portalTitle28" tone="strong" revealDelay={0}>
        {copy.title}
      </Text>
      <PortalCard as="section" surface="rose" padding="md" revealDelay={40} aria-labelledby="notify-title" className="flex w-full flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <Text as="h2" id="notify-title" variant="text14SemiboldRelaxed" tone="strong">
            {copy.notify.title}
          </Text>
          <Text variant="text14SemiboldRelaxed" tone="sub">
            {copy.notify.description}
          </Text>
        </div>
        <ActionButton action={copy.notify.action} variant="roseOutline" size="pillCompact" width="notifyAction" />
      </PortalCard>
      <Text variant="text16" tone="sub" revealDelay={40}>
        {copy.description}
      </Text>
      <div className="grid w-full gap-8 lg:grid-cols-2">
        <div className="relative aspect-[600/660] w-full overflow-hidden rounded-16 lg:aspect-auto">
          <Image src={member.photo.src} unoptimized={isRawImage(member.photo.src)} alt={member.photo.alt} fill loading="eager" sizes="(min-width: 1024px) 600px, 100vw" className="object-cover" />
        </div>
        <div className="flex min-w-0 flex-col items-start gap-5">
          {member.verified && <StatusBadge variant="success" label={copy.verified} live={false} />}
          <Text as="h2" variant="portalDisplay36" tone="strong">
            {fill(getDiscoverPage().card.title, { name: member.name, age: member.age })}
          </Text>
          <Text variant="text16" tone="sub">
            {fill(copy.place, { location: member.location, distance: member.distance })}
          </Text>
          <PortalCard surface="outline" padding="sm" className="flex w-full flex-col gap-4">
            <CardHeading as="h3" size={14} title={member.headline} description={member.tagline} />
            <Text variant="text16" tone="sub">
              {member.bio}
            </Text>
          </PortalCard>
          <dl className="flex w-full flex-col">
            <DetailRow
              variant="column"
              label={copy.rows.compatibility}
              value={member.compatibility === null ? sharedInterestsText(member) : fill(copy.percent, { percent: member.compatibility })}
            />
            <DetailRow variant="column" label={copy.rows.trust} value={member.trustScore} />
            <DetailRow variant="column" label={copy.rows.interests} value={member.interestsSummary} />
          </dl>
          <StatusNote variant="highlight" message={copy.note} />
          <ActionButton action={forMember(copy.report, member.id)} variant="roseOutline" size="portalPill" width="portalAction" />
        </div>
      </div>
      <PortalCard as="section" surface="outline" padding="lg" revealDelay={0} aria-labelledby="interests-title" className="flex w-full flex-col gap-4">
        <Text as="h2" id="interests-title" variant="text20SemiboldSnug" tone="strong">
          {copy.interestsTitle}
        </Text>
        <ul className="flex flex-wrap gap-2">
          {member.profileInterests.map((interest) => (
            <li key={interest} className="flex">
              <Chip variant="rose">{interest}</Chip>
            </li>
          ))}
        </ul>
      </PortalCard>
      <PortalCard as="section" surface="outline" padding="sm" revealDelay={0} aria-labelledby="about-title" className="flex w-full flex-col gap-4">
        <CardHeading id="about-title" size={24} title={copy.about.title} description={copy.about.description} />
        <FactList layout="grid" facts={member.aboutFacts} />
      </PortalCard>
      {member.morePhotos.length > 0 && (
        <PortalCard as="section" surface="outline" padding="sm" revealDelay={0} aria-labelledby="photos-title" className="flex w-full flex-col gap-4">
          <CardHeading id="photos-title" size={14} title={copy.photos} />
          <ul className="grid gap-6 md:grid-cols-2">
            {member.morePhotos.map((photo) => (
              <li key={photo.src} className="relative h-80 overflow-hidden rounded-16">
                <Image src={photo.src} unoptimized={isRawImage(photo.src)} alt={photo.alt} fill sizes="(min-width: 768px) 600px, 100vw" className="object-cover object-bottom" />
                <span aria-hidden="true" className="absolute inset-0 bg-photo-tint mix-blend-screen" />
              </li>
            ))}
          </ul>
        </PortalCard>
      )}
      <ProfileDecisions member={member.id} name={member.name} />
    </Workspace>
  );
}
