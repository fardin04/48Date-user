import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Reveal } from "./reveal";

type ChoiceGroupProps = {
  /** Accessible name of the group (usually the screen heading). */
  legend: string;
  /** Two cards per row from 640px; an odd last card spans the row, as in Figma. */
  layout?: "grid" | "list";
  /** Placement only (rule 17). */
  className?: string;
  revealDelay?: number;
  children: ReactNode;
};

/** Fieldset wrapping choice cards or option rows. */
export function ChoiceGroup({ legend, layout = "grid", className, revealDelay, children }: ChoiceGroupProps) {
  return (
    <Reveal as="fieldset" delay={revealDelay} className={cn("w-full min-w-0", className)}>
      <legend className="sr-only">{legend}</legend>
      <div
        className={cn(
          "grid gap-4",
          layout === "grid" && "sm:grid-cols-2 sm:[&>*:last-child:nth-child(odd)]:col-span-2",
        )}
      >
        {children}
      </div>
    </Reveal>
  );
}
