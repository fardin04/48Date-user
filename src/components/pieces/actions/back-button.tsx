import { buttonVariants } from "@/components/ui/button";
import type { IconName } from "@/data/types";
import { cn } from "@/lib/cn";
import type { Destination } from "@/lib/routes";
import { ActionTarget } from "@/components/pieces/actions/action-target";
import { Icon } from "@/components/pieces/content/icon";
import { Reveal } from "@/components/pieces/layout/reveal";

type BackButtonProps = {
  label: string;
  icon: IconName;
  /** Back to another screen… */
  to?: Destination;
  /** …or to an earlier state of the same screen. */
  onClick?: () => void;
  /** Placement only (rule 17). */
  className?: string;
  revealDelay?: number;
};

/** "Onboarding / Back": 112×44 outline pill with a 24px dark arrow. */
export function BackButton({ label, icon, to, onClick, className, revealDelay }: BackButtonProps) {
  const classes = buttonVariants({ variant: "outline", size: "back", width: "setupBack" });
  const content = (
    <>
      <Icon name={icon} size={24} tone="iconDark" />
      {label}
    </>
  );
  return (
    <Reveal delay={revealDelay} className={cn("flex", className)}>
      {to ? (
        <ActionTarget to={to} className={cn(classes, "justify-start")}>
          {content}
        </ActionTarget>
      ) : (
        <button type="button" onClick={onClick} className={cn(classes, "justify-start")}>
          {content}
        </button>
      )}
    </Reveal>
  );
}
