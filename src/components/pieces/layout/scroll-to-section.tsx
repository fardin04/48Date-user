"use client";

import { useEffect } from "react";

/**
 * Brings the section named by the URL path (`/how-it-works`, `/terms/community-conduct`)
 * into view. Path routing replaces `#hash` anchors (rule 11).
 */
export function ScrollToSection({ id }: { id?: string }) {
  useEffect(() => {
    const target = id ? document.getElementById(id) : null;
    if (!target) return;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    target.scrollIntoView({ block: "start", behavior: reduceMotion ? "auto" : "smooth" });
  }, [id]);
  return null;
}
