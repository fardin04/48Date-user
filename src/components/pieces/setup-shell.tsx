import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { to } from "@/lib/routes";
import { getOnboardingShared } from "@/stores/onboarding-store";
import { Logo } from "./logo";
import { SessionGate } from "./session-gate";
import { SetupSidebar } from "./setup-sidebar";
import { Text } from "./text";

type SetupShellProps = {
  /** Flow number of the open screen (1–15); omitted while the route resolves. */
  step?: number;
  children: ReactNode;
};

/** A SetupStep with `headerAlign="center"` (LOCATION) centres both header labels. */
const CENTERED = "group-has-[[data-header=center]]/setup:text-center";

/**
 * Guided setup frame. ≥1280px: 304px stage sidebar + 24px-radius main panel (1440×960 frames).
 * Below 1280px the sidebar hides and the 29×32 logo joins the context header; phones drop the
 * panel chrome and keep 16px gutters.
 */
export function SetupShell({ step, children }: SetupShellProps) {
  const { header, totalSteps } = getOnboardingShared();
  const stepLabel = step ? header.step.replace("{step}", String(step)).replace("{total}", String(totalSteps)) : "";
  return (
    <div className="min-h-svh bg-white md:bg-gray-50 md:p-6 xl:grid xl:grid-cols-[304px_minmax(0,1fr)]">
      <SetupSidebar step={step ?? 0} revealDelay={0} className="max-xl:hidden xl:sticky xl:top-6 xl:min-h-[calc(100svh-48px)] xl:self-start" />
      <main className="group/setup flex min-h-svh flex-col bg-white px-4 py-6 md:min-h-[calc(100svh-48px)] md:rounded-24 md:border md:border-gray-200 md:px-10 md:py-8 lg:px-12">
        <header className="flex min-h-10 items-start gap-4 xl:min-h-8">
          <Logo size="xs" to={to("L02")} className="xl:hidden" />
          <Text variant="text12Semibold" tone="sub" className={cn("flex-1", CENTERED)}>
            {header.label}
          </Text>
          <Text variant="text12Medium" tone="sub" className={cn("flex-1 text-right", CENTERED)}>
            {stepLabel}
          </Text>
        </header>
        <SessionGate allow="member" redirect="SIGNIN">
          {children}
        </SessionGate>
      </main>
    </div>
  );
}
