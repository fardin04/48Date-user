"use client";

import { useRouter } from "next/navigation";
import type { MouseEvent } from "react";
import { readTrail, resolveBack } from "@/lib/navigation/nav-trail";
import { hrefFor, type Destination } from "@/lib/routes";

/**
 * History-aware Back (rules 51–53). `href` is always the fallback, so the link still works when
 * opened in a new tab or without JavaScript; `onBack` returns through the browser history to the
 * page this tab came from (scroll and client state restored), or opens the fallback on direct entry.
 */
export function useBackTarget(fallback: Destination) {
  const router = useRouter();
  const href = "screen" in fallback ? hrefFor(fallback.screen, fallback.section ?? fallback.param) : null;

  function onBack(event: MouseEvent<HTMLAnchorElement>) {
    // New-tab and modified clicks keep the browser's own behaviour.
    if (!href || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    if (resolveBack(readTrail(), window.location.pathname, href).kind !== "history") return;
    event.preventDefault();
    router.back();
  }

  return { href, onBack };
}
