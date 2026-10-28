import { cn } from "@/lib/cn";
import { textTones } from "@/lib/tones";
import { typeScale } from "@/lib/type-scale";
import { Reveal } from "@/components/pieces/layout/reveal";

type SuggestionChipsProps = {
  /** Accessible name of the group ("Suggested nicknames"). */
  label: string;
  suggestions: string[];
  onPick: (suggestion: string) => void;
  disabled?: boolean;
  /** Placement only (rule 17). */
  className?: string;
  revealDelay?: number;
};

/** Row of 44px rose-light pills that fill the field with a suggestion. */
export function SuggestionChips({ label, suggestions, onPick, disabled, className, revealDelay }: SuggestionChipsProps) {
  return (
    <Reveal delay={revealDelay} role="group" aria-label={label} className={cn("grid w-full grid-cols-2 gap-2 sm:flex", className)}>
      {suggestions.map((suggestion) => (
        <button
          key={suggestion}
          type="button"
          disabled={disabled}
          onClick={() => onPick(suggestion)}
          className={cn(
            "focus-ring flex h-11 min-w-0 flex-1 cursor-pointer items-center justify-center rounded-full bg-rose-light px-3 transition-colors hover:bg-rose-soft disabled:cursor-not-allowed disabled:opacity-50",
            typeScale.text14SemiboldRelaxed,
            textTones.notice,
          )}
        >
          <span className="truncate">{suggestion}</span>
        </button>
      ))}
    </Reveal>
  );
}
