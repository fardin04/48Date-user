import Image from "next/image";
import type { Venue } from "@/data/portal/dates";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { Reveal } from "./reveal";
import { Text } from "./text";

type PlaceCardProps = {
  venue: Venue;
  selected: boolean;
  viewLabel: string;
  onView: () => void;
  /** Placement only (rule 17). */
  className?: string;
  revealDelay?: number;
};

/** "Card / <venue>" on VENUES: 112×128 photo, name, type and distance, highlight and "View place"; the selected card is rose. */
export function PlaceCard({ venue, selected, viewLabel, onView, className, revealDelay }: PlaceCardProps) {
  return (
    <Reveal
      as="article"
      delay={revealDelay}
      aria-current={selected || undefined}
      className={cn("flex w-full gap-4 rounded-16 bg-white p-4", selected ? "border-[1.5px] border-rose" : "border border-soft-line", className)}
    >
      <div className="relative h-32 w-28 shrink-0 overflow-hidden rounded-12">
        <Image src={venue.photo.src} alt={venue.photo.alt} fill sizes="112px" className="object-cover" />
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <Text as="h2" variant="text20SemiboldSnug" tone="strong">
          {venue.name}
        </Text>
        <Text variant="text12Medium" tone="sub">
          {venue.meta}
        </Text>
        <Text variant="text12Medium" tone={venue.highlightTone}>
          {venue.highlight}
        </Text>
        <Button type="button" variant="roseOutline" size="pillCompact" width="full" onClick={onView}>
          {viewLabel}
        </Button>
      </div>
    </Reveal>
  );
}
