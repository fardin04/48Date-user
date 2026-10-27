import type { Fact } from "@/data/portal/types";
import { cn } from "@/lib/cn";
import { Reveal } from "@/components/pieces/layout/reveal";
import { Text } from "@/components/pieces/content/text";

const layouts = {
  /** "Your preferences": one column, 16px apart. */
  stack: { list: "grid gap-4", item: "" },
  /** Flow context: one column, hairline under each fact. */
  divided: { list: "grid gap-2", item: "border-b border-divider pb-2" },
  /** Discovery overview: two columns. */
  pairs: { list: "grid grid-cols-2 gap-x-4 gap-y-3", item: "" },
  /** "About me": two columns on phones, three from 768px. */
  grid: { list: "grid grid-cols-2 gap-4 md:grid-cols-3", item: "" },
  /** W09 own "About me": the same grid with a hairline under each row of facts. */
  rows: { list: "grid grid-cols-2 gap-y-4 md:grid-cols-3", item: "border-b border-divider pr-4 pb-3" },
} as const;

type FactListProps = {
  facts: Fact[];
  layout: keyof typeof layouts;
  /** Placement only (rule 17). */
  className?: string;
  revealDelay?: number;
};

/** Profile and preference facts: 12/18 caption over a 14/22 value, as a description list. */
export function FactList({ facts, layout, className, revealDelay }: FactListProps) {
  const style = layouts[layout];
  return (
    <Reveal as="dl" delay={revealDelay} className={cn("w-full", style.list, className)}>
      {facts.map((fact) => (
        <div key={fact.label} className={cn("flex min-w-0 flex-col gap-1", style.item)}>
          <Text as="dt" variant="text12Medium" tone="sub">
            {fact.label}
          </Text>
          <Text as="dd" variant="text14SemiboldRelaxed" tone="strong">
            {fact.value}
          </Text>
        </div>
      ))}
    </Reveal>
  );
}
