import { Fragment } from "react";
import { cn } from "@/lib/cn";
import { Reveal } from "@/components/pieces/layout/reveal";
import { Text } from "@/components/pieces/content/text";

type CountdownProps = {
  countdown: { label: string; units: string[]; caption: string };
  /** Placement only (rule 17). */
  className?: string;
  revealDelay?: number;
};

/** Static, illustrative match-window timer (not a live countdown). */
export function Countdown({ countdown, className, revealDelay }: CountdownProps) {
  return (
    <Reveal
      delay={revealDelay}
      role="img"
      aria-label={countdown.label}
      className={cn(
        "inline-flex flex-col items-center gap-1.25 rounded-20 border border-white/18 bg-wine/22 px-6 pt-6.5 pb-4.5 backdrop-blur-[8px]",
        className,
      )}
    >
      <span aria-hidden="true" className="grid grid-cols-[1fr_auto_1fr_auto_1fr] items-center">
        {countdown.units.map((unit, index) => (
          <Fragment key={index}>
            {index > 0 && (
              <Text as="span" variant="heading40" tone="white" className="w-3.5 text-center opacity-45">
                :
              </Text>
            )}
            <Text as="span" variant="heading40" tone="white" className="w-20 text-center tabular-nums sm:w-26">
              {unit}
            </Text>
          </Fragment>
        ))}
      </span>
      <Text as="span" variant="text12" tone="white" aria-hidden>
        {countdown.caption}
      </Text>
    </Reveal>
  );
}
