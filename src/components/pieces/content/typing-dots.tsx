import { cn } from "@/lib/cn";
import { Reveal } from "@/components/pieces/layout/reveal";

const DOT_COUNT = 3;

const variants = {
  /** Typing indicator in the hero quote card: 6px dots, 5px apart. */
  typing: { row: "gap-1.25", dot: "size-1.5" },
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

/** Three rose dots: typing indicator or "working on it" activity. */
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
          style={{ animationDelay: `${index * 160}ms` }}
        />
      ))}
    </Reveal>
  );
}
