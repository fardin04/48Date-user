import type { IconItem } from "@/data/types";
import { cn } from "@/lib/cn";
import type { TypeVariant } from "@/lib/type-scale";
import { Icon } from "@/components/pieces/content/icon";
import { Reveal } from "@/components/pieces/layout/reveal";
import { Text } from "@/components/pieces/content/text";

const variants = {
  /** Safety list: outlined row, 14px description. */
  outline: { box: "rounded-15 border border-line px-4.5 py-4.25 gap-4", text: "gap-1", description: "text14" },
  /** Premium benefits: white row, 12px description. */
  card: { box: "rounded-14 border border-line bg-white p-4 gap-3.5", text: "gap-0.75", description: "text12" },
  /** Frosted badge on photography ("Profile verified"). */
  glass: {
    box: "rounded-16 border border-white/70 bg-white/94 px-5 py-4 gap-3 shadow-float backdrop-blur-[14px]",
    text: "gap-0.5",
    description: "text12",
  },
} satisfies Record<string, { box: string; text: string; description: TypeVariant }>;

type IconRowProps = {
  item: IconItem;
  variant: keyof typeof variants;
  as?: "div" | "li";
  /** Placement only (rule 17). */
  className?: string;
  revealDelay?: number;
};

/** Rose icon beside a bold title and a short description. */
export function IconRow({ item, variant, as = "div", className, revealDelay }: IconRowProps) {
  const style = variants[variant];
  return (
    <Reveal as={as} delay={revealDelay} className={cn("flex items-center", style.box, className)}>
      <Icon name={item.icon} size={24} tone="rose" />
      <span className={cn("flex min-w-0 flex-col", style.text)}>
        <Text as="span" variant="text16Bold">
          {item.title}
        </Text>
        <Text as="span" variant={style.description} tone="muted">
          {item.description}
        </Text>
      </span>
    </Reveal>
  );
}
