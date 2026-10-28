import { cn } from "@/lib/cn";
import { to } from "@/lib/routes";
import { textTones } from "@/lib/tones";
import { getMemberAvatar, getPortalShell } from "@/stores/portal-store";
import { ActionTarget } from "@/components/pieces/actions/action-target";
import { Avatar } from "@/components/pieces/media/avatar";
import { Icon } from "@/components/pieces/content/icon";
import { Logo } from "@/components/pieces/brand/logo";
import { Reveal } from "@/components/pieces/layout/reveal";
import { Text } from "@/components/pieces/content/text";

/** Header controls share a 44×44 hit area. */
const CONTROL = "focus-ring flex size-11 items-center justify-center rounded-full";

type PortalHeaderProps = {
  /** Label of the nav item for the open area ("Discover", "Matches"). */
  active?: string;
  /** Placement only (rule 17). */
  className?: string;
  revealDelay?: number;
};

/**
 * "48Date / Web Header": logo, the four member areas (labels hide below 640px, names stay
 * readable to assistive tech) and the notifications / profile menu.
 */
export function PortalHeader({ active, className, revealDelay }: PortalHeaderProps) {
  const shell = getPortalShell();
  return (
    <Reveal as="header" delay={revealDelay} className={cn("flex h-22 items-center justify-between gap-4 bg-white px-6 max-sm:px-4", className)}>
      <Logo size="header" to={to("DISCOVER")} label={shell.homeLabel} />
      <nav aria-label={shell.navLabel} className="bg-gray-25">
        <ul className="flex gap-6 max-sm:gap-4">
          {shell.nav.map((item) => {
            const current = item.label === active;
            return (
              <li key={item.label}>
                <ActionTarget
                  to={item.to}
                  aria-current={current ? "page" : undefined}
                  className={cn(
                    "focus-ring flex h-14 items-center gap-2 rounded-9 transition-opacity hover:opacity-75",
                    // 640–1023 ("Web Header / Portrait"): each destination is a 56px grey icon tile; phones keep bare icons.
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
      <div className="flex w-24 shrink-0 justify-end gap-2">
        <ActionTarget to={shell.notifications.to} aria-label={shell.notifications.label} className={cn(CONTROL, textTones.black)}>
          {shell.notifications.icon && <Icon name={shell.notifications.icon} size={24} />}
        </ActionTarget>
        <ActionTarget to={shell.profile.to} aria-label={shell.profile.label} className={CONTROL}>
          <Avatar image={getMemberAvatar()} size={40} decorative />
        </ActionTarget>
      </div>
    </Reveal>
  );
}
