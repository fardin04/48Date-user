import { cn } from "@/lib/cn";
import { fill } from "@/lib/format";
import { DetailRow } from "./detail-row";
import { Reveal } from "./reveal";

type SignalBarProps = {
  label: string;
  /** 0–100. */
  value: number;
  /** `{percent}%` template for the value. */
  format: string;
  /** Placement only (rule 17). */
  className?: string;
  revealDelay?: number;
};

/** Compatibility signal: label / percentage row over a 12px rose bar filled to the value. */
export function SignalBar({ label, value, format, className, revealDelay }: SignalBarProps) {
  const percent = Math.min(100, Math.max(0, value));
  return (
    <Reveal delay={revealDelay} className={cn("flex w-full flex-col gap-4", className)}>
      <dl>
        <DetailRow label={label} value={fill(format, { percent })} />
      </dl>
      {/* The row above already states the value; the bar only draws it. */}
      <div aria-hidden="true" className="h-3 w-full bg-rose-light">
        <div className="h-full bg-rose" style={{ width: `${percent}%` }} />
      </div>
    </Reveal>
  );
}
