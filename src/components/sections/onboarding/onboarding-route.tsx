import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { SetupShell } from "@/components/pieces/shells/setup-shell";
import { onboardingStepParams, resolveOnboardingStep } from "@/lib/onboarding/steps";
import { OnboardingPage, onboardingStepTitle } from "./onboarding-page";

type StepParams = Promise<{ step: string }>;

const stepFor = async (params: StepParams) => resolveOnboardingStep((await params).step);

async function OnboardingStepContent({ params }: { params: StepParams }) {
  const step = await stepFor(params);
  if (!step) notFound();
  return <OnboardingPage step={step} />;
}

/**
 * Route exports for `/onboarding/[step]`: every step URL is prerendered, and the empty
 * shell is the instant fallback while params resolve (rule 31).
 */
export const onboardingRoute = {
  generateStaticParams: onboardingStepParams,
  generateMetadata: async ({ params }: { params: StepParams }): Promise<Metadata> => {
    const step = await stepFor(params);
    return step ? { title: onboardingStepTitle(step) } : {};
  },
  Page: function OnboardingRoutePage({ params }: { params: StepParams }) {
    return (
      <Suspense fallback={<SetupShell>{null}</SetupShell>}>
        <OnboardingStepContent params={params} />
      </Suspense>
    );
  },
};
