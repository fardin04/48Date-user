"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ActionButton } from "@/components/pieces/actions/action-button";
import { FormHeader } from "@/components/pieces/forms/form-header";
import { TypingDots } from "@/components/pieces/content/typing-dots";
import type { Action, Intro } from "@/data/types";
import { authService } from "@/lib/auth/auth-service";
import { renderGoogleButton } from "@/lib/auth/google-identity";
import { hrefFor, type ScreenCode } from "@/lib/routes";

type GoogleStepProps = {
  intro: Intro;
  waitingLabel: string;
  /** "Use my phone instead". */
  primary: Action;
  /** GOOGLE-ERROR / SIGNIN-GOOGLE-ERROR. */
  failed: ScreenCode;
};

/**
 * GOOGLE-REDIRECT / SIGNIN-GOOGLE with the API: Google's own button opens its secure window; the
 * ID token it returns signs the member in (setup continues at LOCATION, a finished profile opens
 * DISCOVER). A closed window, a failed check or a script that won't load opens the error screen.
 */
export function GoogleStep({ intro, waitingLabel, primary, failed }: GoogleStepProps) {
  const router = useRouter();
  const slot = useRef<HTMLDivElement>(null);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    let active = true;
    const fail = () => {
      if (active) router.replace(hrefFor(failed));
    };
    const signIn = async (idToken: string) => {
      setChecking(true);
      const result = await authService.signInWithGoogle(idToken);
      if (!active) return;
      if (result.status === "verified") router.replace(hrefFor(result.next === "portal" ? "DISCOVER" : "LOCATION"));
      else fail();
    };
    if (slot.current) void renderGoogleButton(slot.current, (token) => void signIn(token), fail).catch(fail);
    return () => {
      active = false;
    };
  }, [failed, router]);

  return (
    <div className="flex flex-col items-center gap-6">
      <FormHeader eyebrow={intro.eyebrow} title={intro.title} description={intro.description ?? ""} revealDelay={0} />
      {checking ? <TypingDots variant="activity" label={waitingLabel} /> : <div ref={slot} className="flex min-h-11 w-full justify-center" />}
      <ActionButton action={primary} variant="outline" size="pill" width="full" revealDelay={80} className="w-full" />
    </div>
  );
}
