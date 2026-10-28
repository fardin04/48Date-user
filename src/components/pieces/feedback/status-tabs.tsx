import type { Destination } from "@/lib/routes";
import { cn } from "@/lib/cn";
import { textTones } from "@/lib/tones";
import { typeScale } from "@/lib/type-scale";
import { ActionTarget } from "@/components/pieces/actions/action-target";
import { Reveal } from "@/components/pieces/layout/reveal";

/** "48Date / Web / Status tab": 44px pill, rose-light while active. Also styles "View match details". */
export function statusTabClass(active: boolean) {
  return cn(
    "focus-ring flex h-11 items-center justify-center rounded-full px-3 text-center transition-colors",
    typeScale.text14SemiboldRelaxed,
    active ? cn("bg-rose-light", textTones.rose) : cn("bg-white hover:bg-weak", textTones.sub),
  );
}

type StatusTabsProps = {
  label: string;
  tabs: { key: string; label: string; to: Destination }[];
  active: string;
  /** Placement only (rule 17). */
  className?: string;
  revealDelay?: number;
};

/** Match status navigation: each tab is its own URL, the open one is marked as the current page. */
export function StatusTabs({ label, tabs, active, className, revealDelay }: StatusTabsProps) {
  return (
    <Reveal as="nav" delay={revealDelay} aria-label={label} className={cn("w-full", className)}>
      <ul className="flex gap-2">
        {tabs.map((tab) => (
          <li key={tab.key} className="min-w-0 max-sm:flex-1 sm:w-39">
            <ActionTarget to={tab.to} aria-current={tab.key === active ? "page" : undefined} className={cn(statusTabClass(tab.key === active), "w-full")}>
              {tab.label}
            </ActionTarget>
          </li>
        ))}
      </ul>
    </Reveal>
  );
}
