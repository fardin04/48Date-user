import Image from "next/image";
import { ActionButton } from "@/components/pieces/actions/action-button";
import { FactList } from "@/components/pieces/cards/fact-list";
import { PortalCard } from "@/components/pieces/layout/portal-card";
import { Text } from "@/components/pieces/content/text";
import type { VenueId } from "@/data/portal/dates";
import type { MemberId } from "@/data/portal/types";
import { toItem } from "@/lib/routes";
import { getDatePage, getMember, getVenue } from "@/stores/portal-store";

/** "48Date / Web / Flow context" (Flow=Date): the match, the chosen place and its meeting point. */
export function DateContext({ member: memberId, venue: venueId }: { member: MemberId; venue: VenueId }) {
  const { context } = getDatePage();
  const member = getMember(memberId);
  const venue = getVenue(venueId);
  return (
    <PortalCard as="aside" surface="outline" padding="lg" revealDelay={80} aria-labelledby="date-context-title" className="flex w-full flex-col gap-5">
      <div className="flex flex-col gap-2 border-b border-divider pb-2">
        <Text as="h2" id="date-context-title" variant="text20SemiboldSnug" tone="strong">
          {context.title}
        </Text>
        <Text variant="text12Medium" tone="sub">
          {context.description}
        </Text>
      </div>
      <div className="relative h-34 w-full overflow-hidden rounded-12">
        <Image src={venue.photo.src} alt={venue.photo.alt} fill sizes="304px" className="object-cover" />
      </div>
      <FactList
        layout="divided"
        facts={[
          { label: context.match, value: member.name },
          { label: context.venue, value: venue.name },
          { label: context.meeting, value: venue.meetingPlace },
        ]}
      />
      <ActionButton action={{ label: context.chat, to: toItem("CHAT-01", memberId) }} variant="roseOutline" size="pillCompact" width="full" />
    </PortalCard>
  );
}
