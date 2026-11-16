"use client";

import { useId, useState, type MouseEvent, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { typeScale } from "@/lib/type-scale";
import { textTones } from "@/lib/tones";
import { Icon } from "@/components/pieces/content/icon";
import { bringIntoView } from "@/components/pieces/layout/scroll-to-section";

type LegalContentsProps = {
  label: string;
  /** Placement only (rule 17). */
  className?: string;
  children: ReactNode;
};

/**
 * "On this page" list: always open beside the article from 1024px (sticky while it fits the
 * viewport, scrolling inside itself otherwise, never sticky in short viewports), and a
 * disclosure above the article below that (handoff note). Open / closed is CSS-driven, so the
 * server render matches every width and nothing snaps shut on hydration.
 */
export function LegalContents({ label, className, children }: LegalContentsProps) {
  const [open, setOpen] = useState(false);
  const listId = useId();

  const onPick = (event: MouseEvent) => {
    const link = (event.target as Element).closest("a");
    if (!link) return;
    setOpen(false);
    // The same URL doesn't re-run ScrollToSection, so bring an already-open section back here.
    if (link.pathname === window.location.pathname) bringIntoView(link.pathname.split("/").pop(), true);
  };

  return (
    <div
      className={cn(
        "rounded-16 border border-soft-line p-4 lg:sticky lg:top-8 lg:max-h-[calc(var(--svh)-4rem)] lg:overflow-y-auto lg:rounded-none lg:border-0 lg:p-1 lg:short:static lg:short:max-h-none",
        className,
      )}
    >
      <button
        type="button"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => setOpen((value) => !value)}
        className={cn("focus-ring flex w-full cursor-pointer items-center justify-between rounded-9 lg:hidden", typeScale.label14, textTones.rose)}
      >
        {label}
        <Icon name={open ? "minus-sign" : "add-01"} size={20} tone={open ? "sub" : "iconSoft"} />
      </button>
      <p aria-hidden="true" className={cn("hidden lg:block", typeScale.label14, textTones.rose)}>
        {label}
      </p>
      <div id={listId} onClick={onPick} className={cn(open ? "block" : "hidden", "lg:block")}>
        {children}
      </div>
    </div>
  );
}
