"use client";

import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { useSession } from "@/hooks/use-session";
import { hrefFor, type ScreenCode } from "@/lib/routes";
import { replaceRoute } from "@/lib/navigation/replace-route";
import { decideSessionGate } from "@/lib/portal/guards";

type SessionGateProps = {
  /** member: signed-in pages (portal, onboarding); guest: sign-in / sign-up entry. */
  allow: "member" | "guest";
  /** Where to send everyone else. */
  redirect: ScreenCode;
  children: ReactNode;
};

/**
 * Client route guard. Member pages render nothing until a session is confirmed, then redirect
 * signed-out visitors; guest pages stay visible and forward signed-in members.
 */
export function SessionGate({ allow, redirect, children }: SessionGateProps) {
  const router = useRouter();
  const session = useSession();
  const decision = decideSessionGate(allow, session, redirect);

  useEffect(() => {
    if (decision.shouldRedirect && decision.target) {
      replaceRoute(router, hrefFor(decision.target));
    }
  }, [decision.shouldRedirect, decision.target, router]);

  if (allow === "member" && !decision.allowed) return null;
  return children;
}
