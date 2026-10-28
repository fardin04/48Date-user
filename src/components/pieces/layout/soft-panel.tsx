import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Reveal } from "@/components/pieces/layout/reveal";

type SoftPanelProps = {
  align?: "start" | "center";
  /** Placement only (rule 17). */
  className?: string;
  revealDelay?: number;
  children: ReactNode;
};

/** "Visual / …" panel of the setup screens: 16px-radius grey card holding a map, preview or status. */
export function SoftPanel({ align = "start", className, revealDelay, children }: SoftPanelProps) {
  return (
    <Reveal
      delay={revealDelay}
      className={cn("flex w-full flex-col gap-3 rounded-16 border border-gray-200 bg-gray-50 px-6 py-5", align === "center" && "text-center", className)}
    >
      {children}
    </Reveal>
  );
}
