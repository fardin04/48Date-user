"use client";

import { liveData } from "@/lib/portal/live";
import Image from "next/image";
import { ActionButton } from "@/components/pieces/actions/action-button";
import { ActionTarget } from "@/components/pieces/actions/action-target";
import { CardHeading } from "@/components/pieces/content/card-heading";
import { Chip } from "@/components/pieces/content/chip";
import { FactList } from "@/components/pieces/cards/fact-list";
import { FormHeader } from "@/components/pieces/forms/form-header";
import { PortalCard } from "@/components/pieces/layout/portal-card";
import { Text } from "@/components/pieces/content/text";
import { fill } from "@/lib/format";
import { onboardingService } from "@/lib/onboarding/onboarding-service";
import { accountService } from "@/lib/portal/account-service";
import { useLoaded } from "@/hooks/use-loaded";
import { useMemberLocation } from "@/hooks/use-member-location";
import { getMemberCopy, getAccountPage } from "@/stores/portal-store";
import { LoadFailed } from "../shared/load-failed";
import { screenKeys } from "@/lib/screen-keys";

/**
 * W09 / PROFILE: the member's own profile as connections see it (`GET /users/me` with the API).
 * Until the selfie review says `verified` it is PROFILE-UNVERIFIED: "Verification pending" and
 * "Complete verification" (rule 36).
 */
export function OwnProfileView() {
  const copy = getAccountPage();
  const page = copy.profile;
  const chosenArea = useMemberLocation();
  const { value: overview, error, reload } = useLoaded(screenKeys.overview, accountService.getOverview);
  const status = useLoaded(screenKeys.verification, onboardingService.getVerification).value;
  const verified = status === "verified";

  const heading = (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-4">
      <FormHeader variant="portalPage" title={page.title} description={page.description} revealDelay={0} className="w-auto min-w-0 flex-1 basis-72" />
      <div className="flex gap-6 max-sm:w-full max-sm:gap-3">
        <ActionButton action={page.edit} variant="confirm" size="pillCompact" width="signup" className="max-sm:flex-1" />
        <ActionButton action={page.settings} variant="roseOutline" size="pillCompact" width="settingsAction" className="max-sm:flex-1" />
      </div>
    </div>
  );

  if (!overview) {
    return (
      <div className="flex w-full flex-col gap-6" aria-busy={!error || undefined}>
        {heading}
        {error !== undefined && <LoadFailed onRetry={reload} />}
      </div>
    );
  }

  const area = overview.area ?? chosenArea;
  const about = [...overview.facts, { label: page.labels.location, value: overview.area ?? fill(page.place, { location: chosenArea }) }];

  return (
    <div className="flex w-full flex-col gap-6">
      {heading}
      <div className="grid items-start gap-6 md:grid-cols-[248px_minmax(0,1fr)] xl:grid-cols-[439px_minmax(0,1fr)]">
        <PortalCard as="section" surface="outline" padding="md" revealDelay={40} aria-labelledby="own-name" className="flex flex-col gap-4">
          <div className="relative h-90 w-full overflow-hidden rounded-12">
            <Image
              src={overview.photoUrl ?? (liveData ? getMemberCopy().placeholder.src : copy.photo.src)}
              alt={copy.photo.alt}
              fill
              loading="eager"
              // API photos come from the media CDN as optimised WebP; only the sample goes through the optimiser.
              unoptimized={overview.photoUrl !== null}
              sizes="(min-width: 1280px) 400px, (min-width: 768px) 210px, 100vw"
              className="object-cover object-[50%_20%]"
            />
          </div>
          <Text as="h2" id="own-name" variant="text20SemiboldSnug" tone="strong">
            {overview.age === null ? overview.nickname : fill(copy.headline, { name: overview.nickname, age: overview.age })}
          </Text>
          <Text variant="text14SemiboldRelaxed" tone="sub">
            {area}
          </Text>
          <span className="flex">
            <Chip variant="rose">{verified ? page.verified : page.pending}</Chip>
          </span>
          <ActionTarget to={page.trust.to} className="focus-ring flex flex-col gap-1 rounded-12 bg-rose-light p-3 transition-opacity hover:opacity-80">
            <Text as="span" variant="text12Medium" tone="sub">
              {page.trust.label}
            </Text>
            <Text as="span" variant="text14SemiboldRelaxed" tone="strong">
              {overview.trust}
            </Text>
          </ActionTarget>
          <ActionButton action={verified ? page.managePhotos : page.completeVerification} variant="roseOutline" size="pillCompact" width="full" />
        </PortalCard>
        <div className="flex min-w-0 flex-col gap-4">
          <PortalCard as="section" surface="outline" padding="lg" revealDelay={80} aria-labelledby="own-bio" className="flex flex-col gap-3">
            <Text as="h2" id="own-bio" variant="text20SemiboldSnug" tone="strong">
              {page.bioTitle}
            </Text>
            <Text variant="text16" tone="sub">
              {overview.bio}
            </Text>
            <ul aria-label={page.interestsLabel} className="flex flex-wrap gap-2">
              {overview.interests.map((interest) => (
                <li key={interest} className="flex">
                  <Chip variant="rose">{interest}</Chip>
                </li>
              ))}
            </ul>
          </PortalCard>
          <PortalCard as="section" surface="outline" revealDelay={120} aria-labelledby="own-about" className="flex flex-col gap-4 px-6 py-5 max-sm:p-4">
            <CardHeading id="own-about" size={14} title={page.about.title} description={page.about.description} className="min-h-16 justify-center" />
            <FactList layout="rows" facts={about} />
          </PortalCard>
        </div>
      </div>
    </div>
  );
}
