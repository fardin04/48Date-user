import type { ImageAsset } from "@/data/types";
import { cn } from "@/lib/cn";
import { surfaces } from "@/lib/tones";
import type { Destination } from "@/lib/routes";
import { ActionTarget } from "@/components/pieces/actions/action-target";
import { Avatar } from "@/components/pieces/media/avatar";
import { Reveal } from "@/components/pieces/layout/reveal";
import { Text } from "@/components/pieces/content/text";

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
  /** When it last changed ("2:41 PM", "Yesterday"), beside the title. */
  meta?: string;
  /** Unread count as shown ("3") with its full label ("3 unread") for assistive tech. */
  badge?: { text: string; label: string };
  variant?: keyof typeof variants;
  /** Makes the whole row a link (conversation rows). */
  to?: Destination;
  /** Marks the row of the open conversation. */
  current?: boolean;
  /** Placement only (rule 17). */
  className?: string;
  revealDelay?: number;
};

/** "Member / …" row: 48px photo, 14/20 title and a 14/22 line ("You & GoldenHour"), with an optional time and unread count. */
export function MemberRow({ photo, title, description, meta, badge, variant = "plain", to, current, className, revealDelay }: MemberRowProps) {
  const row = cn("flex w-full items-center gap-3 rounded-12 bg-white p-3 text-left", variants[variant]);
  const content = (
    <>
      <Avatar image={photo} size={48} decorative={Boolean(to)} />
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="flex items-baseline justify-between gap-2">
          <Text as="span" variant="text14Semibold" tone="strong" className="min-w-0 truncate">
            {title}
          </Text>
          {meta && (
            <Text as="span" variant="text12Medium" tone="sub" className="shrink-0">
              {meta}
            </Text>
          )}
        </span>
        <span className="flex items-center justify-between gap-2">
          <Text as="span" variant="text14Relaxed" tone="sub" className="line-clamp-2 min-w-0">
            {description}
          </Text>
          {badge && (
            <span className={cn("flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full px-1.5", surfaces.rose)}>
              <Text as="span" variant="text12Bold" tone="white" aria-hidden>
                {badge.text}
              </Text>
              <span className="sr-only">{badge.label}</span>
            </span>
          )}
        </span>
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
