"use client";

import { catchError, type ErrorInfo } from "next/error";
import { useRouter } from "next/navigation";
import { useState, useSyncExternalStore, type ReactNode } from "react";
import { getAccountPage } from "@/stores/portal-store";
import { ProfileContext } from "@/components/sections/portal/profile/profile-context";
import { StatusScreen } from "@/components/sections/portal/shared/status-screen";

function subscribe(onChange: () => void) {
  window.addEventListener("online", onChange);
  window.addEventListener("offline", onChange);
  return () => {
    window.removeEventListener("online", onChange);
    window.removeEventListener("offline", onChange);
  };
}

/** W09 / GLOBAL-ERROR: a portal view failed to render; retrying re-renders it, the account is untouched. */
function PortalError(_props: object, { retry }: ErrorInfo) {
  const page = getAccountPage().error;
  return (
    <StatusScreen
      title={page.title}
      description={page.description}
      summary={page.summary}
      primary={{ label: page.retry, onClick: retry }}
      secondary={page.secondary}
      aside={<ProfileContext />}
      actionWidth="actionSlot"
    />
  );
}

const PortalErrorBoundary = catchError(PortalError);

/** W09 / OFFLINE: shown over the view, which stays mounted underneath so unsent work is kept. */
function OfflineScreen() {
  const page = getAccountPage().offline;
  const router = useRouter();
  return (
    <StatusScreen
      title={page.title}
      description={page.description}
      summary={page.summary}
      primary={{ label: page.retry, onClick: () => router.refresh() }}
      aside={<ProfileContext />}
      actionWidth="actionSlot"
    />
  );
}

/**
 * Wraps every portal view: OFFLINE when the view is opened without a connection (until it comes
 * back), GLOBAL-ERROR when a view throws. A connection lost mid-task is left to the view's own
 * failure states (CHAT-FAILED, STORY-ERROR…), so typed work is never hidden.
 */
export function PortalGuard({ children }: { children: ReactNode }) {
  // null while hydrating: the connection is only known in the browser.
  const online = useSyncExternalStore<boolean | null>(subscribe, () => navigator.onLine, () => null);
  const [seenOnline, setSeenOnline] = useState(false);
  if (online && !seenOnline) setSeenOnline(true);
  const offline = online === false && !seenOnline;
  return (
    <PortalErrorBoundary>
      {offline && <OfflineScreen />}
      <div hidden={offline} className="contents">
        {children}
      </div>
    </PortalErrorBoundary>
  );
}
