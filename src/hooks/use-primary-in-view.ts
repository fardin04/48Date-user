"use client";

import { useEffect, type RefObject } from "react";

/** Below 1024px the portal stacks its columns (150–400 % zoom at 1440), so the page heading can push the primary control out of view. */
const STACKED_MAX_WIDTH = 1023;

/** True when a stacked page opened with its primary control below the visible viewport. */
export function shouldLead(controlBottom: number, viewportWidth: number, viewportHeight: number) {
  return viewportWidth <= STACKED_MAX_WIDTH && controlBottom > viewportHeight + 1;
}

/**
 * When a page opens with its primary control out of view (200–400 % zoom, short screens), scrolls
 * the page's main region to the top of the viewport so it leads (rule 49): the conversation with
 * its composer, the discovery card with Like / Pass. At ordinary sizes the control is visible and nothing moves.
 */
export function usePrimaryInView(region: RefObject<HTMLElement | null>, control: RefObject<HTMLElement | null>, ready: boolean) {
  useEffect(() => {
    if (!ready) return;
    const frame = requestAnimationFrame(() => {
      const target = region.current;
      const key = control.current;
      if (!target || !key || !shouldLead(key.getBoundingClientRect().bottom, document.documentElement.clientWidth, window.innerHeight)) return;
      target.scrollIntoView({ block: "start", behavior: "instant" });
    });
    return () => cancelAnimationFrame(frame);
  }, [region, control, ready]);
}
