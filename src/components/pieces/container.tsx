import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { layout } from "@/lib/control-sizes";

/** The 1536px content column with responsive gutters. */
export function Container({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn(layout.container, className)}>{children}</div>;
}
