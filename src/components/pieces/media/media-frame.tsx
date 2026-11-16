"use client";

import Image from "next/image";
import { useState } from "react";
import { cn } from "@/lib/cn";
import { mediaHeights, type MediaHeight } from "@/lib/control-sizes";
import { isRawImage } from "@/lib/image";
import { cssAspect, frameRatio } from "@/lib/media/aspect";
import { surfaces } from "@/lib/tones";
import { Reveal } from "@/components/pieces/layout/reveal";

const radii = { 12: "rounded-12", 16: "rounded-16", 20: "rounded-20" } as const;

type MediaFrameProps = {
  src: string;
  alt: string;
  /** Known pixel size (from the API or the chosen file); otherwise the photo is measured once it loads. */
  width?: number;
  height?: number;
  /** Tallest the frame may grow; a taller photo narrows to keep its ratio. */
  maxHeight: MediaHeight;
  sizes: string;
  rounded?: keyof typeof radii;
  /** Placement only (rule 17). */
  className?: string;
  revealDelay?: number;
};

/**
 * A user photo at its own ratio (rule 50): a 16:9, 9:16, 4:3, 3:4 or 1:1 upload is framed at that
 * ratio, contained (never cropped or stretched) and capped at `maxHeight`. Without known dimensions
 * it holds a 4:3 placeholder and takes the measured ratio on load.
 */
export function MediaFrame({ src, alt, width, height, maxHeight, sizes, rounded = 16, className, revealDelay }: MediaFrameProps) {
  const [measured, setMeasured] = useState<{ src: string; width: number; height: number } | null>(null);
  const size = measured?.src === src ? measured : { width, height };
  const ratio = frameRatio(size.width, size.height);
  const max = mediaHeights[maxHeight];
  return (
    <Reveal delay={revealDelay} className={cn("w-full", className)}>
      <div
        className={cn("relative mx-auto w-full overflow-hidden", radii[rounded], surfaces.media)}
        style={{ aspectRatio: cssAspect(ratio), maxHeight: max, maxWidth: `calc(${max} * ${cssAspect(ratio)})` }}
      >
        <Image
          src={src}
          alt={alt}
          fill
          sizes={sizes}
          unoptimized={isRawImage(src)}
          className="object-contain"
          onLoad={(event) => {
            const img = event.currentTarget;
            if (img.naturalWidth > 0 && img.naturalHeight > 0) setMeasured({ src, width: img.naturalWidth, height: img.naturalHeight });
          }}
        />
      </div>
    </Reveal>
  );
}
