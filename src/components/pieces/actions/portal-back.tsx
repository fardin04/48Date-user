import type { Action } from "@/data/types";
import { cn } from "@/lib/cn";
import { ActionLink, actionLinkClass } from "@/components/pieces/actions/action-link";
import { Icon } from "@/components/pieces/content/icon";
import { Reveal } from "@/components/pieces/layout/reveal";

type PortalBackProps = {
  /** Back to another screen… */
  action: Action;
  /** …or, when given, to an earlier state of this screen (the action's label and icon are kept). */
  onClick?: () => void;
  /** Placement only (rule 17). */
  className?: string;
  revealDelay?: number;
};

/** "Back navigation / Portal": 160×44 row with a 24px dark arrow. */
export function PortalBack({ action, onClick, className, revealDelay }: PortalBackProps) {
  if (!onClick) return <ActionLink action={action} variant="portalBack" className={className} revealDelay={revealDelay ?? 0} />;
  return (
    <Reveal delay={revealDelay ?? 0} className={cn("inline-flex", className)}>
      <button type="button" onClick={onClick} className={actionLinkClass("portalBack")}>
        {action.icon && <Icon name={action.icon} size={24} tone="iconDark" />}
        {action.label}
      </button>
    </Reveal>
  );
}
