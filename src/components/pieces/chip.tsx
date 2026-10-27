import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { textTones } from "@/lib/tones";
import { typeScale } from "@/lib/type-scale";

const variants = {
  /** Interest tag on the profile card. */
  interest: cn("rounded-full bg-rose-light px-3 py-2.25", typeScale.text12, textTones.roseDeep),
  /** Solid rose label ("PREMIUM"). */
  badge: cn("rounded-full bg-rose px-3 py-2.25", typeScale.text11Bold, textTones.white),
  /** Date/time tag on the venue card. */
  schedule: cn("h-8.5 items-center rounded-9 bg-rose-light px-2.5", typeScale.text12, textTones.rose),
  /** Interest pill on the onboarding READY preview: fills its share of the row. */
  setup: cn("h-7 w-full overflow-hidden rounded-full bg-rose-light px-2", typeScale.text12Medium, textTones.rose),
  /** Portal interest pill on the swipe card. */
  neutral: cn("min-w-19 justify-center rounded-full bg-canvas-cool p-2", typeScale.text12Medium, textTones.sub),
  /** Portal rose pill ("Verified", "92% compatibility", profile interests). */
  rose: cn("min-w-19 justify-center rounded-full bg-rose-light p-2", typeScale.text12Medium, textTones.rose),
} as const;

export function Chip({ variant, children }: { variant: keyof typeof variants; children: ReactNode }) {
  return <span className={cn("inline-flex whitespace-nowrap", variants[variant])}>{children}</span>;
}
