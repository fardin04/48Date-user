import type { FormEvent, ReactNode } from "react";
import type { SetupIntro } from "@/data/onboarding/types";
import { cn } from "@/lib/cn";
import { FormHeader } from "@/components/pieces/forms/form-header";
import { Reveal } from "@/components/pieces/layout/reveal";

/** The 560px setup column shared by the content and the action row. */
const COLUMN = "w-full max-w-140";

const placements = {
  /** Content anchored 72px under the header (64px below 1280px). */
  top: "pt-12 md:pt-16 xl:pt-18 short:pt-4",
  /** PHOTO-PREVIEW: 48px inset, the photo takes the remaining height. */
  fill: "justify-center py-12 short:py-4",
} as const;

type SetupStepProps = {
  intro: SetupIntro;
  /** Centres the heading; `headerAlign` also centres the shell's context header (LOCATION). */
  align?: "start" | "center";
  headerAlign?: "split" | "center";
  placement?: keyof typeof placements;
  /** Fields, choices or visuals under the heading (16px apart). */
  children?: ReactNode;
  /** Full-width text action under the content ("Enter location manually"). */
  secondary?: ReactNode;
  back: ReactNode;
  primary: ReactNode;
  onSubmit?: (event: FormEvent<HTMLFormElement>) => void;
  busy?: boolean;
  /** Placement only (rule 17). */
  className?: string;
  revealDelay?: number;
};

/**
 * One onboarding screen inside the main panel: heading, content and the bottom action row
 * (Back left, primary right; pinned to the viewport bottom when the step overflows). It is a form
 * so Enter continues.
 */
export function SetupStep({ intro, align = "start", headerAlign = "split", placement = "top", children, secondary, back, primary, onSubmit, busy, className, revealDelay }: SetupStepProps) {
  const fill = placement === "fill";
  return (
    <form noValidate onSubmit={onSubmit} aria-busy={busy || undefined} data-header={headerAlign} className={cn("flex flex-1 flex-col", className)}>
      <div className={cn("flex flex-1 flex-col items-center", placements[placement])}>
        <div className={cn(COLUMN, "flex flex-col gap-6", fill && "flex-1")}>
          <FormHeader variant="setup" title={intro.title} description={intro.description} align={align} revealDelay={revealDelay} />
          {children && <div className={cn("flex flex-col gap-4", fill && "flex-1")}>{children}</div>}
          {secondary}
        </div>
      </div>
      {/* Sticky to the viewport bottom while the step is taller than the screen (zoom, long lists), so
          Continue stays in view; the negative margin lays its padding over the panel's own. */}
      <Reveal
        delay={revealDelay === undefined ? undefined : revealDelay + 120}
        className="sticky bottom-0 z-10 -mb-6 flex shrink-0 justify-center bg-white pt-6 pb-6 md:-mb-8 md:pb-8 short:-mb-3 short:py-3 short:md:-mb-3 short:md:pb-3"
      >
        <div className={cn(COLUMN, "flex items-center justify-between gap-3 sm:gap-4")}>
          {back}
          {primary}
        </div>
      </Reveal>
    </form>
  );
}
