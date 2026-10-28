import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { textTones, type TextTone } from "@/lib/tones";
import { typeScale, type TypeVariant } from "@/lib/type-scale";
import { Reveal } from "@/components/pieces/layout/reveal";

type TextTag = "p" | "span" | "h1" | "h2" | "h3" | "h4" | "div" | "strong" | "small" | "blockquote" | "figcaption" | "li" | "dt" | "dd" | "legend";

type TextProps = {
  as?: TextTag;
  variant: TypeVariant;
  tone?: TextTone;
  id?: string;
  "aria-hidden"?: boolean;
  "aria-live"?: "polite" | "assertive";
  /** Placement only (rule 17). */
  className?: string;
  revealDelay?: number;
  children: ReactNode;
};

/** Every run of text on the site: a type-scale variant plus a tone. */
export function Text({ as: Tag = "p", variant, tone = "ink", className, revealDelay, ...rest }: TextProps) {
  const classes = cn(typeScale[variant], textTones[tone], className);
  if (revealDelay === undefined) return <Tag className={classes} {...rest} />;
  return <Reveal as={Tag} delay={revealDelay} className={classes} {...rest} />;
}
