import { cn } from "@/lib/cn";
import { Reveal } from "@/components/pieces/layout/reveal";
import { SelectionMark } from "@/components/pieces/forms/selection-mark";
import { Text } from "@/components/pieces/content/text";

type CheckboxFieldProps = {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  /** Placement only (rule 17). */
  className?: string;
  revealDelay?: number;
};

/** Align UI Checkbox [1.1] with a 14/22 label ("Verified profiles only"), over a native checkbox. */
export function CheckboxField({ label, checked, onChange, className, revealDelay }: CheckboxFieldProps) {
  return (
    <Reveal delay={revealDelay} className={cn("flex min-w-0", className)}>
      <label className="flex min-h-6 w-full cursor-pointer items-center gap-3 rounded-9 focus-ring-within">
        <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} className="sr-only" />
        <SelectionMark type="checkbox" checked={checked} />
        <Text as="span" variant="text14Relaxed" tone="sub" className="min-w-0 flex-1">
          {label}
        </Text>
      </label>
    </Reveal>
  );
}
