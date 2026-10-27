import Link from "next/link";
import type { ReactNode } from "react";
import { hrefFor, type Destination } from "@/lib/routes";

type ActionTargetProps = {
  to: Destination;
  className?: string;
  "aria-label"?: string;
  /** Marks the link to the open page or tab. */
  "aria-current"?: "page";
  children: ReactNode;
};

/**
 * Resolves a Destination: a screen code becomes a Link via hrefFor (rule 11);
 * a notFunctional destination becomes an aria-disabled button carrying its reason (rule 12).
 */
export function ActionTarget({ to, className, children, ...rest }: ActionTargetProps) {
  if ("notFunctional" in to) {
    return (
      <button
        type="button"
        aria-disabled="true"
        title={to.notFunctional}
        data-not-functional={to.notFunctional}
        className={className}
        {...rest}
      >
        {children}
      </button>
    );
  }
  return (
    // Section links keep the current scroll position; ScrollToSection then glides to the target.
    <Link href={hrefFor(to.screen, to.section ?? to.param)} scroll={to.section ? false : undefined} className={className} {...rest}>
      {children}
    </Link>
  );
}
