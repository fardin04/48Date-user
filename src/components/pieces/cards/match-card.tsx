import Image from "next/image";
import type { ReactNode } from "react";
import type { Action, ImageAsset } from "@/data/types";
import { cn } from "@/lib/cn";
import { ActionButton } from "@/components/pieces/actions/action-button";
import { ActionTarget } from "@/components/pieces/actions/action-target";
import { Reveal } from "@/components/pieces/layout/reveal";
import { statusTabClass } from "@/components/pieces/feedback/status-tabs";
import { Text } from "@/components/pieces/content/text";
import { isRawImage } from "@/lib/image";
import { matchPhotoFrame } from "@/lib/control-sizes";

type MatchCardProps = {
  name: string;
  photo: ImageAsset;
  /** Time-left / "Date confirmed" badge. */
  badge: ReactNode;
  preview: string;
  primary: Action;
  secondary: Action;
  details: Action;
  /** Placement only (rule 17). */
  className?: string;
  revealDelay?: number;
};

/** "Match / …" card: 4:5 photo (240px at the Figma width, `matchPhotoFrame`), name, status badge, last message and three actions. */
export function MatchCard({ name, photo, badge, preview, primary, secondary, details, className, revealDelay }: MatchCardProps) {
  return (
    <Reveal as="article" delay={revealDelay} className={cn("flex h-full flex-col gap-3 overflow-hidden rounded-20 border border-soft-line bg-white p-4", className)}>
      <div className={cn("relative aspect-[4/5] w-full overflow-hidden rounded-16 bg-soft-line", matchPhotoFrame)}>
        <Image src={photo.src} unoptimized={isRawImage(photo.src)} alt={photo.alt} fill sizes="(min-width: 1024px) 360px, (min-width: 640px) 50vw, 100vw" className="object-cover object-top" />
      </div>
      <div className="flex flex-1 flex-col items-start gap-4">
        <Text as="h2" variant="text20SemiboldSnug" tone="strong" className="max-w-full break-anywhere">
          {name}
        </Text>
        {badge}
        {preview && (
          <Text variant="text16" tone="sub" className="line-clamp-2 max-w-full break-anywhere">
            {preview}
          </Text>
        )}
      </div>
      <ActionButton action={primary} variant="confirm" size="portalPill" width="full" />
      <ActionButton action={secondary} variant="roseOutline" size="portalPill" width="full" />
      <ActionTarget to={details.to} className={cn(statusTabClass(false), "w-full")}>
        {details.label}
      </ActionTarget>
    </Reveal>
  );
}
