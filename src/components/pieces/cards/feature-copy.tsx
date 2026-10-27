import type { FeatureCopy as FeatureCopyData } from "@/data/landing/features";
import { cn } from "@/lib/cn";
import { IconBadge } from "@/components/pieces/content/icon-badge";
import { Reveal } from "@/components/pieces/layout/reveal";
import { Text } from "@/components/pieces/content/text";

const tones = {
  light: { badge: "roseLight", title: "ink", description: "muted" },
  neutral: { badge: "neutral", title: "ink", description: "muted" },
  dark: { badge: "onDark", title: "white", description: "white" },
} as const;

type FeatureCopyProps = {
  copy: FeatureCopyData;
  tone?: keyof typeof tones;
  /** Placement only (rule 17). */
  className?: string;
  revealDelay?: number;
};

/** Icon tile, eyebrow, heading and description used by each feature card. */
export function FeatureCopy({ copy, tone = "light", className, revealDelay }: FeatureCopyProps) {
  const colors = tones[tone];
  return (
    <Reveal delay={revealDelay} className={cn("flex flex-col items-start", className)}>
      <IconBadge icon={copy.icon} variant={colors.badge} />
      <Text variant="text13Bold" tone="rose" className="pt-6">
        {copy.eyebrow}
      </Text>
      <Text as="h3" variant="heading40" tone={colors.title} className="pt-3">
        {copy.title}
      </Text>
      <Text variant="text18" tone={colors.description} className="pt-4.5">
        {copy.description}
      </Text>
    </Reveal>
  );
}
