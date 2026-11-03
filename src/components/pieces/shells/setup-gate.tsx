"use client";

import { useRouter } from "next/navigation";
import { useEffect, useSyncExternalStore, type ReactNode } from "react";
import { useLoaded } from "@/hooks/use-loaded";
import { authService } from "@/lib/auth/auth-service";
import { onboardingService } from "@/lib/onboarding/onboarding-service";
import { hrefFor } from "@/lib/routes";
import { screenKeys } from "@/lib/screen-keys";

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
  const unfinished = known !== "portal" && progress.value?.completed === false;
  const waiting = known !== "portal" && progress.value === undefined && progress.error === undefined;

  useEffect(() => {
    if (unfinished) router.replace(hrefFor("LOCATION"));
  }, [router, unfinished]);

  if (unfinished || waiting) return null;
  return children;
}
