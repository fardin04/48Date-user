import { cn } from "@/lib/cn";
import type { TypeVariant } from "@/lib/type-scale";
import { Reveal } from "@/components/pieces/layout/reveal";
import { Text } from "@/components/pieces/content/text";

const sizes = {
  14: { title: "cardTitle14", gap: "gap-1" },
  20: { title: "cardTitle20", gap: "gap-3" },
  24: { title: "cardTitle24", gap: "gap-1" },
} satisfies Record<number, { title: TypeVariant; gap: string }>;

type CardHeadingProps = {
  title: string;
  description?: string;
  size: keyof typeof sizes;
  as?: "h2" | "h3";
  id?: string;
  /** Placement only (rule 17). */
  className?: string;
  revealDelay?: number;
};

/** Align UI "Content Card [1.1]" heading: semibold ss11 title over a 14/22 description. */
export function CardHeading({ title, description, size, as = "h2", id, className, revealDelay }: CardHeadingProps) {
  const style = sizes[size];
  return (
    <Reveal delay={revealDelay} className={cn("flex w-full flex-col", style.gap, className)}>
      <Text as={as} id={id} variant={style.title} tone="strong">
        {title}
      </Text>
      {description && (
        <Text variant="text14Relaxed" tone="sub">
          {description}
        </Text>
      )}
    </Reveal>
  );
}
