"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ActionButton } from "@/components/pieces/actions/action-button";
import { ActionRow } from "@/components/pieces/actions/action-row";
import { Avatar } from "@/components/pieces/media/avatar";
import { FormHeader } from "@/components/pieces/forms/form-header";
import { PlaceCard } from "@/components/pieces/cards/place-card";
import { PortalBack } from "@/components/pieces/actions/portal-back";
import { PortalCard } from "@/components/pieces/layout/portal-card";
import { StatusNote } from "@/components/pieces/feedback/status-note";
import { Text } from "@/components/pieces/content/text";
import { Button } from "@/components/ui/button";
import type { Venue, VenueId } from "@/data/portal/dates";
import type { MemberId } from "@/data/portal/types";
import { cn } from "@/lib/cn";
import { fill } from "@/lib/format";
import { dateService } from "@/lib/portal/date-service";
import { hrefFor, toItem } from "@/lib/routes";
import { textTones } from "@/lib/tones";
import { getDatePage, getMember } from "@/stores/portal-store";
import { DateContext } from "@/components/sections/portal/dates/date-context";
import { StatusScreen } from "@/components/sections/portal/shared/status-screen";
import { Workspace } from "@/components/sections/portal/shared/workspace";

/** W06 / VENUES (VENUES-EMPTY when no public place fits): pick a place on the map or the list. */
export function VenuesView({ memberId }: { memberId: MemberId }) {
  const copy = getDatePage();
  const router = useRouter();
  const member = getMember(memberId);
  const [found, setFound] = useState<Venue[] | null>(null);
  const [selected, setSelected] = useState<VenueId | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    void Promise.all([dateService.getVenues(memberId), dateService.getPlan(memberId)]).then(([venues, plan]) => {
      if (!active) return;
      setFound(venues);
      setSelected((current) => current ?? plan.venue);
    });
    return () => {
      active = false;
    };
  }, [memberId, attempt]);

  if (!found) return null;
  const back = <PortalBack action={{ ...copy.back, to: toItem("CHAT-01", memberId) }} />;

  if (found.length === 0) {
    const { empty } = copy.venues;
    return (
      <StatusScreen
        back={back}
        title={empty.title}
        description={empty.description}
        summary={empty.summary}
        primary={empty.changeArea}
        secondary={{ label: empty.retry, onClick: () => setAttempt((count) => count + 1) }}
        aside={<DateContext member={memberId} venue={selected ?? "amber"} />}
        actionWidth="actionSlot"
      />
    );
  }

  const current = found.find((venue) => venue.id === selected) ?? found[0];
  const open = async (venue: VenueId) => {
    setSelected(venue);
    await dateService.saveDraft(memberId, { venue });
    router.push(hrefFor("VENUE-DETAIL", memberId));
  };

  return (
    <Workspace>
      <FormHeader variant="portal" title={copy.venues.title} description={copy.venues.description} />
      <PortalCard surface="rose" padding="sm" className="flex w-full items-center gap-4">
        <Avatar image={member.photo} size={48} decorative />
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <Text variant="text14SemiboldRelaxed" tone="strong">
            {copy.venues.recommendation.title}
          </Text>
          <Text variant="text14SemiboldRelaxed" tone="sub">
            {fill(copy.venues.recommendation.description, { name: member.name })}
          </Text>
        </div>
      </PortalCard>
      <div className="grid w-full gap-6 lg:grid-cols-[minmax(0,672fr)_minmax(0,520fr)]">
        <div className="flex flex-col gap-4">
          <div className="relative h-123 w-full overflow-hidden rounded-16 max-md:h-90">
            <Image src={copy.venues.map.src} alt={copy.venues.map.alt} fill sizes="(min-width: 1024px) 672px, 100vw" className="object-cover" />
            {found.map((venue) => {
              const on = venue.id === current.id;
              return (
                <button
                  key={venue.id}
                  type="button"
                  onClick={() => setSelected(venue.id)}
                  aria-pressed={on}
                  style={{ left: venue.pin.left, top: venue.pin.top }}
                  className={cn(
                    "focus-ring absolute flex w-50 max-w-[45%] cursor-pointer items-center gap-2 rounded-full border bg-white p-2 text-left",
                    on ? cn("border-rose", textTones.rose) : cn("border-soft-line", textTones.strong),
                  )}
                >
                  <Avatar image={venue.photo} size={32} decorative />
                  <Text as="span" variant="text12Medium" tone="inherit" className="min-w-0 flex-1 truncate">
                    {venue.name}
                  </Text>
                </button>
              );
            })}
          </div>
          <StatusNote variant="highlight" message={copy.venues.mapNote} />
        </div>
        <ul aria-label={copy.venues.listLabel} className="flex flex-col gap-4">
          {found.map((venue, index) => (
            <li key={venue.id} className="flex">
              <PlaceCard venue={venue} selected={venue.id === current.id} viewLabel={copy.venues.view} onView={() => void open(venue.id)} revealDelay={index * 60} />
            </li>
          ))}
        </ul>
      </div>
      <ActionRow>
        <Button type="button" variant="confirm" size="portalPill" width="actionSlot" onClick={() => void open(current.id)}>
          {current.name}
        </Button>
        <ActionButton action={copy.venues.changeArea} variant="roseOutline" size="portalPill" width="actionSlot" />
      </ActionRow>
    </Workspace>
  );
}
