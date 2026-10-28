"use client";

import { useState, useSyncExternalStore, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { typeScale } from "@/lib/type-scale";
import { textTones } from "@/lib/tones";
import { Icon } from "@/components/pieces/content/icon";

const DESKTOP_QUERY = "(min-width: 1024px)";

function subscribe(onChange: () => void) {
  const query = window.matchMedia(DESKTOP_QUERY);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

type LegalContentsProps = {
  label: string;
  /** Placement only (rule 17). */
  className?: string;
  children: ReactNode;
};

/**
 * "On this page" list: always open beside the article on desktop,
 * collapsed into a disclosure above the article on smaller screens (handoff note).
 */
export function LegalContents({ label, className, children }: LegalContentsProps) {
  const isDesktop = useSyncExternalStore(
    subscribe,
    () => window.matchMedia(DESKTOP_QUERY).matches,
    () => true,
  );
  const [openOnMobile, setOpenOnMobile] = useState(false);

  return (
    <details
      open={isDesktop || openOnMobile}
      onToggle={(event) => {
        if (!isDesktop) setOpenOnMobile(event.currentTarget.open);
      }}
      className={cn("group rounded-16 border border-soft-line p-4 lg:rounded-none lg:border-0 lg:p-0", className)}
    >
      <summary
        className={cn(
          "focus-ring flex cursor-pointer list-none items-center justify-between rounded-9 lg:pointer-events-none lg:cursor-auto [&::-webkit-details-marker]:hidden",
          typeScale.label14,
          textTones.rose,
        )}
      >
        {label}
        <span className="lg:hidden">
          <span className="flex group-open:hidden">
            <Icon name="add-01" size={20} tone="iconSoft" />
          </span>
          <span className="hidden group-open:flex">
            <Icon name="minus-sign" size={20} tone="sub" />
          </span>
        </span>
      </summary>
      {children}
    </details>
  );
}
