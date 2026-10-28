import type { StatusSummaryCopy } from "@/data/portal/types";
import { cn } from "@/lib/cn";
import { Icon } from "@/components/pieces/content/icon";
import { PortalCard } from "@/components/pieces/layout/portal-card";
import { Text } from "@/components/pieces/content/text";

type StatusSummaryProps = {
  summary: StatusSummaryCopy;
  /** Placement only (rule 17). */
  className?: string;
  revealDelay?: number;
};

/** "Status summary": 48px rose icon beside an 18/28 title and a 14/22 explanation. */
export function StatusSummary({ summary, className, revealDelay }: StatusSummaryProps) {
  return (
    <PortalCard surface="summary" padding="lg" revealDelay={revealDelay} className={cn("flex w-full items-center gap-5", className)}>
      <Icon name={summary.icon} size={48} tone="rose" />
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <Text as="h2" variant="text18Semibold" tone="strong">
          {summary.title}
        </Text>
        <Text variant="text14Relaxed" tone="sub">
          {summary.description}
        </Text>
      </div>
    </PortalCard>
  );
}
