import Image from "next/image";
import type { LikeReceived } from "@/data/portal/types";
import type { Action } from "@/data/types";
import type { Destination } from "@/lib/routes";
import { cn } from "@/lib/cn";
import { isRawImage } from "@/lib/image";
import { likePhotoFrame } from "@/lib/control-sizes";
import { ActionButton } from "@/components/pieces/actions/action-button";
import { ActionTarget } from "@/components/pieces/actions/action-target";
import { Chip } from "@/components/pieces/content/chip";
import { Icon } from "@/components/pieces/content/icon";
import { Reveal } from "@/components/pieces/layout/reveal";
import { Text } from "@/components/pieces/content/text";
import { Button } from "@/components/ui/button";

type LikeCardProps = {
  like: LikeReceived;
  /** "Wildflower, 26" (or the masked name in paywall mode). */
  title: string;
  /** "4 km away"; null when hidden. */
  distance: string | null;
  labels: { verified: string; superLike: string; pass: string; like: string; view: string };
  /** The member's profile; ignored for a locked like. */
  to: Destination;
  onPass: () => void;
  onLike: () => void;
  /** A decision on this card is being sent: both buttons wait. */
  busy?: boolean;
  /** Paywall mode: the note and the upgrade action replace Pass / Like. */
  locked?: { note: string; action: Action };
  /** Grid column width for `sizes`. */
  sizes: string;
  /** Placement only (rule 17). */
  className?: string;
  revealDelay?: number;
};

/** LIKES card: a 4:5 portrait (centre-top), name and age, distance in km, verified and Super Like, then Pass / Like. */
export function LikeCard({ like, title, distance, labels, to, onPass, onLike, busy, locked, sizes, className, revealDelay }: LikeCardProps) {
  const photo = (
    <div className={cn("relative aspect-[4/5] w-full overflow-hidden bg-soft-line", likePhotoFrame)}>
      <Image src={like.photo.src} unoptimized={isRawImage(like.photo.src)} alt={like.photo.alt} fill sizes={sizes} className="object-cover object-top" />
      {like.superLike && (
        <span className="absolute top-3 left-3 flex">
          <Chip variant="rose">{labels.superLike}</Chip>
        </span>
      )}
    </div>
  );
  return (
    <Reveal as="article" delay={revealDelay} aria-label={title} className={cn("flex min-w-0 flex-col overflow-hidden rounded-16 border border-soft-line bg-white", className)}>
      {locked ? photo : <ActionTarget to={to} aria-label={labels.view} className="focus-ring flex">{photo}</ActionTarget>}
      <div className="flex flex-1 flex-col gap-1 p-4">
        <Text as="h2" variant="text16Semibold" tone="strong" className="break-anywhere">
          {title}
        </Text>
        {(distance || like.verified) && (
          <p className="flex flex-wrap items-center gap-x-2 gap-y-1">
            {distance && (
              <Text as="span" variant="text14Medium" tone="sub">
                {distance}
              </Text>
            )}
            {like.verified && (
              <span className="flex items-center gap-1">
                <Icon name="shield-01" size={16} tone="success" />
                <Text as="span" variant="text12Medium" tone="success">
                  {labels.verified}
                </Text>
              </span>
            )}
          </p>
        )}
      </div>
      {locked ? (
        <div className="flex flex-col gap-3 px-4 pb-4">
          <Text variant="text12Medium" tone="sub">
            {locked.note}
          </Text>
          <ActionButton action={locked.action} variant="roseOutline" size="pillCompact" width="full" />
        </div>
      ) : (
        <div className="flex justify-center gap-4 px-4 pb-4">
          <Button type="button" variant="roseOutline" size="icon" aria-label={labels.pass} disabled={busy} onClick={onPass}>
            <Icon name="cancel-01" size={24} />
          </Button>
          <Button type="button" variant="confirm" size="icon" aria-label={labels.like} disabled={busy} onClick={onLike}>
            <Icon name="favourite" size={24} />
          </Button>
        </div>
      )}
    </Reveal>
  );
}
