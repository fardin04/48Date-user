"use client";

import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { useSession } from "@/hooks/use-session";
import { hrefFor, type ScreenCode } from "@/lib/routes";

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
  const allowed = session === null ? null : allow === "member" ? session : !session;

  useEffect(() => {
    if (allowed === false) router.replace(hrefFor(redirect));
  }, [allowed, redirect, router]);

  if (allow === "member" && !allowed) return null;
  return children;
}
