import Image from "next/image";
import { cn } from "@/lib/cn";
import { Reveal } from "./reveal";

const frames = {
  /** PHOTOS grid tile, 232px tall. */
  tile: "h-58 rounded-16",
  /** PHOTO-PREVIEW: fills the remaining height on the preview surface. */
  preview: "min-h-58 flex-1 rounded-16 bg-preview",
  /** W09 PHOTO-MANAGE slot, 160px tall. */
  manage: "h-40 rounded-16",
} as const;

type PhotoTileProps = {
  /** Object URL of a member photo (or the sample photo's path). */
  src: string;
  alt: string;
  frame?: keyof typeof frames;
  /** Placement only (rule 17). */
  className?: string;
  revealDelay?: number;
};

/** A member photo cropped to its frame. */
export function PhotoTile({ src, alt, frame = "tile", className, revealDelay }: PhotoTileProps) {
  return (
    <Reveal delay={revealDelay} className={cn("relative w-full overflow-hidden", frames[frame], className)}>
      {/* Local object URL: nothing for the image optimizer to fetch. */}
      <Image src={src} alt={alt} fill unoptimized sizes="560px" className="object-cover" />
    </Reveal>
  );
}
