import type { ImageAsset } from "@/data/types";
import { cn } from "@/lib/cn";
import type { Destination } from "@/lib/routes";
import { ActionTarget } from "./action-target";
import { Avatar } from "./avatar";
import { Reveal } from "./reveal";
import { Text } from "./text";

const variants = {
  /** "You & GoldenHour", "Date with GoldenHour". */
  plain: "",
  /** Conversation list / INBOX row: hairline card. */
  list: "border border-divider hover:bg-weak",
  /** The open conversation in the list. */
  selected: "border border-rose bg-rose-light",
} as const;

type MemberRowProps = {
  photo: ImageAsset;
  title: string;
  description: string;
  variant?: keyof typeof variants;
  /** Makes the whole row a link (conversation rows). */
  to?: Destination;
  /** Marks the row of the open conversation. */
  current?: boolean;
  /** Placement only (rule 17). */
  className?: string;
  revealDelay?: number;
};

/** "Member / …" row: 48px photo, 14/20 title and a 14/22 line ("You & GoldenHour"). */
export function MemberRow({ photo, title, description, variant = "plain", to, current, className, revealDelay }: MemberRowProps) {
  const row = cn("flex w-full items-center gap-3 rounded-12 bg-white p-3 text-left", variants[variant]);
  const content = (
    <>
      <Avatar image={photo} size={48} decorative={Boolean(to)} />
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <Text variant="text14Semibold" tone="strong">
          {title}
        </Text>
        <Text variant="text14Relaxed" tone="sub">
          {description}
        </Text>
      </div>
    </>
  );
  return (
    <Reveal delay={revealDelay} className={cn("flex w-full", className)}>
      {to ? (
        <ActionTarget to={to} aria-current={current ? "page" : undefined} className={cn(row, "focus-ring transition-colors")}>
          {content}
        </ActionTarget>
      ) : (
        <div className={row}>{content}</div>
      )}
    </Reveal>
  );
}
