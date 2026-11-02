"use client";

import { useRouter } from "next/navigation";
import { ReadyCard } from "@/components/pieces/illustrations/ready-card";
import { SetupStep } from "@/components/pieces/shells/setup-step";
import { usePhotos } from "@/lib/onboarding/photo-store";
import { useProfileDraft } from "@/lib/onboarding/profile-draft";
import { onboardingService } from "@/lib/onboarding/onboarding-service";
import { stepDestination } from "@/lib/onboarding/steps";
import { hrefFor } from "@/lib/routes";
import { getChoiceSteps, getReadyStep, getStepFlow } from "@/stores/onboarding-store";
import { SetupBack, SetupPrimary } from "./step-actions";

/** READY: the member's own preview with nickname, main photo and first interests. */
export function ReadyStep() {
  const copy = getReadyStep();
  const flow = getStepFlow("ready");
  const draft = useProfileDraft();
  const [mainPhoto] = usePhotos();
  const router = useRouter();
  const next = stepDestination(flow.next);
  // Finishing setup starts matching in the background, then opens the portal.
  const start = () => {
    onboardingService.startMatching();
    if ("screen" in next) router.push(hrefFor(next.screen, next.section ?? next.param));
  };
  const interests = getChoiceSteps()
    .interests.choices.filter((choice) => draft.interests.includes(choice.value))
    .slice(0, copy.shownInterests)
    .map((choice) => choice.title);

  return (
    <SetupStep
      intro={copy.intro}
      back={<SetupBack link={flow.back} />}
      primary={<SetupPrimary label={copy.primary} onClick={start} />}
      revealDelay={0}
    >
      <ReadyCard
        name={draft.fields.nickname || copy.fallbackName}
        line={copy.line}
        footer={copy.footer}
        interests={interests}
        interestsLabel={copy.interestsLabel}
        photo={mainPhoto ? { src: mainPhoto.url, alt: copy.photoAlt } : undefined}
      />
    </SetupStep>
  );
}
