"use client";

import { useEffect } from "react";

/** Scrolls the section with this id to the top; `focus` also moves focus to it (it needs `tabIndex={-1}`). */
export function bringIntoView(id: string | undefined, focus = false) {
  const target = id ? document.getElementById(id) : null;
  if (!target) return;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  target.scrollIntoView({ block: "start", behavior: reduceMotion ? "auto" : "smooth" });
  if (focus) target.focus({ preventScroll: true });
}

/**
 * Brings the section named by the URL path (`/how-it-works`, `/terms/community-conduct`)
 * into view. Path routing replaces `#hash` anchors (rule 11).
 */
export function ScrollToSection({ id, focus = false }: { id?: string; focus?: boolean }) {
  useEffect(() => bringIntoView(id, focus), [id, focus]);
  return null;
}
