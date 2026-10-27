import { cn } from "@/lib/cn";
import { Reveal } from "@/components/pieces/layout/reveal";
import { Text } from "@/components/pieces/content/text";

type SummaryRowProps = {
  label: string;
  value: string;
  /** Placement only (rule 17). */
  className?: string;
  revealDelay?: number;
};

/** Read-only 64px row: label left, status right (VERIFY-STATUS). Rendered as a description-list pair. */
export function SummaryRow({ label, value, className, revealDelay }: SummaryRowProps) {
  return (
    <Reveal delay={revealDelay} className={cn("flex h-16 w-full items-center justify-between rounded-12 border border-gray-300 bg-white p-4", className)}>
      <Text as="dt" variant="text14Semibold" tone="strong" className="min-w-0 flex-1 truncate">
        {label}
      </Text>
      <Text as="dd" variant="text12" tone="sub" className="w-28 shrink-0 text-right">
        {value}
      </Text>
    </Reveal>
  );
}
