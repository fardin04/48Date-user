import { ActionButton } from "@/components/pieces/actions/action-button";
import { FactList } from "@/components/pieces/cards/fact-list";
import { PortalCard } from "@/components/pieces/layout/portal-card";
import { Text } from "@/components/pieces/content/text";
import type { Fact } from "@/data/portal/types";
import { cn } from "@/lib/cn";
import { fill } from "@/lib/format";
import { getDiscoverPage } from "@/stores/portal-store";

type DiscoverSidebarProps = {
  location: string;
  facts: Fact[];
  activeMatches: number;
  /** Placement only (rule 17). */
  className?: string;
};

/** "Discovery preferences": the saved preferences and the active-matches prompt (240px column at ≥1280). */
export function DiscoverSidebar({ location, facts, activeMatches, className }: DiscoverSidebarProps) {
  const { preferences, activeMatches: matches } = getDiscoverPage();
  return (
    <div className={cn("grid items-start gap-4 md:grid-cols-2 xl:grid-cols-1", className)}>
      <PortalCard as="section" surface="outline" padding="md" revealDelay={0} aria-labelledby="preferences-title" className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Text as="h2" id="preferences-title" variant="text20SemiboldSnug" tone="strong">
            {preferences.title}
          </Text>
          <Text variant="text14SemiboldRelaxed" tone="strong">
            {location}
          </Text>
        </div>
        <Text variant="text14SemiboldRelaxed" tone="sub">
          {preferences.description}
        </Text>
        <FactList layout="stack" facts={facts} />
        <ActionButton action={preferences.edit} variant="roseOutline" size="pillCompact" width="full" />
      </PortalCard>
      <PortalCard as="section" surface="rose" padding="md" revealDelay={80} aria-labelledby="active-matches-title" className="flex flex-col gap-3">
        <Text as="h2" id="active-matches-title" variant="text20SemiboldSnug" tone="strong">
          {fill(matches.title, { count: activeMatches })}
        </Text>
        <Text variant="text14SemiboldRelaxed" tone="sub">
          {matches.description}
        </Text>
        <ActionButton action={matches.action} variant="roseOutline" size="pillCompact" width="full" />
      </PortalCard>
    </div>
  );
}
