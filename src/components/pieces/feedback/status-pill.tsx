import type { IconName } from "@/data/types";
import { cn } from "@/lib/cn";
import { Icon } from "@/components/pieces/content/icon";
import { Reveal } from "@/components/pieces/layout/reveal";
import { Text } from "@/components/pieces/content/text";

type StatusPillProps = {
  icon: IconName;
  label: string;
  /** Placement only (rule 17). */
  className?: string;
  revealDelay?: number;
};

/** Frosted status chip floating on a photo ("Profile 72% complete"). */
export function StatusPill({ icon, label, className, revealDelay }: StatusPillProps) {
  return (
    <Reveal
      delay={revealDelay}
      className={cn(
        "flex h-11 items-center gap-2.25 rounded-12 bg-white/92 px-4 py-3 shadow-float backdrop-blur-[10px]",
        className,
      )}
    >
      <Icon name={icon} size={18} tone="rose" />
      <Text as="span" variant="text13Semibold" className="whitespace-nowrap">
        {label}
      </Text>
    </Reveal>
  );
}
