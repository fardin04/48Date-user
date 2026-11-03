import { cn } from "@/lib/cn";
import { textTones } from "@/lib/tones";
import { getPortalShell } from "@/stores/portal-store";
import { ActionTarget } from "@/components/pieces/actions/action-target";
import { Icon } from "@/components/pieces/content/icon";
import { Reveal } from "@/components/pieces/layout/reveal";
import { Text } from "@/components/pieces/content/text";

type PortalTabBarProps = {
  /** Label of the nav item for the open area ("Discover", "Matches"). */
  active?: string;
  /** Placement only (rule 17). */
  className?: string;
  revealDelay?: number;
};

/**
 * Phones only (below 640px): the four member areas as a bottom tab bar, icon over label, as in
 * the mobile app. The header keeps the notifications / profile menu (design-silent, no web frame).
 */
export function PortalTabBar({ active, className, revealDelay }: PortalTabBarProps) {
  const shell = getPortalShell();
  return (
    <Reveal
      as="nav"
      aria-label={shell.navLabel}
      delay={revealDelay}
      className={cn("fixed inset-x-0 bottom-0 z-40 border-t border-gray-200 bg-white pb-[env(safe-area-inset-bottom)] sm:hidden", className)}
    >
      <ul className="grid grid-cols-4">
        {shell.nav.map((item) => {
          const current = item.label === active;
          return (
            <li key={item.label}>
              <ActionTarget
                to={item.to}
                aria-current={current ? "page" : undefined}
                className={cn("focus-ring flex h-16 flex-col items-center justify-center gap-1", current ? textTones.rose : textTones.navInk)}
              >
                <Icon name={item.icon} size={24} />
                <Text as="span" variant={current ? "text12Bold" : "text12Medium"} tone="inherit">
                  {item.label}
                </Text>
              </ActionTarget>
            </li>
          );
        })}
      </ul>
    </Reveal>
  );
}
