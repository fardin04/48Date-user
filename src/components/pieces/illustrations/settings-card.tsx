import { cn } from "@/lib/cn";
import { Reveal } from "@/components/pieces/layout/reveal";
import { Text } from "@/components/pieces/content/text";

type SettingsCardProps = {
  card: { eyebrow: string; title: string; items: string[] };
  /** Placement only (rule 17). */
  className?: string;
  revealDelay?: number;
};

/** Illustrative frosted "Your controls" menu floating on a photo. */
export function SettingsCard({ card, className, revealDelay }: SettingsCardProps) {
  return (
    <Reveal
      delay={revealDelay}
      className={cn(
        "flex w-60 flex-col gap-2.5 rounded-16 border border-white/70 bg-white/94 p-5.5 shadow-float backdrop-blur-[14px]",
        className,
      )}
    >
      <Text variant="text13Bold" tone="rose">
        {card.eyebrow}
      </Text>
      <Text variant="text18Bold" className="pb-1">
        {card.title}
      </Text>
      <ul className="flex flex-col gap-2.5">
        {card.items.map((item) => (
          <Text as="li" key={item} variant="text14" tone="muted" className="border-t border-line pt-2.5">
            {item}
          </Text>
        ))}
      </ul>
    </Reveal>
  );
}
