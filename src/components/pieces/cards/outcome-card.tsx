import Image from "next/image";
import type { Action, ImageAsset } from "@/data/types";
import { cn } from "@/lib/cn";
import { ActionButton } from "@/components/pieces/actions/action-button";
import { PortalCard } from "@/components/pieces/layout/portal-card";
import { Text } from "@/components/pieces/content/text";
import { isRawImage } from "@/lib/image";

type OutcomeCardProps = {
  image: ImageAsset;
  title: string;
  meta: string;
  description: string;
  primary: Action;
  secondary?: Action;
  /** Placement only (rule 17). */
  className?: string;
  revealDelay?: number;
};

/** "Matches / Cancelled summary" and "Complete summary": 240px image beside the outcome and its next action. */
export function OutcomeCard({ image, title, meta, description, primary, secondary, className, revealDelay }: OutcomeCardProps) {
  return (
    <PortalCard as="article" surface="cool" padding="lg" revealDelay={revealDelay} className={cn("flex w-full flex-col gap-6 md:flex-row", className)}>
      <div className="relative aspect-square w-full shrink-0 overflow-hidden rounded-16 md:size-60">
        <Image src={image.src} unoptimized={isRawImage(image.src)} alt={image.alt} fill sizes="(min-width: 768px) 240px, 100vw" className="object-cover" />
      </div>
      <div className="flex min-w-0 flex-1 flex-col justify-center gap-4">
        <div className="flex flex-col gap-2">
          <Text as="h2" variant="text20SemiboldSnug" tone="strong">
            {title}
          </Text>
          <Text variant="text14SemiboldRelaxed" tone="sub">
            {meta}
          </Text>
          <Text variant="text16" tone="sub">
            {description}
          </Text>
        </div>
        <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap">
          <ActionButton action={primary} variant="confirm" size="pillCompact" width="summaryAction" className="max-sm:w-full" />
          {secondary && <ActionButton action={secondary} variant="roseOutline" size="pillCompact" width="summaryAction" className="max-sm:w-full" />}
        </div>
      </div>
    </PortalCard>
  );
}
