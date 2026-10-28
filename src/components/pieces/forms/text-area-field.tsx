import { useId } from "react";
import { cn } from "@/lib/cn";
import { softControl } from "@/lib/control-sizes";
import { FormField } from "@/components/pieces/forms/form-field";

type TextAreaFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  maxLength: number;
  disabled?: boolean;
  /** Rose message under the field; marks the control invalid. */
  message?: string;
  /** Placement only (rule 17). */
  className?: string;
  revealDelay?: number;
};

/** Align UI textarea (112px, soft hairline) under an external label ("Optional message", "Additional details"). */
export function TextAreaField({ label, value, onChange, placeholder, maxLength, disabled, message, className, revealDelay }: TextAreaFieldProps) {
  const id = useId();
  const messageId = useId();
  return (
    <FormField htmlFor={id} label={label} message={message} messageId={messageId} className={className} revealDelay={revealDelay}>
      <textarea
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        maxLength={maxLength}
        disabled={disabled}
        aria-invalid={message ? true : undefined}
        aria-describedby={message ? messageId : undefined}
        className={cn(softControl.area, message && "border-error")}
      />
    </FormField>
  );
}
