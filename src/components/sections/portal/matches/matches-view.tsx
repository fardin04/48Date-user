"use client";

import { useEffect, useEffectEvent } from "react";
import { ActionButton } from "@/components/pieces/actions/action-button";
import { FormHeader } from "@/components/pieces/forms/form-header";
import { MatchCard } from "@/components/pieces/cards/match-card";
import { OutcomeCard } from "@/components/pieces/cards/outcome-card";
import { PortalBack } from "@/components/pieces/actions/portal-back";
import { StatusBadge } from "@/components/pieces/feedback/status-badge";
import { StatusTabs } from "@/components/pieces/feedback/status-tabs";
import type { MatchTab } from "@/data/portal/matches";
import { fill, timeLeft } from "@/lib/format";
import { portalService, type Match } from "@/lib/portal/portal-service";
import { useLoaded } from "@/hooks/use-loaded";
import { forMember } from "@/lib/portal/member-link";
import { useNow } from "@/hooks/use-now";
import { toItem } from "@/lib/routes";
import { getAccountPage, getMatchDetailPage, getMatchesPage, getPortalShell } from "@/stores/portal-store";
import { useServiceAction } from "@/hooks/use-service-action";
import { Text } from "@/components/pieces/content/text";
import { LoadFailed } from "@/components/sections/portal/shared/load-failed";
import { StatusScreen } from "@/components/sections/portal/shared/status-screen";
import { Workspace } from "@/components/sections/portal/shared/workspace";
import { screenKeys } from "@/lib/screen-keys";

/** Time-left badge of a card: urgent under two hours, success otherwise, "Date confirmed" once agreed. */
function MatchBadge({ match, now }: { match: Match; now: number }) {
  const copy = getMatchesPage();
  if (match.confirmed) return <StatusBadge variant="success" label={copy.confirmed} live={false} />;
  // No running window (the server stopped or didn't start the clock): an open match without a countdown.
  if (match.expiresAt === null) return <StatusBadge variant="success" label={getMatchDetailPage().active.label} live={false} />;
  const left = timeLeft(match.expiresAt, now);
  const variant = left.totalMinutes < copy.urgentMinutes ? "urgent" : "success";
  return <StatusBadge variant={variant} label={fill(copy.timeLeft, { hours: left.hours, minutes: left.minutes })} live={false} />;
}

/**
 * W04 / MATCHES, MATCHES-CANCELLED and MATCHES-COMPLETE (one URL per tab), and MATCHES-EMPTY
 * once no match is open. Cards count down live; a match drops out of the list when its time is up.
 */
export function MatchesView({ tab }: { tab: MatchTab }) {
  const copy = getMatchesPage();
  const { value: loaded, error, reload } = useLoaded(screenKeys.matches, portalService.getMatches, { refetchOnWindowFocus: true });
  const outcomeTab = tab === "all" ? null : tab;
  const outcomes = useLoaded([...screenKeys.matches, "outcomes", tab], () => portalService.getOutcomes(outcomeTab ?? "cancelled"), {
    enabled: outcomeTab !== null,
  }).value;
  const now = useNow();
  const finding = useServiceAction(getAccountPage().profile.loadFailed);
  const find = () => void finding.run(() => portalService.findMatches()).then(() => reload());
  const joinSearch = useEffectEvent(find);
  // Arriving from READY: the auto-matching run is still going, so wait for it instead of showing "no matches".
  useEffect(() => {
    if (portalService.isFindingMatches()) joinSearch();
  }, []);
  if (error && !loaded) return <LoadFailed onRetry={() => void reload()} error={error} />;
  if (!loaded || now === null) return null;

  const open = loaded.filter((match) => match.expiresAt === null || match.expiresAt > now);
  if (tab === "all" && open.length === 0) {
    return (
      <StatusScreen
        back={<PortalBack action={getPortalShell().back} />}
        title={copy.empty.title}
        description={copy.empty.description}
        summary={copy.empty.summary}
        primary={copy.empty.primary}
        secondary={{
          label: finding.busy ? copy.empty.finding : copy.empty.find,
          busy: finding.busy,
          onClick: find,
        }}
      />
    );
  }

  const tabs = copy.tabs.map((item) => ({ ...item, label: fill(item.label, { count: open.length }) }));

  return (
    <Workspace>
      <FormHeader variant="portalStatus" title={copy.title} description={copy.description} />
      <StatusTabs label={copy.tabsLabel} tabs={tabs} active={tab} />
      {tab === "all" && (
        <ul className="grid w-full gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {open.map((match, index) => {
            const member = match.summary;
            const agreed = match.confirmed;
            return (
              <li key={match.member} className="flex">
                <MatchCard
                  name={member.name}
                  photo={member.photo}
                  badge={<MatchBadge match={match} now={now} />}
                  preview={match.preview}
                  primary={{ label: agreed ? copy.card.openChat : copy.card.message, to: toItem("CHAT-01", member.id) }}
                  secondary={forMember(agreed ? copy.card.viewDate : copy.card.planDate, member.id)}
                  details={{ label: copy.card.details.label, to: toItem(copy.card.details.screen, member.id) }}
                  revealDelay={index * 80}
                  className="w-full"
                />
              </li>
            );
          })}
        </ul>
      )}
      {outcomeTab && outcomes?.length === 0 && (
        <Text variant="text16" tone="sub">
          {copy.outcome.empty}
        </Text>
      )}
      {outcomeTab &&
        outcomes?.map((outcome) => {
          const state = outcomeTab === "cancelled" ? copy.cancelled : copy.complete;
          return (
            <OutcomeCard
              key={outcome.member}
              image={outcome.image}
              title={state.title}
              meta={outcome.meta}
              description={state.description}
              primary={outcomeTab === "cancelled" ? copy.cancelled.primary : { ...copy.complete.primary, to: toItem("FEEDBACK", outcome.member) }}
              secondary={outcomeTab === "complete" ? { ...copy.complete.secondary, to: toItem("DATE-COMPLETE", outcome.member) } : undefined}
            />
          );
        })}
      <ActionButton
        action={copy.findMore}
        variant="confirm"
        size="portalPill"
        width={tab === "all" ? "full" : "findMore"}
        className="max-sm:w-full"
      />
    </Workspace>
  );
}
