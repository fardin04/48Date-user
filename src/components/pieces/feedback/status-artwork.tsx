import type { IconName, ImageAsset } from "@/data/types";
import { cn } from "@/lib/cn";
import { Avatar } from "@/components/pieces/media/avatar";
import { Icon } from "@/components/pieces/content/icon";
import { PortalCard } from "@/components/pieces/layout/portal-card";
import { Text } from "@/components/pieces/content/text";

type StatusArtworkProps = {
  icon: IconName;
  /** Shown as drawn ("48:00:00"); `timerLabel` is what assistive tech reads instead. */
  timer: string;
  timerLabel: string;
  photo?: ImageAsset;
  /** Placement only (rule 17). */
  className?: string;
  revealDelay?: number;
};

/** "Status artwork": rose-light 24px panel with a 64px icon, 36px rose timer and an optional 96px photo. */
export function StatusArtwork({ icon, timer, timerLabel, photo, className, revealDelay }: StatusArtworkProps) {
  return (
    <PortalCard surface="rose" radius={24} padding="xl" revealDelay={revealDelay} className={cn("flex w-full flex-col items-center gap-4", className)}>
      <Icon name={icon} size={64} tone="rose" />
      <Text variant="portalDisplay36" tone="rose" className="text-center">
        <span aria-hidden="true">{timer}</span>
        <span className="sr-only">{timerLabel}</span>
      </Text>
      {photo && <Avatar image={photo} size={96} />}
    </PortalCard>
  );
}
