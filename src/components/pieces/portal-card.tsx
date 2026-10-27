import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Reveal } from "./reveal";

const surfaces = {
  /** Workspace card: white with the soft hairline. */
  outline: "border border-soft-line bg-white",
  /** Primary workspace: white, no hairline. */
  plain: "bg-white",
  /** Rose-light card ("3 active matches", status artwork, notification prompt). */
  rose: "bg-rose-light",
  /** Cool grey summary (cancelled and completed dates). */
  cool: "bg-canvas-cool",
  /** Status summary: grey 300 hairline. */
  summary: "border border-gray-300 bg-white",
} as const;

const paddings = {
  none: "",
  sm: "p-4",
  md: "p-5",
  /** 24px; 16px on phones. */
  lg: "p-6 max-sm:p-4",
  /** 32px; 24px on phones. */
  xl: "p-8 max-sm:p-6",
} as const;

const radii = { 16: "rounded-16", 20: "rounded-20", 24: "rounded-24" } as const;

type PortalCardProps = {
  surface: keyof typeof surfaces;
  padding?: keyof typeof paddings;
  radius?: keyof typeof radii;
  as?: "div" | "section" | "article" | "aside" | "nav";
  "aria-labelledby"?: string;
  "aria-label"?: string;
  /** Placement and inner layout only (rule 17). */
  className?: string;
  revealDelay?: number;
  children: ReactNode;
};

/** Member portal surface (W04 "Card / …", "Primary workspace", "Status summary"). */
export function PortalCard({ surface, padding = "none", radius = 16, as = "div", className, revealDelay, children, ...rest }: PortalCardProps) {
  return (
    <Reveal as={as} delay={revealDelay} className={cn("overflow-hidden", surfaces[surface], paddings[padding], radii[radius], className)} {...rest}>
      {children}
    </Reveal>
  );
}
