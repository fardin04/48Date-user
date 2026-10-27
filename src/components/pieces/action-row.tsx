import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Reveal } from "./reveal";

type ActionRowProps = {
  /** Placement only (rule 17). */
  className?: string;
  revealDelay?: number;
  children: ReactNode;
};

/** Portal "Screen actions": buttons side by side with 12px gaps, stacked on phones. */
export function ActionRow({ className, revealDelay, children }: ActionRowProps) {
  return (
    <Reveal delay={revealDelay} className={cn("flex w-full flex-col gap-3 sm:flex-row sm:flex-wrap", className)}>
      {children}
    </Reveal>
  );
}
