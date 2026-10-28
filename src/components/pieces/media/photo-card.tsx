import Image from "next/image";
import type { ImageAsset } from "@/data/types";
import { cn } from "@/lib/cn";
import { Reveal } from "@/components/pieces/layout/reveal";
import { Text } from "@/components/pieces/content/text";

export type Photo = { image: ImageAsset; label: string; title: string };

type PhotoCardProps = {
  photo: Photo;
  sizes: string;
  /** Above-the-fold cards load eagerly (hero collage). */
  eager?: boolean;
  /** Placement and size only (rule 17). */
  className?: string;
  revealDelay?: number;
};

/** Framed photograph with a small label and bold caption over a dark fade (hero collage). */
export function PhotoCard({ photo, sizes, eager, className, revealDelay }: PhotoCardProps) {
  return (
    <Reveal
      as="figure"
      delay={revealDelay}
      className={cn("relative overflow-hidden rounded-20 border border-white/24 shadow-photo", className)}
    >
      <Image
        src={photo.image.src}
        alt={photo.image.alt}
        fill
        sizes={sizes}
        loading={eager ? "eager" : "lazy"}
        className="object-cover"
      />
      <figcaption className="absolute inset-x-0 bottom-0 flex flex-col gap-1.25 bg-linear-to-b from-scrim-deep/0 to-scrim-deep/88 px-6 pt-20 pb-5.5">
        <Text as="span" variant="text12" tone="white">
          {photo.label}
        </Text>
        <Text as="span" variant="text18Bold" tone="white">
          {photo.title}
        </Text>
      </figcaption>
    </Reveal>
  );
}
