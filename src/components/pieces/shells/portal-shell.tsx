import type { ReactNode } from "react";
import { PortalHeader } from "@/components/pieces/shells/portal-header";
import { PortalTabBar } from "@/components/pieces/shells/portal-tab-bar";
import { SessionGate } from "@/components/pieces/shells/session-gate";
import { SetupGate } from "@/components/pieces/shells/setup-gate";

type PortalShellProps = {
  /** Nav label of the open area. */
  active?: string;
  children?: ReactNode;
};

/**
 * Member portal frame (W04, 1440 frames): web header over the grey workspace. The 1280px
 * column keeps 80px gutters at 1440 and narrows to 48 / 32 / 16px. Phones navigate from the
 * bottom tab bar, so the workspace leaves room for it.
 */
export function PortalShell({ active, children }: PortalShellProps) {
  return (
    <div className="min-h-svh bg-gray-50">
      <PortalHeader active={active} />
      {/* Wider than the 1440 frame up to 1920, so zooming out (a wider CSS viewport) doesn't leave grey bands beside the full-width header. */}
      <main className="mx-auto flex w-full max-w-480 flex-col gap-6 p-4 max-sm:pb-24 sm:p-6 xl:px-20 xl:py-8">
        <SessionGate allow="member" redirect="SIGNIN">
          <SetupGate>{children}</SetupGate>
        </SessionGate>
      </main>
      <PortalTabBar active={active} />
    </div>
  );
}
