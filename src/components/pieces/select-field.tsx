import { useId } from "react";
import type { SelectOption } from "@/data/onboarding/types";
import { cn } from "@/lib/cn";
import { fieldControl, type FieldState } from "@/lib/control-sizes";
import { textTones } from "@/lib/tones";
import { FormField } from "./form-field";
import { Icon } from "./icon";

type SelectFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  /** Label of the empty option shown until a value is chosen; omit when a value is always set. */
  placeholder?: string;
  state?: FieldState;
  message?: string;
  required?: boolean;
  /** Placement only (rule 17). */
  className?: string;
  revealDelay?: number;
};

/** Labelled 56px native select drawn as the Figma "Select" input variant (value + 20px arrow). */
export function SelectField({ label, value, onChange, options, placeholder, state = "default", message, required, className, revealDelay }: SelectFieldProps) {
  const id = useId();
  const messageId = useId();
  const error = state === "error";
  return (
    <FormField htmlFor={id} label={label} message={error ? message : undefined} messageId={messageId} className={className} revealDelay={revealDelay}>
      <div className={cn(fieldControl.base, fieldControl[state], "relative")}>
        <select
          id={id}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          required={required}
          disabled={state === "disabled"}
          aria-invalid={error || undefined}
          aria-describedby={error ? messageId : undefined}
          className={cn(
            "absolute inset-0 w-full cursor-pointer appearance-none truncate rounded-12 bg-transparent pr-11 pl-4 outline-none",
            value ? textTones.inherit : textTones.gray400,
          )}
        >
          {placeholder !== undefined && <option value="">{placeholder}</option>}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <span className="pointer-events-none ml-auto flex">
          <Icon name="arrow-down-01" size={20} tone="sub" />
        </span>
      </div>
    </FormField>
  );
}
