import Image from "next/image";
import type { Venue } from "@/data/portal/dates";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { Reveal } from "@/components/pieces/layout/reveal";
import { Text } from "@/components/pieces/content/text";
import { isRawImage } from "@/lib/image";

type PlaceCardProps = {
  venue: Venue;
  selected: boolean;
  viewLabel: string;
  onView: () => void;
  /** Placement only (rule 17). */
  className?: string;
  revealDelay?: number;
};

/**
 * "Card / <venue>" on VENUES: 112×128 photo, name, type and distance, highlight and "View place"; the
 * selected card is rose. When the card is narrower than 20rem (the text column would drop under
 * 160px) the photo stacks on top at 16:9.
 */
export function PlaceCard({ venue, selected, viewLabel, onView, className, revealDelay }: PlaceCardProps) {
  return (
    <Reveal
      as="article"
      delay={revealDelay}
      aria-current={selected || undefined}
      className={cn("@container w-full rounded-16 bg-white p-4", selected ? "border-[1.5px] border-rose" : "border border-soft-line", className)}
    >
      <div className="flex flex-col gap-4 @min-[18rem]:flex-row">
      <div className="relative aspect-video w-full shrink-0 overflow-hidden rounded-12 @min-[18rem]:aspect-auto @min-[18rem]:h-32 @min-[18rem]:w-28">
        <Image src={venue.photo.src} unoptimized={isRawImage(venue.photo.src)} alt={venue.photo.alt} fill sizes="(max-width: 400px) 90vw, 112px" className="object-cover" />
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <Text as="h2" variant="text20SemiboldSnug" tone="strong" className="break-anywhere">
          {venue.name}
        </Text>
        <Text variant="text12Medium" tone="sub">
          {venue.meta}
        </Text>
        {venue.areaDistance && (
          <Text variant="text12Medium" tone="strong">
            {venue.areaDistance}
          </Text>
        )}
        {venue.highlight && (
          <Text variant="text12Medium" tone={venue.highlightTone}>
            {venue.highlight}
          </Text>
        )}
        <Button type="button" variant="roseOutline" size="pillCompact" width="full" onClick={onView}>
          {viewLabel}
        </Button>
      </div>
      </div>
    </Reveal>
  );
}
