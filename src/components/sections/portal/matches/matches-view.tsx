"use client";

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
import { getMatchesPage, getMember, getPortalShell } from "@/stores/portal-store";
import { StatusScreen } from "@/components/sections/portal/shared/status-screen";
import { Workspace } from "@/components/sections/portal/shared/workspace";

/** Time-left badge of a card: urgent under two hours, success otherwise, "Date confirmed" once agreed. */
function MatchBadge({ match, now }: { match: Match; now: number }) {
  const copy = getMatchesPage();
  if (match.expiresAt === null) return <StatusBadge variant="success" label={copy.confirmed} live={false} />;
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
  const loaded = useLoaded(portalService.getMatches).value;
  const now = useNow();
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
      />
    );
  }

  const tabs = copy.tabs.map((item) => ({ ...item, label: fill(item.label, { count: open.length }) }));
  const cancelledPhoto = getMember(copy.cancelled.photoOf).photo;

  return (
    <Workspace>
      <FormHeader variant="portalStatus" title={copy.title} description={copy.description} />
      <StatusTabs label={copy.tabsLabel} tabs={tabs} active={tab} />
      {tab === "all" && (
        <ul className="grid w-full gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {open.map((match, index) => {
            const member = getMember(match.member);
            const agreed = match.expiresAt === null;
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
      {tab === "cancelled" && (
        <OutcomeCard
          image={cancelledPhoto}
          title={copy.cancelled.title}
          meta={copy.cancelled.meta}
          description={copy.cancelled.description}
          primary={copy.cancelled.primary}
        />
      )}
      {tab === "complete" && (
        <OutcomeCard
          image={copy.complete.image}
          title={copy.complete.title}
          meta={copy.complete.meta}
          description={copy.complete.description}
          primary={copy.complete.primary}
          secondary={copy.complete.secondary}
        />
      )}
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
