import type { Action } from "@/data/types";
import { cn } from "@/lib/cn";
import { textTones, type TextTone } from "@/lib/tones";
import { typeScale, type TypeVariant } from "@/lib/type-scale";
import { ActionTarget } from "./action-target";
import { Icon } from "./icon";
import { Reveal } from "./reveal";

type LinkVariant = { type: TypeVariant; tone: TextTone; extra: string; icon?: "leading" | "trailing-circle"; iconSize?: 20 | 24 };

const linkVariants = {
  /** Glass nav: 14 semibold, rendered in Title Case. */
  navGlass: { type: "text14Semibold", tone: "ink", extra: "capitalize" },
  /** Solid nav: 16 semibold. */
  navSolid: { type: "text16Semibold", tone: "strong", extra: "" },
  footer: { type: "text14", tone: "white", extra: "" },
  footerTitleCase: { type: "text14", tone: "white", extra: "capitalize" },
  /** Rose inline link ("Or continue in your browser →"). */
  rose: { type: "text16Bold", tone: "rose", extra: "" },
  /** Legal contents list. */
  contents: { type: "text16Medium", tone: "sub", extra: "whitespace-pre-wrap hover:text-rose" },
  /** Hero "Explore the story" cue with circular icon. */
  cue: { type: "text14", tone: "white", extra: "gap-3", icon: "trailing-circle" },
  /** Auth "Back to website": 20px dark arrow, 8px gap, 44px target. */
  back: { type: "text14MediumRelaxed", tone: "sub", extra: "h-11 gap-2", icon: "leading" },
  /** Onboarding sidebar "Back to website": muted 14/22 medium, 20px dark arrow. */
  setupBack: { type: "text14MediumRelaxed", tone: "muted", extra: "h-11 gap-2", icon: "leading" },
  /** Portal "Back": 44px row, 24px dark arrow, 14/22 semibold. */
  portalBack: { type: "text14SemiboldRelaxed", tone: "strong", extra: "h-11 w-40 gap-2", icon: "leading", iconSize: 24 },
  /** Auth rose text action ("Already have an account? Sign in"). */
  authInline: { type: "text14SemiboldRelaxed", tone: "rose", extra: "h-11" },
  /** Auth code recovery ("Resend code", "Change number"): underlined, 44px target. */
  authRecovery: { type: "text14SemiboldRelaxed", tone: "rose", extra: "h-11 underline decoration-[11%] underline-offset-[3px]" },
  /** Inline legal link inside consent copy. */
  consent: { type: "text14Relaxed", tone: "sub", extra: "underline-offset-2 hover:underline" },
} satisfies Record<string, LinkVariant>;

export type ActionLinkVariant = keyof typeof linkVariants;

/** Classes for a link-styled control; also used by client buttons that act like links. */
export function actionLinkClass(variant: ActionLinkVariant) {
  const style: LinkVariant = linkVariants[variant];
  return cn(
    "focus-ring inline-flex cursor-pointer items-center rounded-9 transition-opacity hover:opacity-75",
    typeScale[style.type],
    textTones[style.tone],
    style.extra,
  );
}

type ActionLinkProps = {
  action: Action;
  variant: ActionLinkVariant;
  /** Placement only (rule 17). */
  className?: string;
  revealDelay?: number;
};

/** A data Action rendered as a text link. */
export function ActionLink({ action, variant, className, revealDelay }: ActionLinkProps) {
  const style: LinkVariant = linkVariants[variant];
  const link = (
    <ActionTarget to={action.to} className={cn(actionLinkClass(variant), revealDelay === undefined && className)}>
      {action.icon && style.icon === "leading" && <Icon name={action.icon} size={style.iconSize ?? 20} tone="iconDark" />}
      {action.label}
      {action.icon && style.icon === "trailing-circle" && (
        <span className="flex size-10 items-center justify-center rounded-full border border-white/30">
          <Icon name={action.icon} size={20} tone="rose" />
        </span>
      )}
    </ActionTarget>
  );
  if (revealDelay === undefined) return link;
  return (
    <Reveal delay={revealDelay} className={cn("inline-flex", className)}>
      {link}
    </Reveal>
  );
}
