import type { IconName } from "@/data/types";
import { Icon } from "@/components/pieces/content/icon";
import { SoftPanel } from "@/components/pieces/layout/soft-panel";
import { Text } from "@/components/pieces/content/text";

type TrustPanelProps = {
  trust: { icon: IconName; title: string; description: string; steps: string[] };
  /** Placement only (rule 17). */
  className?: string;
  revealDelay?: number;
};

/** "Visual / VERIFY-…": 40px rose icon, explanation and the three verification steps. */
export function TrustPanel({ trust, className, revealDelay }: TrustPanelProps) {
  return (
    <SoftPanel className={className} revealDelay={revealDelay}>
      <div className="flex items-center gap-4">
        <Icon name={trust.icon} size={40} tone="rose" />
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <Text variant="text16Semibold" tone="strong">
            {trust.title}
          </Text>
          <Text variant="text14Relaxed" tone="sub">
            {trust.description}
          </Text>
        </div>
      </div>
      <ol className="flex gap-4">
        {trust.steps.map((step) => (
          <Text as="li" key={step} variant="text12Medium" tone="sub" className="min-w-0 flex-1">
            {step}
          </Text>
        ))}
      </ol>
    </SoftPanel>
  );
}
