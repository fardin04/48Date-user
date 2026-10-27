import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Reveal } from "./reveal";

type SelfieFrameProps = {
  /** The live camera `<video>` (VERIFY-CAPTURE) or the captured image (VERIFY-REVIEW), filling the portrait. */
  children: ReactNode;
  /** Placement only (rule 17). */
  className?: string;
  revealDelay?: number;
};

/** "Media / own" on the verification screens: a 180×300 portrait centred on the 300px preview surface. */
export function SelfieFrame({ children, className, revealDelay }: SelfieFrameProps) {
  return (
    <Reveal delay={revealDelay} className={cn("flex h-75 w-full items-center justify-center overflow-hidden rounded-16 bg-preview", className)}>
      {/* Portrait proportions copied from the Figma preview (180.47 × 300). */}
      <div className="relative aspect-[180.47/300] h-full overflow-hidden rounded-12 bg-gray-200">{children}</div>
    </Reveal>
  );
}
