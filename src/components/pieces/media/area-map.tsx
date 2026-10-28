import Image from "next/image";
import type { MapVisual } from "@/data/onboarding/types";
import { Icon } from "@/components/pieces/content/icon";
import { SoftPanel } from "@/components/pieces/layout/soft-panel";
import { Text } from "@/components/pieces/content/text";

type AreaMapProps = {
  map: MapVisual;
  align?: "start" | "center";
  /** Placement only (rule 17). */
  className?: string;
  revealDelay?: number;
};

/** "Visual / LOCATION": decorative approximate-area map with a rose pin, title and privacy line. */
export function AreaMap({ map, align = "start", className, revealDelay }: AreaMapProps) {
  return (
    <SoftPanel align={align} className={className} revealDelay={revealDelay}>
      <div className="relative h-34 w-full overflow-hidden rounded-12 bg-gray-100">
        {/* 480px art, left-aligned as in Figma; centred on phones so the pin stays in view. */}
        <div className="absolute top-0 left-1/2 h-34 w-120 -translate-x-1/2 sm:left-0 sm:translate-x-0">
          <Image src={map.image.src} alt={map.image.alt} width={map.image.width} height={map.image.height} className="h-34 w-120 max-w-none" />
          {/* Pin position copied from the Figma map frame. */}
          <span className="absolute top-10 left-[236px] flex">
            <Icon name="location-01" size={40} tone="rose" />
          </span>
        </div>
      </div>
      <Text variant="text16Semibold" tone="strong">
        {map.title}
      </Text>
      <Text variant="text14Relaxed" tone="sub">
        {map.description}
      </Text>
    </SoftPanel>
  );
}
