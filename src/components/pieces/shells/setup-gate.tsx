"use client";

import { useRouter } from "next/navigation";
import { useEffect, useSyncExternalStore, type ReactNode } from "react";
import { useLoaded } from "@/hooks/use-loaded";
import { authService } from "@/lib/auth/auth-service";
import { onboardingService } from "@/lib/onboarding/onboarding-service";
import { hrefFor } from "@/lib/routes";
import { replaceRoute } from "@/lib/navigation/replace-route";
import { screenKeys } from "@/lib/screen-keys";
import { decideSetupGate } from "@/lib/portal/guards";

const noChange = () => () => {};

/**
 * Portal guard behind `SessionGate`: the portal is for members who finished the guided setup.
 * Members the API last reported as finished render at once; everyone else waits for the saved
 * progress and, while setup is unfinished, is sent to it (which reopens the right step). No saved
 * progress (the mock) or a failed read lets the portal through, so a network error never locks a
 * member out.
 */
export function SetupGate({ children }: { children: ReactNode }) {
  const router = useRouter();
  const known = useSyncExternalStore(noChange, authService.setupState, () => null);
  const progress = useLoaded(screenKeys.onboardingProgress, onboardingService.getProgress, { enabled: known !== "portal" });
  const decision = decideSetupGate(known, progress.value, progress.error);

  useEffect(() => {
    if (decision.shouldRedirect && decision.target) {
      replaceRoute(router, hrefFor(decision.target));
    }
  }, [decision.shouldRedirect, decision.target, router]);

  if (decision.shouldRedirect || decision.isWaiting) return null;
  return children;
}
