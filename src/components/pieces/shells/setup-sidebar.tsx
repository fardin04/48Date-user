import { cn } from "@/lib/cn";
import { to } from "@/lib/routes";
import { getOnboardingShared } from "@/stores/onboarding-store";
import { ActionLink } from "@/components/pieces/actions/action-link";
import { Icon } from "@/components/pieces/content/icon";
import { Logo } from "@/components/pieces/brand/logo";
import { Reveal } from "@/components/pieces/layout/reveal";
import { Text } from "@/components/pieces/content/text";

type StageState = "done" | "current" | "upcoming";

type SetupSidebarProps = {
  /** Flow number of the open screen (1–15). */
  step: number;
  /** Placement only (rule 17). */
  className?: string;
  revealDelay?: number;
};

/**
 * "Guided setup / Stage sidebar": logo, five grouped stages (done and current in rose),
 * the privacy promise and "Back to website".
 */
export function SetupSidebar({ step, className, revealDelay }: SetupSidebarProps) {
  const { sidebar, back } = getOnboardingShared();
  const stages = sidebar.stages.map((stage, index) => {
    const firstStep = index === 0 ? 1 : sidebar.stages[index - 1].lastStep + 1;
    const state: StageState = step > stage.lastStep ? "done" : step >= firstStep ? "current" : "upcoming";
    return { ...stage, state };
  });

  return (
    <Reveal as="aside" delay={revealDelay} className={cn("flex flex-col gap-8 py-6 pr-8 pl-6", className)}>
      <Logo size="md" to={to("L02")} />
      <Text variant="text12Medium" tone="sub">
        {sidebar.label}
      </Text>
      <ol aria-label={sidebar.navLabel} className="flex flex-col gap-6">
        {stages.map((stage) => (
          <li key={stage.key} aria-current={stage.state === "current" ? "step" : undefined} className="flex items-start gap-3">
            <span
              className={cn(
                "flex size-9 shrink-0 items-center justify-center rounded-full",
                stage.state === "upcoming" ? "bg-stage-idle" : "bg-rose-light",
              )}
            >
              <Icon
                name={stage.state === "done" ? sidebar.doneIcon : stage.icon}
                size={20}
                tone={stage.state === "upcoming" ? "iconMuted" : "rose"}
              />
            </span>
            <span className="flex min-w-0 flex-1 flex-col gap-1">
              <Text as="span" variant="text16Semibold" tone={stage.state === "current" ? "strong" : "sub"}>
                {stage.title}
                <span className="sr-only">{`, ${sidebar.stateLabels[stage.state]}`}</span>
              </Text>
              <Text as="span" variant="text12Medium" tone="sub">
                {stage.description}
              </Text>
            </span>
          </li>
        ))}
      </ol>
      <div className="flex-1" />
      <div className="flex flex-col gap-2">
        <Text variant="text16Semibold" tone="strong">
          {sidebar.promise.title}
        </Text>
        <Text variant="text14Relaxed" tone="sub">
          {sidebar.promise.description}
        </Text>
      </div>
      <ActionLink action={back} variant="setupBack" />
    </Reveal>
  );
}
