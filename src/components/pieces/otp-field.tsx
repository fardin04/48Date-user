"use client";

import { useState } from "react";
import { digitsOnly } from "@/lib/auth/phone";
import { cn } from "@/lib/cn";
import { textTones } from "@/lib/tones";
import { typeScale } from "@/lib/type-scale";
import { Reveal } from "./reveal";

export const CODE_LENGTH = 6;

const cellStates = {
  default: "border-input-line bg-white",
  error: "border-error bg-white",
  /** OTP-EXPIRED: greyed cells with the error stroke. */
  disabled: "border-error bg-gray-100 opacity-65",
} as const;

type OtpFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  state?: keyof typeof cellStates;
  describedBy?: string;
  autoFocus?: boolean;
  /** Placement only (rule 17). */
  className?: string;
  revealDelay?: number;
};

/**
 * One grouped six-digit input (handoff: "one grouped OTP input"). A single real input sits over
 * six visual cells, so typing, paste and the browser's one-time-code autofill all work.
 */
export function OtpField({ label, value, onChange, state = "default", describedBy, autoFocus, className, revealDelay }: OtpFieldProps) {
  const [focused, setFocused] = useState(false);
  const activeIndex = Math.min(value.length, CODE_LENGTH - 1);
  return (
    <Reveal delay={revealDelay} className={cn("relative w-full", className)}>
      <div aria-hidden="true" className="grid grid-cols-6 gap-2 sm:gap-3">
        {Array.from({ length: CODE_LENGTH }, (_, index) => (
          <span
            key={index}
            className={cn(
              "flex h-16 items-center justify-center rounded-12 border transition-colors",
              typeScale.text24Semibold,
              textTones.gray900,
              cellStates[state],
              focused && state !== "disabled" && index === activeIndex && "border-rose ring-1 ring-rose",
            )}
          >
            {value[index] ?? ""}
          </span>
        ))}
      </div>
      <input
        aria-label={label}
        value={value}
        onChange={(event) => onChange(digitsOnly(event.target.value).slice(0, CODE_LENGTH))}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        inputMode="numeric"
        autoComplete="one-time-code"
        maxLength={CODE_LENGTH}
        disabled={state === "disabled"}
        aria-invalid={state === "error" || undefined}
        aria-describedby={describedBy}
        autoFocus={autoFocus}
        className="absolute inset-0 size-full cursor-text opacity-0 disabled:cursor-not-allowed"
      />
    </Reveal>
  );
}
