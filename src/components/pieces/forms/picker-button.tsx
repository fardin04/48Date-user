import { useId } from "react";
import { cn } from "@/lib/cn";
import { fieldControl, softControl, type FieldState } from "@/lib/control-sizes";
import { textTones } from "@/lib/tones";
import { FormField } from "@/components/pieces/forms/form-field";
import { Icon } from "@/components/pieces/content/icon";

type PickerButtonProps = {
  label: string;
  /** Shown value, or empty for the placeholder. */
  value: string;
  placeholder?: string;
  onClick: () => void;
  /** regular: 56px "Form / Input control" (Select); compact: 48px Align UI select in dialogs. */
  size?: "regular" | "compact";
  state?: Exclude<FieldState, "disabled">;
  message?: string;
  /** Placement only (rule 17). */
  className?: string;
  revealDelay?: number;
};

/** A select-styled field that opens a picker dialog (Date, Time, cancellation Reason). */
export function PickerButton({ label, value, placeholder, onClick, size = "regular", state = "default", message, className, revealDelay }: PickerButtonProps) {
  const labelId = useId();
  const messageId = useId();
  const error = state === "error";
  return (
    <FormField labelId={labelId} label={label} message={error ? message : undefined} messageId={messageId} className={className} revealDelay={revealDelay}>
      <button
        type="button"
        onClick={onClick}
        aria-haspopup="dialog"
        aria-labelledby={labelId}
        aria-describedby={error ? messageId : undefined}
        className={cn("focus-ring cursor-pointer text-left", size === "regular" ? cn(fieldControl.base, fieldControl[state]) : softControl.select)}
      >
        <span className={cn("min-w-0 flex-1 truncate", !value && textTones.gray400)}>{value || placeholder}</span>
        <Icon name="arrow-down-01" size={20} tone="sub" />
      </button>
    </FormField>
  );
}
