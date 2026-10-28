"use client";

import { useRouter } from "next/navigation";
import { useEffect, useSyncExternalStore, type ReactNode } from "react";
import { authService } from "@/lib/auth/auth-service";
import { hrefFor, type ScreenCode } from "@/lib/routes";

/** Re-checks when the session ends on its own (the API rejected a refresh). */
const subscribe = (listener: () => void) => authService.onSessionChange(listener);

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
  const session = useSyncExternalStore(subscribe, authService.hasSession, () => null);
  const allowed = session === null ? null : allow === "member" ? session : !session;

  useEffect(() => {
    if (allowed === false) router.replace(hrefFor(redirect));
  }, [allowed, redirect, router]);

  if (allow === "member" && !allowed) return null;
  return children;
}
