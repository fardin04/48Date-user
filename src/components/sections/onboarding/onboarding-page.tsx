import { SetupShell } from "@/components/pieces/shells/setup-shell";
import type { OnboardingStep } from "@/data/onboarding/types";
import {
  getBirthdayStep,
  getChoiceSteps,
  getLocationStep,
  getNicknameStep,
  getNotifyStep,
  getPhotosStep,
  getPrivateNameStep,
  getProfileSteps,
  getReadyStep,
  getStepFlow,
  getVerifyStep,
} from "@/stores/onboarding-store";
import { BirthdayStep } from "./birthday-step";
import { ChoiceStep } from "./choice-step";
import { FieldsStep } from "./fields-step";
import { LocationStep } from "./location-step";
import { NicknameStep } from "./nickname-step";
import { NotifyStep } from "./notify-step";
import { OnboardingResume } from "./onboarding-resume";
import { PhotosStep } from "./photos-step";
import { ReadyStep } from "./ready-step";
import { VerifyStep } from "./verify-step";

/** Heading of a step's first state, for the route's metadata. */
export function onboardingStepTitle(step: OnboardingStep) {
  const profile = getProfileSteps();
  const choices = getChoiceSteps();
  const titles: Record<OnboardingStep, string> = {
    location: getLocationStep().ask.intro.title,
    nickname: getNicknameStep().intro.title,
    privateName: getPrivateNameStep().intro.title,
    birthday: getBirthdayStep().intro.title,
    identity: profile.identity.intro.title,
    lifestyle: profile.lifestyle.intro.title,
    details: profile.details.intro.title,
    interests: choices.interests.intro.title,
    goals: choices.goals.intro.title,
    personality: choices.personality.intro.title,
    communication: choices.communication.intro.title,
    photos: getPhotosStep().intro.title,
    verify: getVerifyStep().intro.intro.title,
    notify: getNotifyStep().intro.title,
    ready: getReadyStep().intro.title,
  };
  return titles[step];
}

/** W02 / Profile Onboarding & Permissions — one guided setup step. */
export function OnboardingPage({ step }: { step: OnboardingStep }) {
  const body = (() => {
    switch (step) {
      case "location":
        return <LocationStep />;
      case "nickname":
        return <NicknameStep />;
      case "privateName":
        return <FieldsStep step={step} {...getPrivateNameStep()} />;
      case "birthday":
        return <BirthdayStep />;
      case "identity":
      case "lifestyle":
      case "details":
        return <FieldsStep step={step} {...getProfileSteps()[step]} />;
      case "interests":
      case "goals":
      case "personality":
      case "communication":
        return <ChoiceStep step={step} {...getChoiceSteps()[step]} />;
      case "photos":
        return <PhotosStep />;
      case "verify":
        return <VerifyStep />;
      case "notify":
        return <NotifyStep />;
      case "ready":
        return <ReadyStep />;
    }
  })();

  return (
    <SetupShell step={getStepFlow(step).number}>
      <OnboardingResume step={step} />
      {body}
    </SetupShell>
  );
}
