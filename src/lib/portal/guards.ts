import type { ScreenCode } from "@/lib/routes";
import type { SetupState } from "@/lib/auth/setup-status";

export type SessionGateDecision = {
  allowed: boolean | null;
  shouldRedirect: boolean;
  target?: ScreenCode;
};

/**
 * Pure decision logic for SessionGate:
 * - If session is loading (null): wait, do not render or redirect.
 * - If allow === "member": allow signed-in members, redirect signed-out visitors.
 * - If allow === "guest": allow signed-out visitors, redirect signed-in members.
 */
export function decideSessionGate(
  allow: "member" | "guest",
  hasSession: boolean | null,
  redirect: ScreenCode,
): SessionGateDecision {
  if (hasSession === null) {
    return { allowed: null, shouldRedirect: false };
  }
  const allowed = allow === "member" ? hasSession : !hasSession;
  return {
    allowed,
    shouldRedirect: !allowed,
    target: !allowed ? redirect : undefined,
  };
}

export type SetupGateDecision = {
  shouldPass: boolean;
  isWaiting: boolean;
  shouldRedirect: boolean;
  target?: ScreenCode;
};

/**
 * Pure decision logic for SetupGate:
 * - If already known to have finished setup (known === "portal"): pass immediately without extra API call.
 * - While waiting for progress load: wait (render nothing, do not redirect).
 * - If progress fetch fails with error: fail open so network failure never locks member out of portal.
 * - If progress loaded and completed === false: redirect to LOCATION setup step.
 * - If completed === true: pass.
 */
export function decideSetupGate(
  knownSetupState: SetupState | null,
  progressValue?: { completed: boolean } | null,
  progressError?: unknown,
): SetupGateDecision {
  if (knownSetupState === "portal") {
    return { shouldPass: true, isWaiting: false, shouldRedirect: false };
  }
  if (progressValue === undefined && progressError === undefined) {
    return { shouldPass: false, isWaiting: true, shouldRedirect: false };
  }
  if (progressError !== undefined) {
    return { shouldPass: true, isWaiting: false, shouldRedirect: false };
  }
  if (progressValue?.completed === false) {
    return { shouldPass: false, isWaiting: false, shouldRedirect: true, target: "LOCATION" };
  }
  return { shouldPass: true, isWaiting: false, shouldRedirect: false };
}
