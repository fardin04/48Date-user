import { Icon } from "@/components/pieces/content/icon";
import { SoftPanel } from "@/components/pieces/layout/soft-panel";
import { Text } from "@/components/pieces/content/text";

type NotificationPreviewProps = {
  preview: { title: string; body: string; caption: string };
  /** NOTIFY-DENIED adds how to turn notifications back on. */
  help?: string;
  /** Placement only (rule 17). */
  className?: string;
  revealDelay?: number;
};

/** "Visual / NOTIFY": an illustrative match notification and what it covers. */
export function NotificationPreview({ preview, help, className, revealDelay }: NotificationPreviewProps) {
  return (
    <SoftPanel className={className} revealDelay={revealDelay}>
      <div className="flex items-center gap-4">
        <Icon name="notification-02" size={32} tone="rose" />
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <Text variant="text14SemiboldRelaxed" tone="strong">
            {preview.title}
          </Text>
          <Text variant="text14Relaxed" tone="sub">
            {preview.body}
          </Text>
        </div>
      </div>
      <Text variant="text12Medium" tone="sub">
        {preview.caption}
      </Text>
      {help && (
        <Text variant="text14Relaxed" tone="muted">
          {help}
        </Text>
      )}
    </SoftPanel>
  );
}
