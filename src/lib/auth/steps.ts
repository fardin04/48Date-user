import type { AuthFlow, AuthFlowName, AuthStep } from "@/data/auth/flows";
import { screens } from "../routes";

const pathFor = (flow: AuthFlowName, segments: string[] = []) => ["", flow, ...segments].join("/");

/** Optional catch-all `step` segments → the flow step whose screen code owns that path. */
export function resolveAuthStep(flowName: AuthFlowName, flow: AuthFlow, segments?: string[]): AuthStep | null {
  const path = pathFor(flowName, segments);
  const match = Object.entries(flow.routes).find(([, code]) => screens[code] === path);
  return match ? (match[0] as AuthStep) : null;
}

/** Every step URL of a flow, as optional catch-all params for generateStaticParams. */
export function authStepParams(flowName: AuthFlowName, flow: AuthFlow) {
  const prefix = pathFor(flowName);
  return Object.values(flow.routes).map((code) => ({
    step: screens[code].slice(prefix.length).split("/").filter(Boolean),
  }));
}
