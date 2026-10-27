import Image from "next/image";
import type { ImageAsset } from "@/data/types";
import { cn } from "@/lib/cn";
import { Reveal } from "./reveal";
import { SelectionMark } from "./selection-mark";
import { Text } from "./text";

type PictureChoiceProps = {
  name: string;
  value: string;
  label: string;
  image?: ImageAsset;
  checked: boolean;
  disabled?: boolean;
  onSelect: () => void;
  /** Placement only (rule 17). */
  className?: string;
  revealDelay?: number;
};

/** "Choice / …" on This or That: a 169×120 picture, the label and an Align UI radio, over a native radio. */
export function PictureChoice({ name, value, label, image, checked, disabled, onSelect, className, revealDelay }: PictureChoiceProps) {
  return (
    <Reveal delay={revealDelay} className={cn("flex", className)}>
      <label
        className={cn(
          "flex w-full cursor-pointer flex-col items-center justify-center gap-3 rounded-16 border bg-white p-3 transition-colors focus-ring-within has-disabled:cursor-default",
          checked ? "border-rose" : "border-rose-mid hover:bg-weak",
        )}
      >
        <input type="radio" name={name} value={value} checked={checked} disabled={disabled} onChange={onSelect} className="sr-only" />
        {image && (
          <span className="relative block h-30 w-42 overflow-hidden rounded-16">
            <Image src={image.src} alt={image.alt} fill sizes="169px" className="object-cover" />
          </span>
        )}
        <span className="flex w-full flex-col items-start gap-3">
          <Text as="span" variant="text14Semibold" tone="strong">
            {label}
          </Text>
          <SelectionMark type="radio" checked={checked} />
        </span>
      </label>
    </Reveal>
  );
}
