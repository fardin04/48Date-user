import Image from "next/image";
import { SoftPanel } from "@/components/pieces/layout/soft-panel";
import { Text } from "@/components/pieces/content/text";

type UploadStatusProps = {
  /** Object URL of the chosen photo. */
  thumbnail: string;
  title: string;
  status: string;
  /** 0–100. */
  percent: number;
  progressLabel: string;
  /** Placement only (rule 17). */
  className?: string;
  revealDelay?: number;
};

/** "Visual / PHOTO-UPLOAD": 64×80 thumbnail, file title, status line and a rose progress track. */
export function UploadStatus({ thumbnail, title, status, percent, progressLabel, className, revealDelay }: UploadStatusProps) {
  return (
    <SoftPanel className={className} revealDelay={revealDelay}>
      <div className="flex h-20 items-center gap-4">
        {/* Local object URL: nothing for the image optimizer to fetch. */}
        <Image src={thumbnail} alt="" width={64} height={80} unoptimized className="h-20 w-16 shrink-0 rounded-[8px] object-cover" />
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <Text variant="text16Semibold" tone="strong">
            {title}
          </Text>
          <Text variant="text14Relaxed" tone="sub" aria-live="polite">
            {status}
          </Text>
        </div>
      </div>
      <div
        role="progressbar"
        aria-label={progressLabel}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
        className="h-1.5 w-full overflow-hidden rounded-full bg-gray-200"
      >
        <div className="h-full rounded-full bg-rose transition-[width] duration-150" style={{ width: `${percent}%` }} />
      </div>
    </SoftPanel>
  );
}
