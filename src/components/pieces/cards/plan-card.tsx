import type { Action } from "@/data/types";
import { cn } from "@/lib/cn";
import { ActionButton } from "@/components/pieces/actions/action-button";
import { Reveal } from "@/components/pieces/layout/reveal";
import { Text } from "@/components/pieces/content/text";

const surfaces = {
  plain: "border-soft-line bg-white",
  /** The recommended plan (Monthly): rose-light with the rose-mid hairline. */
  featured: "border-rose-mid bg-rose-light",
} as const;

type PlanCardProps = {
  name: string;
  headline: string;
  billing: string;
  features: string[];
  /** Accessible name of the features list ("Included with Weekly"). */
  featuresLabel: string;
  action: Action;
  surface?: keyof typeof surfaces;
  /** Placement only (rule 17). */
  className?: string;
  revealDelay?: number;
};

/** W10 PLANS "Plan / …": 24px-radius card with the name, a 36px rose price, billing, inclusions and Choose. */
export function PlanCard({ name, headline, billing, features, featuresLabel, action, surface = "plain", className, revealDelay }: PlanCardProps) {
  return (
    <Reveal as="article" delay={revealDelay} className={cn("flex flex-col gap-6 rounded-24 border p-6", surfaces[surface], className)}>
      <Text as="h2" variant="text20SemiboldSnug" tone="strong">
        {name}
      </Text>
      <Text variant="portalDisplay36" tone="rose">
        {headline}
      </Text>
      <Text variant="text14Relaxed" tone="sub">
        {billing}
      </Text>
      <ul aria-label={featuresLabel} className="flex flex-col">
        {features.map((feature) => (
          <Text key={feature} as="li" variant="text16" tone="sub">
            {feature}
          </Text>
        ))}
      </ul>
      <ActionButton action={action} variant="confirm" size="portalPill" width="full" className="mt-auto" />
    </Reveal>
  );
}
