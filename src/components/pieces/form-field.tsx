import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { textTones } from "@/lib/tones";
import { typeScale } from "@/lib/type-scale";
import { Reveal } from "./reveal";

type FormFieldProps = {
  /** id of the control the label names; omit for a control that labels itself (`labelId`). */
  htmlFor?: string;
  labelId?: string;
  label: string;
  /** Rose validation message under the control. */
  message?: string;
  messageId?: string;
  /** Placement only (rule 17). */
  className?: string;
  revealDelay?: number;
  children: ReactNode;
};

/** "Form / Input control" field: external 14/22 label, the 56px control and an optional rose message. */
export function FormField({ htmlFor, labelId, label, message, messageId, className, revealDelay, children }: FormFieldProps) {
  const labelClass = cn(typeScale.text14SemiboldRelaxed, textTones.strong);
  return (
    <Reveal delay={revealDelay} className={cn("flex w-full min-w-0 flex-col gap-2", className)}>
      {htmlFor ? (
        <label htmlFor={htmlFor} id={labelId} className={labelClass}>
          {label}
        </label>
      ) : (
        <span id={labelId} className={labelClass}>
          {label}
        </span>
      )}
      {children}
      {message && (
        <p id={messageId} role="alert" className={cn(typeScale.text12Relaxed, textTones.rose)}>
          {message}
        </p>
      )}
    </Reveal>
  );
}
