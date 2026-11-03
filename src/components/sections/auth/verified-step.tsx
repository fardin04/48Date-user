"use client";

import { useSyncExternalStore } from "react";
import type { AuthFlow } from "@/data/auth/flows";
import type { ImageAsset } from "@/data/types";
import { authService } from "@/lib/auth/auth-service";
import { MessageStep } from "./message-step";

const noChange = () => () => {};

/**
 * PHONE-VERIFIED / SIGNIN-VERIFIED: members with setup still to finish (new accounts, or ones that
 * stopped half-way) continue the guided setup; members who finished open the portal. The API's
 * answer from the verified code decides; without one (the mock) each flow keeps its Figma action.
 */
export function VerifiedStep({ copy, image }: { copy: AuthFlow["verified"]; image: ImageAsset }) {
  const next = useSyncExternalStore(noChange, authService.setupState, () => null);
  return <MessageStep intro={copy.intro} visual={{ kind: "success", image }} primary={next ? copy.next[next] : copy.cta} />;
}
