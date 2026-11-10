import { cn } from "@/lib/cn";
import { Reveal } from "@/components/pieces/layout/reveal";

const DOT_COUNT = 3;
/** Each dot starts its float this long after the one before (the loop is 1.2s). */
const STAGGER_MS = 160;

const variants = {
  /** Typing indicator in the hero quote card: 6px dots, 5px apart. */
  typing: { row: "gap-1.25", dot: "size-1.5" },
  /** "{name} is typing" in a conversation: 8px dots floating in turn inside an incoming-message bubble (56px, as a one-line message). */
  bubble: { row: "h-14 w-fit gap-1.5 rounded-16 bg-white px-5", dot: "size-2 motion-safe:animate-typing-float" },
  /** Auth activity indicator: 8px dots, 8px apart, in a 40px row. */
  activity: { row: "h-10 w-full justify-center gap-2", dot: "size-2 motion-safe:animate-pulse" },
} as const;

type TypingDotsProps = {
  variant: keyof typeof variants;
  /** Announced to assistive tech; omit when the dots are decorative. */
  label?: string;
  /** Placement only (rule 17). */
  className?: string;
  revealDelay?: number;
};

/** Three rose dots: typing indicator or "working on it" activity. Motion stops under reduced motion (rule 21). */
export function TypingDots({ variant, label, className, revealDelay }: TypingDotsProps) {
  const style = variants[variant];
  return (
    <Reveal
      delay={revealDelay}
      role={label ? "status" : undefined}
      aria-label={label}
      className={cn("flex items-center", style.row, className)}
    >
      {Array.from({ length: DOT_COUNT }, (_, index) => (
        <span
          key={index}
          aria-hidden="true"
          className={cn("rounded-full bg-rose", style.dot)}
          style={{ animationDelay: `${index * STAGGER_MS}ms` }}
        />
      ))}
    </Reveal>
  );
}
