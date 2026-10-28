import Image from "next/image";
import type { features } from "@/data/landing/features";
import { cn } from "@/lib/cn";
import { typeScale } from "@/lib/type-scale";
import { Chip } from "@/components/pieces/content/chip";
import { Icon } from "@/components/pieces/content/icon";
import { Reveal } from "@/components/pieces/layout/reveal";
import { Text } from "@/components/pieces/content/text";

type VenueCardProps = {
  venue: (typeof features)["planner"]["venue"];
  /** Placement only (rule 17). */
  className?: string;
  revealDelay?: number;
};

/** Illustrative date suggestion: map, venue, time and a decorative "Choose together" bar (nothing is booked). */
export function VenueCard({ venue, className, revealDelay }: VenueCardProps) {
  return (
    <Reveal delay={revealDelay} className={cn("flex flex-col rounded-20 bg-white p-4", className)}>
      <div className="relative aspect-[636/225] w-full overflow-hidden rounded-13">
        <Image src={venue.map.src} alt={venue.map.alt} fill sizes="(min-width: 1024px) 640px, 100vw" className="object-cover" />
      </div>
      <div className="flex flex-col px-2 pt-5.5 pb-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Text as="span" variant="text11Bold" tone="rose">
            {venue.eyebrow}
          </Text>
          <Text as="span" variant="text20Bold">
            {venue.name}
          </Text>
        </div>
        <div className="pt-4 pb-3">
          <Chip variant="schedule">{venue.time}</Chip>
        </div>
        <p className="flex items-center gap-1.5">
          <Icon name={venue.location.icon} size={16} tone="rose" />
          <Text as="span" variant="text14" tone="muted">
            {venue.location.label}
          </Text>
        </p>
        <span
          aria-hidden="true"
          className={cn("mt-4.5 flex h-11 items-center justify-center rounded-10 bg-rose text-white", typeScale.text13Bold)}
        >
          {venue.cta}
        </span>
      </div>
    </Reveal>
  );
}
