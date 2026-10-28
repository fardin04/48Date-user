import { cn } from "@/lib/cn";
import { Reveal } from "@/components/pieces/layout/reveal";
import { SelectionMark } from "@/components/pieces/forms/selection-mark";
import { Text } from "@/components/pieces/content/text";

type TickRowProps = {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  /** Shown but not changeable (a value the service can't update). */
  disabled?: boolean;
  /** Placement only (rule 17). */
  className?: string;
  revealDelay?: number;
};

/** PROFILE-EDIT "Interest / …": checkbox + 14/20 semibold label on a 44px row, rose-light while ticked. */
export function TickRow({ label, checked, onChange, disabled, className, revealDelay }: TickRowProps) {
  return (
    <Reveal delay={revealDelay} className={cn("flex w-full", className)}>
      <label
        className={cn(
          "flex min-h-11 w-full gap-3 rounded-12 p-3 transition-colors focus-ring-within",
          checked ? "bg-rose-light" : "bg-white",
          disabled ? "cursor-not-allowed opacity-70" : cn("cursor-pointer", !checked && "hover:bg-weak"),
        )}
      >
        <input type="checkbox" checked={checked} disabled={disabled} onChange={(event) => onChange(event.target.checked)} className="sr-only" />
        <SelectionMark type="checkbox" checked={checked} />
        <Text as="span" variant="text14Semibold" tone="strong" className="min-w-0 flex-1">
          {label}
        </Text>
      </label>
    </Reveal>
  );
}
