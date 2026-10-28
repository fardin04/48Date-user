import { cn } from "@/lib/cn";
import { Reveal } from "@/components/pieces/layout/reveal";
import { Text } from "@/components/pieces/content/text";

type SwitchRowProps = {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  /** Placement only (rule 17). */
  className?: string;
  revealDelay?: number;
};

/**
 * NOTIFY-PREFS "Choice / …": Align UI Switch [1.1] (32×20) beside a 14/20 semibold label, over a
 * native checkbox with the switch role. The row turns rose-light while focused, as drawn.
 */
export function SwitchRow({ label, checked, onChange, disabled, className, revealDelay }: SwitchRowProps) {
  return (
    <Reveal delay={revealDelay} className={cn("flex w-full", className)}>
      <label
        className={cn(
          "flex w-full cursor-pointer items-center gap-3 rounded-12 border border-soft-line bg-white p-4 transition-colors",
          "focus-within:border-rose-mid focus-within:bg-rose-light hover:bg-weak",
          disabled && "cursor-not-allowed opacity-60",
        )}
      >
        <input type="checkbox" role="switch" checked={checked} disabled={disabled} onChange={(event) => onChange(event.target.checked)} className="peer sr-only" />
        <span aria-hidden="true" className={cn("relative flex h-5 w-8 shrink-0 rounded-full p-0.5 transition-colors", checked ? "bg-rose" : "bg-soft-line")}>
          <span className={cn("size-4 rounded-full bg-white shadow-knob transition-transform", checked && "translate-x-3")} />
        </span>
        <Text as="span" variant="text14Semibold" tone="strong" className="min-w-0 flex-1">
          {label}
        </Text>
      </label>
    </Reveal>
  );
}
