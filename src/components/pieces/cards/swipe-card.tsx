import Image from "next/image";
import type { CSSProperties, PointerEventHandler } from "react";
import type { Member } from "@/data/portal/types";
import type { IconName } from "@/data/types";
import { cn } from "@/lib/cn";
import { Chip } from "@/components/pieces/content/chip";
import { Icon } from "@/components/pieces/content/icon";
import { Reveal } from "@/components/pieces/layout/reveal";
import { Text } from "@/components/pieces/content/text";
import { isRawImage } from "@/lib/image";

/** Pointer handlers of the photo's drag zone (left half passes, right half likes). */
export type DragZone = {
  onPointerDown: PointerEventHandler<HTMLDivElement>;
  onPointerMove: PointerEventHandler<HTMLDivElement>;
  onPointerUp: PointerEventHandler<HTMLDivElement>;
  onPointerCancel: PointerEventHandler<HTMLDivElement>;
};

type SwipeCardProps = {
  member: Member;
  title: string;
  verifiedLine: string;
  /** "Swipe feedback / …" tag over the photo while a decision is shown. */
  feedback?: { label: string; icon: IconName };
  /** Horizontal drag offset in px; the card follows the pointer and tilts slightly. */
  offset?: number;
  dragging?: boolean;
  drag?: DragZone;
  /** id of the visually hidden drag instructions. */
  dragHintId?: string;
  titleId?: string;
  /** Placement only (rule 17). */
  className?: string;
  revealDelay?: number;
};

/** Tilt per pixel dragged, so a full-width drag leans the card a few degrees. */
const TILT_PER_PX = 1 / 24;

/** "48Date / Web / Swipe card": 448×464 photo, name, distance, shared interests and trust line. */
export function SwipeCard({ member, title, verifiedLine, feedback, offset = 0, dragging, drag, dragHintId, titleId, className, revealDelay }: SwipeCardProps) {
  const moved = offset !== 0;
  const style: CSSProperties | undefined = moved ? { transform: `translateX(${offset}px) rotate(${offset * TILT_PER_PX}deg)` } : undefined;
  return (
    <Reveal
      as="article"
      delay={revealDelay}
      aria-labelledby={titleId}
      style={style}
      className={cn(
        "w-full overflow-hidden rounded-16 border border-soft-line bg-white",
        !dragging && "transition-transform duration-200 ease-out motion-reduce:transition-none",
        className,
      )}
    >
      <div {...drag} aria-describedby={dragHintId} className={cn("relative aspect-[448/464] w-full select-none", drag && "cursor-grab touch-pan-y active:cursor-grabbing")}>
        <Image
          src={member.photo.src} unoptimized={isRawImage(member.photo.src)}
          alt={member.photo.alt}
          fill
          draggable={false}
          sizes="(min-width: 1024px) 448px, calc(100vw - 32px)"
          className="pointer-events-none object-cover"
        />
        {feedback && (
          <div className="absolute top-12 left-6 flex w-45 items-start gap-2 rounded-12 border border-rose bg-white p-3">
            <Icon name={feedback.icon} size={24} tone="rose" />
            <Text as="span" variant="text14SemiboldRelaxed" tone="rose" className="min-w-0 flex-1">
              {feedback.label}
            </Text>
          </div>
        )}
      </div>
      <div className="flex flex-col gap-2 bg-white p-5">
        <Text as="h2" id={titleId} variant="text20SemiboldSnug" tone="strong">
          {title}
        </Text>
        <Text variant="text14SemiboldRelaxed" tone="sub">
          {verifiedLine}
        </Text>
        <ul className="flex flex-wrap gap-2">
          {member.cardInterests.map((interest) => (
            <li key={interest} className="flex">
              <Chip variant="neutral">{interest}</Chip>
            </li>
          ))}
        </ul>
        <p className="flex items-start gap-2">
          <Icon name="shield-01" size={20} tone="success" />
          <Text as="span" variant="text12Medium" tone="success" className="min-w-0 flex-1">
            {member.trustLine}
          </Text>
        </p>
      </div>
    </Reveal>
  );
}
