"use client";

/**
 * TESTING ONLY — remove before release.
 * Shows the `devOtp` the API returns from `POST /auth/phone/request-otp` under the code field, with a
 * copy button, so testers on phones can sign in without dev tools. It renders nothing when the API
 * doesn't send `devOtp` (the mocks never do).
 *
 * To remove: delete this file, the `rememberDevOtp(...)` line in `lib/auth/api-auth-service.ts` and the
 * `<DevOtpHint />` line (and its import) in `verify-step.tsx`.
 */
import { useState, useSyncExternalStore } from "react";
import { Icon } from "@/components/pieces/content/icon";
import { cn } from "@/lib/cn";
import { textTones } from "@/lib/tones";
import { typeScale } from "@/lib/type-scale";

// The "48date." prefix makes sign-out clear it with the rest of the app's storage.
const KEY = "48date.devOtp";
const COPY = { label: "Test code", copy: "Copy", copied: "Copied", copyLabel: "Copy test code" };
const listeners = new Set<() => void>();

function read(): string | null {
  try {
    return sessionStorage.getItem(KEY);
  } catch {
    return null;
  }
}

/** Called by the API auth service with each request-otp response. */
export function rememberDevOtp(code: string | undefined) {
  try {
    if (code) sessionStorage.setItem(KEY, code);
    else sessionStorage.removeItem(KEY);
  } catch {
    // Blocked storage: nothing to show.
  }
  listeners.forEach((listener) => listener());
}

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Older mobile browsers: copy through a temporary field.
    const field = document.createElement("textarea");
    field.value = text;
    field.setAttribute("readonly", "");
    field.style.position = "fixed";
    field.style.opacity = "0";
    document.body.appendChild(field);
    field.select();
    const done = document.execCommand("copy");
    field.remove();
    return done;
  }
}

export function DevOtpHint() {
  const code = useSyncExternalStore(subscribe, read, () => null);
  const [copied, setCopied] = useState(false);
  if (!code) return null;

  const copy = async () => {
    if (await copyText(code)) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  return (
    <div className={cn("flex w-full items-center justify-between gap-3 rounded-12 bg-notice-bg p-3", textTones.notice)}>
      <p className={typeScale.text14MediumRelaxed}>
        {COPY.label}:{" "}
        <button type="button" onClick={copy} className={cn("focus-ring select-all rounded-12 tracking-[0.2em]", typeScale.text20Bold)}>
          {code}
        </button>
      </p>
      <button
        type="button"
        onClick={copy}
        aria-label={COPY.copyLabel}
        className={cn("focus-ring flex min-h-11 items-center gap-1.5 rounded-full bg-white px-4", typeScale.text14Semibold)}
      >
        {copied && <Icon name="tick-02" size={16} />}
        <span aria-live="polite">{copied ? COPY.copied : COPY.copy}</span>
      </button>
    </div>
  );
}
