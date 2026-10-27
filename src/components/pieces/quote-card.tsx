import { cn } from "@/lib/cn";
import { Reveal } from "./reveal";
import { Text } from "./text";
import { TypingDots } from "./typing-dots";

type QuoteCardProps = {
  quote: { lines: string[]; caption: string };
  /** Placement and size only (rule 17). */
  className?: string;
  revealDelay?: number;
};

/** Frosted message bubble with a typing indicator (hero collage). */
export function QuoteCard({ quote, className, revealDelay }: QuoteCardProps) {
  return (
    <Reveal
      as="figure"
      delay={revealDelay}
      className={cn(
        "flex flex-col gap-3 overflow-hidden rounded-20 border border-white/24 bg-petal/94 p-7.5 shadow-photo backdrop-blur-[16px]",
        className,
      )}
    >
      <TypingDots variant="typing" />
      <blockquote className="flex flex-col gap-6 pt-4">
        {quote.lines.map((line) => (
          <Text key={line} variant="title24">
            {line}
          </Text>
        ))}
      </blockquote>
      <Text as="figcaption" variant="text14" tone="muted" className="pt-0.75">
        {quote.caption}
      </Text>
    </Reveal>
  );
}
