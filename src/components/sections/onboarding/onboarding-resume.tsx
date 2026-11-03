"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import type { OnboardingStep } from "@/data/onboarding/types";
import { onboardingService } from "@/lib/onboarding/onboarding-service";
import { profileDraft } from "@/lib/onboarding/profile-draft";
import { screenAnswered } from "@/lib/onboarding/step-payloads";
import { stepDestination, stepHref } from "@/lib/onboarding/steps";
import { hrefFor } from "@/lib/routes";
import { screenKeys } from "@/lib/screen-keys";
import { getOnboardingFlow } from "@/stores/onboarding-store";

/** Progress is read once per page load, not on every step. */
let checked = false;

/**
 * Restores answers saved earlier (another device, a previous visit) into the draft without
 * overwriting anything typed in this tab, and opens the right step: a member arriving at the
 * first step (or ahead of what's saved) continues at the first step with a required answer
 * still missing; a member who already finished goes to the portal, unless they're on the
 * optional steps that follow the required ones (verification, notifications, ready).
 */
export function OnboardingResume({ step }: { step: OnboardingStep }) {
  const router = useRouter();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (checked) return;
    checked = true;
    let active = true;
    void queryClient.fetchQuery({ queryKey: screenKeys.onboardingProgress, queryFn: onboardingService.getProgress }).then((progress) => {
      if (!active || !progress) return;
      const flow = getOnboardingFlow();
      if (progress.completed) {
        if (flow[step].number < flow.verify.number) {
          const portal = stepDestination(flow.ready.next);
          if ("screen" in portal) router.replace(hrefFor(portal.screen));
        }
        return;
      }
      const saved = progress.draft;
      profileDraft.update((current) => ({
        fields: { ...saved.fields, ...current.fields },
        interests: current.interests.length > 0 ? current.interests : (saved.interests ?? []),
        area: current.area ?? saved.area,
      }));
      const draft = profileDraft.read();
      // Answers waiting in this tab for the API's order (see `saveStep`) don't need asking again.
      // PERSONALITY and COMMUNICATION have no API step, so they never hold a member back.
      const resume = progress.pending?.find((screen) => !screenAnswered(screen, draft));
      if (!resume || resume === step) return;
      if (step === "location" || flow[step].number > flow[resume].number) router.replace(stepHref(resume));
    }).catch(() => undefined);
    return () => {
      active = false;
    };
  }, [queryClient, router, step]);

  return null;
}
