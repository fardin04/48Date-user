import Image from "next/image";
import type { ImageAsset } from "@/data/types";
import { cn } from "@/lib/cn";
import { isRawImage } from "@/lib/image";

const sizes = {
  32: { box: "size-8", sizes: "32px" },
  40: { box: "size-10", sizes: "40px" },
  48: { box: "size-12", sizes: "48px" },
  96: { box: "size-24", sizes: "96px" },
} as const;

type AvatarProps = {
  image: ImageAsset;
  size: keyof typeof sizes;
  /** Hides the photo from assistive tech where a name is already beside it. */
  decorative?: boolean;
};

/** Round member photo (atom): 32px map pin, 40px header, 48px member row, 96px match artwork. */
export function Avatar({ image, size, decorative }: AvatarProps) {
  const spec = sizes[size];
  return (
    <span className={cn("relative block shrink-0 overflow-hidden rounded-full", spec.box)}>
      <Image src={image.src} unoptimized={isRawImage(image.src)} alt={decorative ? "" : image.alt} fill sizes={spec.sizes} className="object-cover" />
    </span>
  );
}
