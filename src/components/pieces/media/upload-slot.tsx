import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { Icon } from "@/components/pieces/content/icon";
import { Reveal } from "@/components/pieces/layout/reveal";
import { Text } from "@/components/pieces/content/text";

type UploadSlotProps = {
  title: string;
  description: string;
  upload: string;
  onUpload: () => void;
  disabled?: boolean;
  /** Placement only (rule 17). */
  className?: string;
  revealDelay?: number;
};

/** PHOTO-MANAGE empty slot, Align UI "Image Upload [1.1]": grey 64px avatar, title, hint and a small Upload button. */
export function UploadSlot({ title, description, upload, onUpload, disabled, className, revealDelay }: UploadSlotProps) {
  return (
    <Reveal delay={revealDelay} className={cn("flex gap-5", className)}>
      <span aria-hidden="true" className="flex size-16 shrink-0 items-center justify-center rounded-full bg-soft-line text-white">
        <Icon name="user-circle" size={40} />
      </span>
      <div className="flex min-w-0 flex-col items-start gap-3">
        <div className="flex flex-col gap-1">
          <Text as="span" variant="text16Medium" tone="strong">
            {title}
          </Text>
          <Text as="span" variant="text14" tone="sub">
            {description}
          </Text>
        </div>
        <Button type="button" variant="neutral" size="compact" onClick={onUpload} disabled={disabled}>
          {upload}
        </Button>
      </div>
    </Reveal>
  );
}
