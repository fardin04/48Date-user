import { cn } from "@/lib/cn";
import { to } from "@/lib/routes";
import { textTones } from "@/lib/tones";
import { getPortalShell } from "@/stores/portal-store";
import { ActionTarget } from "@/components/pieces/actions/action-target";
import { HeaderMenu } from "@/components/pieces/shells/header-menu";
import { Icon } from "@/components/pieces/content/icon";
import { Logo } from "@/components/pieces/brand/logo";
import { Reveal } from "@/components/pieces/layout/reveal";
import { Text } from "@/components/pieces/content/text";

type PortalHeaderProps = {
  /** Label of the nav item for the open area ("Discover", "Matches"). */
  active?: string;
  /** Placement only (rule 17). */
  className?: string;
  revealDelay?: number;
};

/**
 * "48Date / Web Header": logo, the four member areas (icon tiles from 640 to 1023px; phones
 * move them to `PortalTabBar`) and the notifications / profile menu.
 */
export function PortalHeader({ active, className, revealDelay }: PortalHeaderProps) {
  const shell = getPortalShell();
  return (
    <Reveal as="header" delay={revealDelay} className={cn("flex h-22 items-center justify-between gap-4 bg-white px-6 max-sm:px-4", className)}>
      <Logo size="header" to={to("DISCOVER")} label={shell.homeLabel} />
      <nav aria-label={shell.navLabel} className="bg-gray-25 max-sm:hidden">
        <ul className="flex gap-6">
          {shell.nav.map((item) => {
            const current = item.label === active;
            return (
              <li key={item.label}>
                <ActionTarget
                  to={item.to}
                  aria-current={current ? "page" : undefined}
                  className={cn(
                    "focus-ring flex h-14 items-center gap-2 rounded-9 transition-opacity hover:opacity-75",
                    // 640–1023 ("Web Header / Portrait"): each destination is a 56px grey icon tile.
                    "max-lg:justify-center sm:max-lg:w-14 sm:max-lg:rounded-10 sm:max-lg:bg-row-pill",
                    current ? textTones.rose : textTones.navInk,
                  )}
                >
                  <Icon name={item.icon} size={24} />
                  <Text as="span" variant={current ? "text16Bold" : "text16"} tone="inherit" className="max-lg:sr-only">
                    {item.label}
                  </Text>
                </ActionTarget>
              </li>
            );
          })}
        </ul>
      </nav>
      <HeaderMenu />
    </Reveal>
  );
}
