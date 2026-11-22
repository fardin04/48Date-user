"use client";

import { useSyncExternalStore } from "react";
import { StatusNote } from "@/components/pieces/feedback/status-note";
import { googleError } from "@/lib/auth/google-error";

/** GOOGLE-ERROR: the API's own reason for the refused sign-in, when it gave one (QA X9). */
export function GoogleErrorReason() {
  const message = useSyncExternalStore(googleError.subscribe, googleError.snapshot, () => null);
  return message ? <StatusNote variant="error" message={message} /> : null;
}
