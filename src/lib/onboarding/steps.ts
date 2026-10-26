import type { OnboardingStep, StepLink } from "@/data/onboarding/types";
import { getOnboardingFlow } from "@/stores/onboarding-store";
import { hrefFor, screens, to, type Destination } from "../routes";

const PREFIX = "/onboarding/";

const segmentOf = (step: OnboardingStep) => screens[getOnboardingFlow()[step].screen].slice(PREFIX.length);

/** `[step]` segment → the onboarding step whose screen code owns that path. */
export function resolveOnboardingStep(segment: string): OnboardingStep | null {
  const steps = Object.keys(getOnboardingFlow()) as OnboardingStep[];
  return steps.find((step) => segmentOf(step) === segment) ?? null;
}

/** Every onboarding URL, as params for generateStaticParams. */
export const onboardingStepParams = () =>
  (Object.keys(getOnboardingFlow()) as OnboardingStep[]).map((step) => ({ step: segmentOf(step) }));

/** A step's Back / Continue target as a Destination (rule 11). */
export const stepDestination = (link: StepLink): Destination =>
  typeof link === "string" ? to(getOnboardingFlow()[link].screen) : link;

/** URL of a step, for client navigation after a successful Continue. */
export const stepHref = (step: OnboardingStep) => hrefFor(getOnboardingFlow()[step].screen);

/** Whole years between a `YYYY-MM-DD` birth date and today, or null for an invalid date. */
export function ageFrom(dob: string, today = new Date()): number | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dob);
  if (!match) return null;
  const [year, month, day] = match.slice(1).map(Number);
  const born = new Date(year, month - 1, day);
  if (born.getMonth() !== month - 1 || born > today) return null;
  const hadBirthday = today.getMonth() > month - 1 || (today.getMonth() === month - 1 && today.getDate() >= day);
  return today.getFullYear() - year - (hadBirthday ? 0 : 1);
}
