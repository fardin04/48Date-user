import { ActionButton } from "@/components/pieces/actions/action-button";
import { ActionTarget } from "@/components/pieces/actions/action-target";
import { Chip } from "@/components/pieces/content/chip";
import { FactList } from "@/components/pieces/cards/fact-list";
import { PortalCard } from "@/components/pieces/layout/portal-card";
import { Text } from "@/components/pieces/content/text";
import type { DeckEntry, Member } from "@/data/portal/types";
import { fill } from "@/lib/format";
import { forMember } from "@/lib/portal/member-link";
import { toItem } from "@/lib/routes";
import { getDiscoverPage } from "@/stores/portal-store";

type ProfileOverviewProps = {
  member: Member;
  overview: DeckEntry["overview"];
};

/** "Discovery / Profile overview": a concise profile beside the swipe card, then the safety note. */
export function ProfileOverview({ member, overview }: ProfileOverviewProps) {
  const copy = getDiscoverPage();
  const compat = toItem("COMPAT", member.id);
  const action =
    overview === "compat"
      ? { label: copy.overview.whyClick, to: compat }
      : { label: copy.overview.viewProfile, to: toItem("DISCOVER-PROFILE", member.id) };
  return (
    <div className="flex flex-col gap-4">
      <PortalCard as="section" surface="outline" padding="lg" revealDelay={80} aria-labelledby="overview-title" className="flex flex-col gap-4">
        <div className="flex flex-wrap gap-2">
          {member.verified && <Chip variant="rose">{copy.overview.verified}</Chip>}
          <ActionTarget to={compat} className="focus-ring flex rounded-full">
            <Chip variant="rose">{fill(copy.overview.compatibility, { percent: member.compatibility })}</Chip>
          </ActionTarget>
        </div>
        <Text as="h2" id="overview-title" variant="text20SemiboldSnug" tone="strong">
          {member.headline}
        </Text>
        <Text variant="text16" tone="sub">
          {member.bio}
        </Text>
        <FactList layout="pairs" facts={member.overviewFacts} />
        <ActionButton action={action} variant="roseOutline" size="pillCompact" width="full" />
      </PortalCard>
      <PortalCard as="section" surface="outline" padding="md" revealDelay={160} aria-labelledby="before-connect-title" className="flex flex-col items-start gap-3">
        <div className="flex flex-col gap-2">
          <Text as="h2" id="before-connect-title" variant="text14SemiboldRelaxed" tone="strong">
            {copy.beforeConnect.title}
          </Text>
          <Text variant="text14SemiboldRelaxed" tone="sub">
            {copy.beforeConnect.description}
          </Text>
        </div>
        <ActionButton action={forMember(copy.beforeConnect.report, member.id)} variant="roseOutline" size="pillCompact" width="portalAction" />
      </PortalCard>
    </div>
  );
}
