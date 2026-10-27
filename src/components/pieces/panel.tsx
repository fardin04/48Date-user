import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Reveal } from "./reveal";

const surfaces = {
  mist: "bg-mist",
  roseLight: "bg-rose-light",
  night: "bg-night",
  /** Premium card: white→petal gradient with a rose hairline. */
  premium: "border border-rose-line bg-linear-[152deg] from-white from-6% to-petal to-94% drop-shadow-card",
} as const;

const paddings = {
  none: "",
  /** 48px at desktop */
  md: "p-6 md:p-10 xl:p-12",
  /** 60px at desktop */
  lg: "p-6 md:p-10 xl:p-15",
} as const;

type PanelProps = {
  surface: keyof typeof surfaces;
  padding?: keyof typeof paddings;
  as?: "div" | "article";
  /** Placement and inner layout only (rule 17). */
  className?: string;
  revealDelay?: number;
  children: ReactNode;
};

/** 32px-radius content surface used by feature cards and the Premium card. */
export function Panel({ surface, padding = "none", as = "div", className, revealDelay, children }: PanelProps) {
  return (
    <Reveal as={as} delay={revealDelay} className={cn("overflow-hidden rounded-32", surfaces[surface], paddings[padding], className)}>
      {children}
    </Reveal>
  );
}
