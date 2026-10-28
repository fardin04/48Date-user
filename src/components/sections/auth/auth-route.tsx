import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { AuthShell } from "@/components/pieces/shells/auth-shell";
import type { AuthFlowName } from "@/data/auth/flows";
import { authStepParams, resolveAuthStep } from "@/lib/auth/steps";
import { getAuthFlow } from "@/stores/auth-store";
import { AuthPage, authStepTitle } from "./auth-page";

type StepParams = Promise<{ step?: string[] }>;

/**
 * Route exports for `/<flow>/[[...step]]`: every step URL is prerendered, and the
 * shell is the instant fallback while params resolve.
 */
export function authRoute(flowName: AuthFlowName) {
  const flow = getAuthFlow(flowName);
  const stepFor = async (params: StepParams) => resolveAuthStep(flowName, flow, (await params).step);

  async function AuthStepContent({ params }: { params: StepParams }) {
    const step = await stepFor(params);
    if (!step) notFound();
    return <AuthPage flowName={flowName} step={step} />;
  }

  return {
    generateStaticParams: () => authStepParams(flowName, flow),
    generateMetadata: async ({ params }: { params: StepParams }): Promise<Metadata> => {
      const step = await stepFor(params);
      return step ? { title: authStepTitle(flowName, step) } : {};
    },
    Page: function AuthRoutePage({ params }: { params: StepParams }) {
      return (
        <Suspense fallback={<AuthShell>{null}</AuthShell>}>
          <AuthStepContent params={params} />
        </Suspense>
      );
    },
  };
}
