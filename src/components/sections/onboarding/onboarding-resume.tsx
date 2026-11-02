"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { onboardingService } from "@/lib/onboarding/onboarding-service";
import { profileDraft } from "@/lib/onboarding/profile-draft";
import { hrefFor } from "@/lib/routes";
import { screenKeys } from "@/lib/screen-keys";

/** Progress is read once per page load, not on every step. */
let checked = false;

/**
 * Restores answers saved earlier (another device, a previous visit) into the draft without
 * overwriting anything typed in this tab, and sends a member who already finished to the portal.
 */
export function OnboardingResume() {
  const router = useRouter();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (checked) return;
    checked = true;
    let active = true;
    void queryClient.fetchQuery({ queryKey: screenKeys.onboardingProgress, queryFn: onboardingService.getProgress }).then((progress) => {
      if (!active || !progress) return;
      if (progress.completed) {
        router.replace(hrefFor("DISCOVER"));
        return;
      }
      const saved = progress.draft;
      profileDraft.update((draft) => ({
        fields: { ...saved.fields, ...draft.fields },
        interests: draft.interests.length > 0 ? draft.interests : (saved.interests ?? []),
        area: draft.area ?? saved.area,
      }));
    });
    return () => {
      active = false;
    };
  }, [queryClient, router]);

  return null;
}
