import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { sectionSpacing, type SectionSpacing } from "@/lib/control-sizes";
import { surfaces, type Surface } from "@/lib/tones";
import { Container } from "@/components/pieces/layout/container";

type SectionProps = {
  id?: string;
  /** id of the heading that names this region. */
  labelledBy?: string;
  surface?: Surface;
  spacing?: SectionSpacing;
  /** Wrap children in the page Container (default). */
  contained?: boolean;
  /** Placement only (rule 17). */
  className?: string;
  children: ReactNode;
};

/** A full-bleed page band: surface colour, vertical rhythm and the content column. */
export function Section({ id, labelledBy, surface = "white", spacing = "lg", contained = true, className, children }: SectionProps) {
  return (
    <section
      id={id}
      aria-labelledby={labelledBy}
      className={cn("relative scroll-mt-6", surfaces[surface], sectionSpacing[spacing], className)}
    >
      {contained ? <Container>{children}</Container> : children}
    </section>
  );
}
