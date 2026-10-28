import type { Choice } from "@/data/onboarding/types";
import { cn } from "@/lib/cn";
import { Icon } from "@/components/pieces/content/icon";
import { Reveal } from "@/components/pieces/layout/reveal";
import { SelectionMark } from "@/components/pieces/forms/selection-mark";
import { Text } from "@/components/pieces/content/text";

const heights = {
  /** INTERESTS cards. */
  compact: "min-h-30",
  /** GOALS, PERSONALITY, COMMUNICATION, PHOTO-SOURCE. */
  regular: "min-h-34",
} as const;

type ChoiceCardProps = {
  choice: Choice;
  type: "radio" | "checkbox";
  /** Shared input name of the group. */
  name: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  size?: keyof typeof heights;
  /** Placement only (rule 17). */
  className?: string;
  revealDelay?: number;
};

/**
 * "Onboarding / Choice card": icon, radio or checkbox, title and description. A native input
 * keeps keyboard semantics; the selected card turns rose.
 */
export function ChoiceCard({ choice, type, name, checked, onChange, disabled, size = "regular", className, revealDelay }: ChoiceCardProps) {
  return (
    <Reveal delay={revealDelay} className={cn("flex", className)}>
      <label
        className={cn(
          "flex w-full cursor-pointer flex-col gap-1.5 rounded-12 border px-4 py-3.5 transition-colors focus-ring-within",
          heights[size],
          checked ? "border-rose bg-rose-light" : "border-gray-300 bg-white hover:bg-weak",
          disabled && "cursor-not-allowed opacity-50 hover:bg-white",
        )}
      >
        <input
          type={type}
          name={name}
          value={choice.value}
          checked={checked}
          disabled={disabled}
          onChange={(event) => onChange(event.target.checked)}
          className="sr-only"
        />
        <span className="flex h-6 items-center justify-between">
          <Icon name={choice.icon} size={24} tone={checked ? "rose" : "muted"} />
          <SelectionMark type={type} checked={checked} />
        </span>
        <Text as="span" variant="text14SemiboldRelaxed" tone="strong">
          {choice.title}
        </Text>
        <Text as="span" variant="text12Medium" tone="sub">
          {choice.description}
        </Text>
      </label>
    </Reveal>
  );
}
