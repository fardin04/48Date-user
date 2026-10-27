import Image from "next/image";
import type { StoreBadge } from "@/data/landing/download";
import { cn } from "@/lib/cn";
import { ActionTarget } from "@/components/pieces/actions/action-target";
import { Reveal } from "@/components/pieces/layout/reveal";

type StoreBadgesProps = {
  badges: StoreBadge[];
  /** Placement only (rule 17). */
  className?: string;
  revealDelay?: number;
};

/** Official App Store / Google Play badges. */
export function StoreBadges({ badges, className, revealDelay }: StoreBadgesProps) {
  return (
    <Reveal delay={revealDelay} className={cn("flex flex-wrap justify-center gap-4", className)}>
      {badges.map((badge) => (
        <ActionTarget key={badge.label} to={badge.to} aria-label={badge.label} className="focus-ring cursor-pointer rounded-11">
          <Image src={badge.image.src} alt={badge.image.alt} width={badge.image.width} height={badge.image.height} />
        </ActionTarget>
      ))}
    </Reveal>
  );
}
