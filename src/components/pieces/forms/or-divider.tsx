import { cn } from "@/lib/cn";
import { Reveal } from "@/components/pieces/layout/reveal";
import { Text } from "@/components/pieces/content/text";

type OrDividerProps = {
  label: string;
  /** Placement only (rule 17). */
  className?: string;
  revealDelay?: number;
};

/** Hairline divider with a centred "or" between alternative sign-in methods. */
export function OrDivider({ label, className, revealDelay }: OrDividerProps) {
  return (
    <Reveal delay={revealDelay} className={cn("flex h-5.5 w-full items-center gap-3", className)}>
      <span aria-hidden="true" className="h-px flex-1 bg-gray-200" />
      <Text as="span" variant="text14Relaxed" tone="sub">
        {label}
      </Text>
      <span aria-hidden="true" className="h-px flex-1 bg-gray-200" />
    </Reveal>
  );
}
