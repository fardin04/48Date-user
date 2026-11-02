"use client";

import Image from "next/image";
import type { ReactNode } from "react";
import { ActionButton } from "@/components/pieces/actions/action-button";
import { ActionRow } from "@/components/pieces/actions/action-row";
import { DetailRow } from "@/components/pieces/cards/detail-row";
import { FormHeader } from "@/components/pieces/forms/form-header";
import { MemberRow } from "@/components/pieces/cards/member-row";
import { PortalBack } from "@/components/pieces/actions/portal-back";
import { StatusArtwork } from "@/components/pieces/feedback/status-artwork";
import { StatusBadge } from "@/components/pieces/feedback/status-badge";
import { StatusNote } from "@/components/pieces/feedback/status-note";
import type { MemberId } from "@/data/portal/types";
import { fill, timeLeft } from "@/lib/format";
import { toItem } from "@/lib/routes";
import { portalService } from "@/lib/portal/portal-service";
import { useLoaded } from "@/hooks/use-loaded";
import { forMember } from "@/lib/portal/member-link";
import { useNow } from "@/hooks/use-now";
import { getDatePage, getMatchDetailPage, getMatchesPage } from "@/stores/portal-store";
import { useDatePlan } from "@/hooks/use-date-plan";
import { liveData } from "@/lib/portal/live";
import { formatDay, formatTime } from "@/lib/portal/date-format";
import { isRawImage } from "@/lib/image";
import { FlowContext } from "@/components/sections/portal/shared/flow-context";
import { StatusScreen } from "@/components/sections/portal/shared/status-screen";
import { Workspace } from "@/components/sections/portal/shared/workspace";
import { screenKeys } from "@/lib/screen-keys";

/**
 * W04 / MATCH-EXPIRING on the match's URL, counting down to the server-owned deadline: under two
 * hours it is "Expiring soon", earlier it is an open match, and at zero it becomes MATCH-EXPIRED.
 */
export function MatchDetailView({ memberId }: { memberId: MemberId }) {
  const copy = getMatchDetailPage();
  const { urgentMinutes, confirmed: confirmedLabel, timeLeft: timeLeftLabel } = getMatchesPage();
  const match = useLoaded(screenKeys.match(memberId), () => portalService.getMatch(memberId)).value;
  const { plan } = useDatePlan(memberId);
  const now = useNow();
  if (match === undefined || now === null) return null;

  const back = <PortalBack action={copy.back} />;
  if (!match || (match.expiresAt !== null && match.expiresAt <= now)) return <ExpiredMatchScreen />;
  const member = match.summary;
  // Live: the plan's own place and time (nothing while no plan is sent); the mocks keep the drawn sample.
  // Only a plan still in play: sent, received or confirmed (not a declined or cancelled one).
  const planned = plan && ["pending", "invited", "confirmed"].includes(plan.status) && plan.place.name ? plan : null;
  const rows = getDatePage().rows;
  const facts = !liveData
    ? copy.expiring.facts
    : planned
      ? [
          { label: rows.where, value: planned.place.name },
          { label: rows.when, value: planned.date && planned.time !== null ? `${formatDay(planned.date)} · ${formatTime(planned.time)}` : "" },
          { label: rows.timezone, value: planned.timezone },
          { label: rows.meeting, value: planned.place.meetingPlace },
        ]
      : [];
  const image = !liveData ? copy.expiring.image : (planned?.place.photo ?? null);

  const left = match.expiresAt === null ? null : timeLeft(match.expiresAt, now);
  const urgent = left !== null && left.totalMinutes < urgentMinutes;
  const state = match.confirmed ? copy.confirmed : urgent ? copy.expiring : copy.active;
  const status = match.confirmed ? confirmedLabel : urgent ? copy.expiring.badge : copy.active.label;
  const badge = urgent ? (
    <StatusBadge variant="urgent" label={copy.expiring.badge} />
  ) : (
    <StatusBadge variant="success" label={left ? fill(timeLeftLabel, { hours: left.hours, minutes: left.minutes }) : status} live={false} />
  );

  return (
    <Workspace aside={<FlowContext />}>
      {back}
      <FormHeader variant="portal" title={state.title} description={fill(state.description, { name: member.name })} badge={badge} />
      <MemberRow photo={member.photo} title={fill(copy.expiring.pairTitle, { name: member.name })} description={status} />
      {image && (
        <div className="relative h-65 w-full overflow-hidden rounded-16">
          <Image src={image.src} alt={image.alt} unoptimized={isRawImage(image.src)} fill sizes="(min-width: 1280px) 860px, 100vw" className="object-cover" />
        </div>
      )}
      {facts.length > 0 && (
        <dl className="flex w-full flex-col">
          {facts.map((fact) => (
            <DetailRow key={fact.label} label={fact.label} value={fact.value} divided />
          ))}
        </dl>
      )}
      {left && <StatusNote variant="deadline" message={fill(copy.expiring.deadline, { hours: left.paddedHours, minutes: left.minutes })} />}
      <ActionRow>
        <ActionButton action={forMember(copy.expiring.primary, memberId)} variant="confirm" size="portalPill" width="grow" />
        <ActionButton action={{ label: copy.expiring.secondary, to: toItem("CHAT-01", memberId) }} variant="roseOutline" size="portalPill" width="grow" />
      </ActionRow>
    </Workspace>
  );
}

/** MATCH-EXPIRED: also shown when a conversation's 48-hour window has closed. */
export function ExpiredMatchScreen({ aside }: { aside?: ReactNode }) {
  const copy = getMatchDetailPage();
  const { expired } = copy;
  return (
    <StatusScreen
      back={<PortalBack action={copy.back} />}
      title={expired.title}
      description={expired.description}
      primary={expired.primary}
      secondary={expired.secondary}
      aside={aside}
    >
      <StatusArtwork icon={expired.icon} timer={expired.timer} timerLabel={expired.timerLabel} />
    </StatusScreen>
  );
}
