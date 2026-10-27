import type { Destination } from "@/lib/routes";
import { cn } from "@/lib/cn";
import { textTones } from "@/lib/tones";
import { typeScale } from "@/lib/type-scale";
import { ActionTarget } from "./action-target";
import { Text } from "./text";

const pills = {
  /** "Open" on SETTINGS / PRIVACY rows. */
  open: cn("bg-row-pill px-2", textTones.sub),
  /** TRUST rows ("Verified", "3 confirmed"). */
  status: cn("bg-divider px-3", textTones.sub),
  /** BLOCKED member ("Blocked"). */
  blocked: cn("bg-rose-pill px-2", textTones.rose),
} as const;

const ROW = "flex w-full items-center justify-between gap-3 border-b border-divider bg-white p-3 text-left";

type SettingsRowProps = {
  label: string;
  /** Pill text ("Open", "Verified", "Blocked"). */
  value: string;
  pill: keyof typeof pills;
  /** The row opens a screen… */
  to?: Destination;
  /** …or a dialog (Log out). Without either it is a read-only row. */
  onClick?: () => void;
};

/** W09 settings / status row: 14/20 semibold label with a rounded pill at the end; the parent is the list. */
export function SettingsRow({ label, value, pill, to, onClick }: SettingsRowProps) {
  const content = (
    <>
      <Text as="span" variant="text14Semibold" tone="strong" className="min-w-0 flex-1">
        {label}
      </Text>
      {value && <span className={cn("shrink-0 rounded-full py-1 whitespace-nowrap", typeScale.text14Relaxed, pills[pill])}>{value}</span>}
    </>
  );
  const interactive = cn(ROW, "focus-ring cursor-pointer transition-colors hover:bg-weak");
  if (to)
    return (
      <ActionTarget to={to} className={interactive}>
        {content}
      </ActionTarget>
    );
  if (onClick)
    return (
      <button type="button" onClick={onClick} aria-haspopup="dialog" className={interactive}>
        {content}
      </button>
    );
  return <div className={ROW}>{content}</div>;
}
