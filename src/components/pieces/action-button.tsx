import type { VariantProps } from "class-variance-authority";
import Image from "next/image";
import { buttonVariants } from "@/components/ui/button";
import type { Action, ImageAsset } from "@/data/types";
import { cn } from "@/lib/cn";
import { ActionTarget } from "./action-target";
import { Icon } from "./icon";
import { Reveal } from "./reveal";

type ActionButtonProps = VariantProps<typeof buttonVariants> & {
  action: Action;
  /** Hide the action's icon where a variant of the design drops it. */
  hideIcon?: boolean;
  /** Multi-colour mark before the label (e.g. the Google "G"). */
  leadingImage?: ImageAsset;
  /** Placement only (rule 17). */
  className?: string;
  revealDelay?: number;
};

/** A data Action rendered as a button-styled link or not-yet-wired button. */
export function ActionButton({ action, variant, size, width, hideIcon, leadingImage, className, revealDelay }: ActionButtonProps) {
  const target = (
    <ActionTarget to={action.to} className={cn(buttonVariants({ variant, size, width }), revealDelay === undefined && className)}>
      {leadingImage && (
        <Image src={leadingImage.src} alt={leadingImage.alt} width={leadingImage.width} height={leadingImage.height} />
      )}
      {action.label}
      {action.icon && !hideIcon && <Icon name={action.icon} size={20} />}
    </ActionTarget>
  );
  if (revealDelay === undefined) return target;
  return (
    <Reveal delay={revealDelay} className={cn("inline-flex", className)}>
      {target}
    </Reveal>
  );
}
