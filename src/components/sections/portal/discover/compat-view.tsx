"use client";

import { ActionButton } from "@/components/pieces/actions/action-button";
import { ActionRow } from "@/components/pieces/actions/action-row";
import { CardHeading } from "@/components/pieces/content/card-heading";
import { FormHeader } from "@/components/pieces/forms/form-header";
import { MemberRow } from "@/components/pieces/cards/member-row";
import { PortalBack } from "@/components/pieces/actions/portal-back";
import { PortalCard } from "@/components/pieces/layout/portal-card";
import { SignalBar } from "@/components/pieces/feedback/signal-bar";
import { StatusNote } from "@/components/pieces/feedback/status-note";
import type { MemberId } from "@/data/portal/types";
import { fill } from "@/lib/format";
import { useProfileDraft } from "@/lib/onboarding/profile-draft";
import { toItem } from "@/lib/routes";
import { getCompatPage, getPortalShell, getProfilePage } from "@/stores/portal-store";
import { Chip } from "@/components/pieces/content/chip";
import { useMember } from "@/hooks/use-member";
import { sharedInterestsText } from "@/lib/portal/shared-interests";
import { MemberUnavailable } from "@/components/sections/portal/shared/member-unavailable";
import { FlowContext } from "@/components/sections/portal/shared/flow-context";
import { StatusScreen } from "@/components/sections/portal/shared/status-screen";
import { Workspace } from "@/components/sections/portal/shared/workspace";

/**
 * W04 / COMPAT: why the member and a candidate could click. Until the member has saved
 * interests in onboarding there is nothing shared to compare, so COMPAT-PENDING shows instead.
 */
export function CompatView({ memberId }: { memberId: MemberId }) {
  const copy = getCompatPage();
  const shell = getPortalShell();
  const member = useMember(memberId);
  const { interests } = useProfileDraft();
  const back = <PortalBack action={shell.back} />;

  if (member === null) return <MemberUnavailable />;
  if (!member) return null;
  // API members carry the interests both share; the samples compare against the onboarding draft.
  const scored = member.compatibility !== null;
  if (scored && interests.length === 0) {
    const { pending } = copy;
    return (
      <StatusScreen
        back={back}
        title={pending.title}
        description={pending.description}
        summary={pending.summary}
        primary={pending.primary}
        secondary={pending.secondary}
      />
    );
  }

  return (
    <Workspace aside={<FlowContext />}>
      {back}
      <FormHeader variant="portal" title={copy.title} description={fill(copy.description, { name: member.name })} />
      <MemberRow photo={member.photo} title={fill(copy.pair.title, { name: member.name })} description={copy.pair.description} />
      <PortalCard as="section" surface="outline" padding="sm" aria-labelledby="compat-title" className="flex w-full flex-col gap-4">
        <CardHeading
          id="compat-title"
          size={20}
          title={member.compatibility === null ? sharedInterestsText(member) : fill(copy.card.title, { percent: member.compatibility })}
          description={copy.card.description}
        />
        {scored ? (
          copy.signals.map((signal) => <SignalBar key={signal.label} label={signal.label} value={signal.value} format={getProfilePage().percent} />)
        ) : (
          <ul className="flex flex-wrap gap-2">
            {(member.sharedInterests ?? []).map((interest) => (
              <li key={interest} className="flex">
                <Chip variant="rose">{interest}</Chip>
              </li>
            ))}
          </ul>
        )}
      </PortalCard>
      {scored && <StatusNote variant="highlight" message={copy.highlight} />}
      <ActionRow>
        <ActionButton action={{ label: copy.primary, to: toItem("DISCOVER-PROFILE", member.id) }} variant="confirm" size="portalPill" width="grow" />
        <ActionButton action={{ label: copy.secondary, to: toItem("CHAT-01", member.id) }} variant="roseOutline" size="portalPill" width="grow" />
      </ActionRow>
    </Workspace>
  );
}
