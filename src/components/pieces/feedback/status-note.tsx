import { cn } from "@/lib/cn";
import { textTones } from "@/lib/tones";
import { typeScale } from "@/lib/type-scale";
import { Reveal } from "@/components/pieces/layout/reveal";

const AUTH = cn("p-3", typeScale.text14MediumRelaxed);
const SETUP = cn("bg-rose-light px-4 py-3", typeScale.text14Relaxed);
const PORTAL = cn("p-4", typeScale.text14Semibold);

const variants = {
  /** Feedback / error — invalid number, wrong or expired code. */
  error: { box: cn("bg-error-bg", AUTH), tone: textTones.error, role: "alert" },
  /** Feedback / success — code resent. */
  success: { box: cn("bg-success-bg", AUTH), tone: textTones.success, role: "status" },
  /** Feedback / info — request limit. */
  notice: { box: cn("bg-notice-bg", AUTH), tone: textTones.notice, role: "status" },
  /** Onboarding inline feedback while waiting ("Checking availability…"). */
  pending: { box: SETUP, tone: textTones.sub, role: "status" },
  /** Onboarding reassurance ("Your other photos are saved."). */
  reassure: { box: SETUP, tone: textTones.rose, role: "status" },
  /** Portal highlight ("You both enjoy photography…"). */
  highlight: { box: cn("bg-rose-light", PORTAL), tone: textTones.rose, role: "status" },
  /** Messaging failure ("We couldn’t load suggestions…"). */
  alert: { box: cn("bg-alert-bg", PORTAL), tone: textTones.alert, role: "alert" },
  /** Portal deadline reminder ("01h 24m left to agree on a date"): a live countdown, so not announced. */
  deadline: { box: cn("bg-amber-bg", PORTAL), tone: textTones.amber, role: "note" },
} as const;

type StatusNoteProps = {
  variant: keyof typeof variants;
  message: string;
  id?: string;
  /** Placement only (rule 17). */
  className?: string;
  revealDelay?: number;
};

/** Tinted feedback message announced to assistive tech. */
export function StatusNote({ variant, message, id, className, revealDelay }: StatusNoteProps) {
  const style = variants[variant];
  return (
    <Reveal delay={revealDelay} id={id} role={style.role} className={cn("w-full rounded-12", style.box, style.tone, className)}>
      {message}
    </Reveal>
  );
}
