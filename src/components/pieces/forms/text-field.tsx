import { useId, type HTMLInputTypeAttribute, type Ref } from "react";
import { cn } from "@/lib/cn";
import { fieldControl, fieldInput, type FieldState } from "@/lib/control-sizes";
import { FormField } from "@/components/pieces/forms/form-field";

type TextFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: Extract<HTMLInputTypeAttribute, "text" | "date" | "email" | "tel">;
  autoComplete?: string;
  /** Keyboard to show on touch devices (numeric for the portal age range). */
  inputMode?: "text" | "numeric" | "email" | "tel";
  maxLength?: number;
  /** Error shows `message`; disabled locks the value (NICK-CHECK). */
  state?: FieldState;
  message?: string;
  required?: boolean;
  /** Extra ids describing the control (e.g. a live status note). */
  describedBy?: string;
  inputRef?: Ref<HTMLInputElement>;
  min?: string;
  max?: string;
  /** Placement only (rule 17). */
  className?: string;
  revealDelay?: number;
};

/** Labelled 56px text input with Default / Error / Disabled states. */
export function TextField({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  autoComplete,
  inputMode,
  maxLength,
  state = "default",
  message,
  required,
  describedBy,
  inputRef,
  min,
  max,
  className,
  revealDelay,
}: TextFieldProps) {
  const id = useId();
  const messageId = useId();
  const error = state === "error";
  return (
    <FormField
      htmlFor={id}
      label={label}
      message={error ? message : undefined}
      messageId={messageId}
      className={className}
      revealDelay={revealDelay}
    >
      <div className={cn(fieldControl.base, fieldControl[state])}>
        <input
          ref={inputRef}
          id={id}
          type={type}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          inputMode={inputMode}
          maxLength={maxLength}
          min={min}
          max={max}
          required={required}
          disabled={state === "disabled"}
          aria-invalid={error || undefined}
          aria-describedby={cn(error && messageId, describedBy) || undefined}
          className={fieldInput}
        />
      </div>
    </FormField>
  );
}
