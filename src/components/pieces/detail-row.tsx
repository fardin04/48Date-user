import { cn } from "@/lib/cn";
import { Reveal } from "./reveal";
import { Text } from "./text";

const variants = {
  /** Value right-aligned at the end of the row (compatibility signals, date facts). */
  split: { row: "grid-cols-[minmax(0,1fr)_auto]", value: "text-right" },
  /** Value in a 192px column (profile rows: Compatibility, Trust Score, Interests). */
  column: { row: "grid-cols-[minmax(0,1fr)_minmax(0,192px)]", value: "" },
} as const;

type DetailRowProps = {
  label: string;
  value: string;
  variant?: keyof typeof variants;
  /** Hairline under the row (date facts). */
  divided?: boolean;
  /** Placement only (rule 17). */
  className?: string;
  revealDelay?: number;
};

/** "Label / value" row with 12px padding, rendered as a description-list pair; the parent is the `dl`. */
export function DetailRow({ label, value, variant = "split", divided, className, revealDelay }: DetailRowProps) {
  const style = variants[variant];
  return (
    <Reveal delay={revealDelay} className={cn("grid items-center gap-3 bg-white p-3", style.row, divided ? "border-b border-divider" : "rounded-12", className)}>
      <Text as="dt" variant="text14Semibold" tone="strong">
        {label}
      </Text>
      <Text as="dd" variant="text14Relaxed" tone="sub" className={style.value}>
        {value}
      </Text>
    </Reveal>
  );
}
