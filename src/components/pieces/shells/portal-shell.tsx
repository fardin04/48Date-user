import type { ReactNode } from "react";
import { PortalHeader } from "@/components/pieces/shells/portal-header";
import { SessionGate } from "@/components/pieces/shells/session-gate";

type PortalShellProps = {
  /** Nav label of the open area. */
  active?: string;
  children?: ReactNode;
};

/**
 * Member portal frame (W04, 1440 frames): web header over the grey workspace. The 1280px
 * column keeps 80px gutters at 1440 and narrows to 48 / 32 / 16px.
 */
export function PortalShell({ active, children }: PortalShellProps) {
  return (
    <div className="min-h-svh bg-gray-50">
      <PortalHeader active={active} />
      <main className="mx-auto flex w-full max-w-360 flex-col gap-6 p-4 sm:p-6 xl:px-20 xl:py-8">
        <SessionGate allow="member" redirect="SIGNIN">
          {children}
        </SessionGate>
      </main>
    </div>
  );
}
