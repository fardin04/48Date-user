import { cn } from "@/lib/cn";
import { Reveal } from "./reveal";
import { SelectionMark } from "./selection-mark";
import { Text } from "./text";

const variants = {
  /** LOC-MANUAL result: name left, region right; selected rows turn notice-rose. */
  area: { box: "h-16 gap-4", on: "border-rose bg-notice-bg", off: "border-gray-300 bg-white" },
  /** Occupation dialog row: radio + label. */
  radio: { box: "h-14 gap-3", on: "border-input-line bg-rose-light", off: "border-input-line bg-white" },
  /** CHAT-ATTACH choice: radio + 14/20 semibold label. */
  choice: { box: "gap-3", on: "border-rose-mid bg-rose-light", off: "border-soft-line bg-white" },
} as const;

type OptionRowProps = {
  variant: keyof typeof variants;
  name: string;
  value: string;
  label: string;
  /** Right-hand detail (area region). */
  meta?: string;
  checked: boolean;
  onSelect: () => void;
  /** Placement only (rule 17). */
  className?: string;
  revealDelay?: number;
};

/** One option of a single-choice list, backed by a native radio input. */
export function OptionRow({ variant, name, value, label, meta, checked, onSelect, className, revealDelay }: OptionRowProps) {
  const style = variants[variant];
  return (
    <Reveal delay={revealDelay} className={cn("flex", className)}>
      <label
        className={cn(
          "flex w-full cursor-pointer items-center rounded-12 border p-4 transition-colors focus-ring-within",
          style.box,
          checked ? style.on : cn(style.off, "hover:bg-weak"),
        )}
      >
        <input type="radio" name={name} value={value} checked={checked} onChange={onSelect} className="sr-only" />
        {variant !== "area" && <SelectionMark type="radio" checked={checked} />}
        <Text as="span" variant={variant === "radio" ? "text14Medium" : "text14Semibold"} tone={variant === "radio" ? "gray900" : "strong"} className="min-w-0 flex-1 truncate">
          {label}
        </Text>
        {meta && (
          <Text as="span" variant="text12" tone="sub" className="w-32 shrink-0 text-right">
            {meta}
          </Text>
        )}
      </label>
    </Reveal>
  );
}
