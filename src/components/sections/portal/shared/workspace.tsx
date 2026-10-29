import type { ReactNode } from "react";
import { PortalCard } from "@/components/pieces/layout/portal-card";

type WorkspaceProps = {
  /** "Flow support" column (352px at ≥1280, below the workspace on smaller screens). */
  aside?: ReactNode;
  children: ReactNode;
};

/** "Primary workspace": white 20px-radius panel, 20px between blocks, beside the optional flow context. */
export function Workspace({ aside, children }: WorkspaceProps) {
  const panel = (
    <PortalCard surface="plain" radius={20} padding="lg" revealDelay={0} className="flex w-full flex-col items-start gap-5">
      {children}
    </PortalCard>
  );
  if (!aside) return panel;
  return (
    <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_352px]">
      {panel}
      {/* W11: tablets (768–1279) hide the flow support; phones keep it below the workspace. */}
      <div className="md:max-xl:hidden">{aside}</div>
    </div>
  );
}
