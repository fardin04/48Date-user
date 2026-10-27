import type { CSSProperties } from "react";
import type { IconName } from "@/data/types";
import { cn } from "@/lib/cn";
import { iconSizes, type IconSize } from "@/lib/control-sizes";
import { textTones, type TextTone } from "@/lib/tones";

type IconProps = {
  name: IconName;
  size?: IconSize;
  /** Inherits the text colour when omitted. */
  tone?: TextTone;
  /** Only for icons that carry meaning on their own; decorative icons stay hidden from assistive tech. */
  label?: string;
};

/** Hugeicons Pro (Solid Rounded) glyph from public/icons, coloured via currentColor (rule 13). */
export function Icon({ name, size = 20, tone, label }: IconProps) {
  return (
    <span
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      className={cn("icon-mask", iconSizes[size], tone && textTones[tone])}
      style={{ "--icon": `url(/icons/${name}.svg)` } as CSSProperties}
    />
  );
}
