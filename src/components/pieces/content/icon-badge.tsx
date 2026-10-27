import type { IconName } from "@/data/types";
import { cn } from "@/lib/cn";
import { Icon } from "@/components/pieces/content/icon";

const variants = {
  roseLight: "bg-rose-light",
  neutral: "bg-gray-50",
  onDark: "bg-white/10",
} as const;

/** 52px rounded tile holding a 24px rose icon (feature cards). */
export function IconBadge({ icon, variant = "roseLight" }: { icon: IconName; variant?: keyof typeof variants }) {
  return (
    <span className={cn("flex size-13 items-center justify-center rounded-14", variants[variant])}>
      <Icon name={icon} size={24} tone="rose" />
    </span>
  );
}
