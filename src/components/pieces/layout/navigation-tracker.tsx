"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { record } from "@/lib/navigation/nav-trail";

/** Records each page this tab visits for history-aware Back (rule 51). Renders nothing; mounted once in the root layout. */
export function NavigationTracker() {
  const pathname = usePathname();
  useEffect(() => {
    if (pathname) record(pathname);
  }, [pathname]);
  return null;
}
