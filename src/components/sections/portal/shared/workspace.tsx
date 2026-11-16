import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { PortalCard } from "@/components/pieces/layout/portal-card";

type WorkspaceProps = {
  /** "Flow support" column (352px at ≥1280, below the workspace on smaller screens). */
  aside?: ReactNode;
  /**
   * W11 hides the flow support on tablets (768–1279, also 110–175 % zoom at 1440). A page whose
   * aside holds an action found nowhere else passes "below" to keep it under the panel (rule 49).
   */
  tabletAside?: "hidden" | "below";
  children: ReactNode;
};

/**
 * "Primary workspace": white 20px-radius panel, 20px between blocks, beside the optional flow context.
 * The panel grows to the bottom of the portal's main column, so short pages leave no grey band below (rule 47).
 */
export function Workspace({ aside, tabletAside = "hidden", children }: WorkspaceProps) {
  const panel = (
    <PortalCard surface="plain" radius={20} padding="lg" revealDelay={0} className="flex w-full min-w-0 flex-1 flex-col items-start gap-5">
      {children}
    </PortalCard>
  );
  if (!aside) return panel;
  return (
    // Stacked, the panel's row takes the spare height and the flow support keeps its own.
    <div className="grid flex-1 grid-rows-[1fr_auto] gap-6 xl:grid-cols-[minmax(0,1fr)_352px] xl:grid-rows-1">
      {panel}
      {/* W11: tablets (768–1279) hide the flow support unless the page keeps it below; phones keep it below the workspace. */}
      <div className={cn("min-w-0 self-start", tabletAside === "hidden" && "md:max-xl:hidden")}>{aside}</div>
    </div>
  );
}
