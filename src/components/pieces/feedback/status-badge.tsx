import { cn } from "@/lib/cn";
import { textTones } from "@/lib/tones";
import { typeScale } from "@/lib/type-scale";
import { Reveal } from "@/components/pieces/layout/reveal";

const variants = {
  /** Align UI Status Badge [1.1], warning: "Pending review". */
  warning: { box: "bg-warning-bg", dot: "bg-warning", tone: textTones.warning },
  /** Time left / confirmed / verified. */
  success: { box: "bg-success-lighter", dot: "bg-success", tone: textTones.success },
  /** Waiting on someone ("Ready to send", "Awaiting response"): warning tint with a green label. */
  pending: { box: "bg-warning-bg", dot: "bg-warning", tone: textTones.success },
  /** Running out of time: warning tint with a rose label. */
  urgent: { box: "bg-warning-bg", dot: "bg-warning", tone: textTones.rose },
} as const;

type StatusBadgeProps = {
  variant: keyof typeof variants;
  label: string;
  /** Announce the badge when it appears; off for countdowns that change every minute. */
  live?: boolean;
  /** Placement only (rule 17). */
  className?: string;
  revealDelay?: number;
};

/** Tinted status line with a leading dot, announced politely when it appears. */
export function StatusBadge({ variant, label, live = true, className, revealDelay }: StatusBadgeProps) {
  const style = variants[variant];
  return (
    <Reveal
      delay={revealDelay}
      role={live ? "status" : undefined}
      className={cn("flex items-center gap-0.5 rounded-6 py-1 pr-2 pl-1", style.box, style.tone, typeScale.text12MediumTight, className)}
    >
      <span aria-hidden="true" className="flex size-4 items-center justify-center">
        <span className={cn("size-1.5 rounded-full", style.dot)} />
      </span>
      {label}
    </Reveal>
  );
}
