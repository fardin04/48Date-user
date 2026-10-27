import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import type { TypeVariant } from "@/lib/type-scale";
import { Reveal } from "./reveal";
import { Text } from "./text";

const variants = {
  /** Authentication: rose eyebrow, 32/42 title. */
  auth: { title: "authTitle32", gap: "gap-3" },
  /** Onboarding setup screens: 28/38 title, no eyebrow. */
  setup: { title: "setupTitle28", gap: "gap-3" },
  /** Portal page heading beside its action ("Discover"): 28/38 semibold, 4px apart. */
  portalPage: { title: "portalTitle28", gap: "gap-1" },
  /** Portal workspace heading (FILTERS, COMPAT): 8px apart. */
  portal: { title: "portalTitle28", gap: "gap-2" },
  /** Portal status screens (MATCH-NEW, empty states): title and line spaced like the workspace (20px). */
  portalStatus: { title: "portalTitle28", gap: "gap-5" },
  /** INBOX: 8px apart over a hairline. */
  portalDivided: { title: "portalTitle28", gap: "gap-2 border-b border-divider pb-2" },
} satisfies Record<string, { title: TypeVariant; gap: string }>;

type FormHeaderProps = {
  eyebrow?: string;
  title: string;
  description: string;
  variant?: keyof typeof variants;
  align?: "start" | "center";
  /** Status badge drawn after the title ("Expiring soon"). */
  badge?: ReactNode;
  /** Placement only (rule 17). */
  className?: string;
  revealDelay?: number;
};

/** Form heading: optional rose eyebrow, the page's h1 and a supporting line announced when it changes. */
export function FormHeader({ eyebrow, title, description, variant = "auth", align = "start", badge, className, revealDelay }: FormHeaderProps) {
  const style = variants[variant];
  const heading = (
    <Text as="h1" variant={style.title} tone="strong">
      {title}
    </Text>
  );
  return (
    <Reveal as="header" delay={revealDelay} className={cn("flex w-full flex-col", style.gap, align === "center" && "text-center", className)}>
      {eyebrow && (
        <Text variant="text12Semibold" tone="rose">
          {eyebrow}
        </Text>
      )}
      {badge ? (
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
          {heading}
          {badge}
        </div>
      ) : (
        heading
      )}
      <Text variant="text16" tone="sub" aria-live="polite">
        {description}
      </Text>
    </Reveal>
  );
}
