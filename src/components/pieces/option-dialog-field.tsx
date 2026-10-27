"use client";

import { useId, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import type { SelectOption } from "@/data/onboarding/types";
import { cn } from "@/lib/cn";
import { fieldControl, type FieldState } from "@/lib/control-sizes";
import { textTones } from "@/lib/tones";
import { FormField } from "./form-field";
import { Icon } from "./icon";
import { OptionRow } from "./option-row";
import { Text } from "./text";

type OptionDialogFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder: string;
  dialog: { title: string; description: string; closeLabel: string; confirm: string };
  state?: FieldState;
  message?: string;
  /** Placement only (rule 17). */
  className?: string;
  revealDelay?: number;
};

/**
 * Select-styled field that opens a single-choice dialog (BIRTHDAY → SELECT-OCCUPATION).
 * The choice applies only when confirmed; closing keeps the previous value.
 */
export function OptionDialogField({ label, value, onChange, options, placeholder, dialog, state = "default", message, className, revealDelay }: OptionDialogFieldProps) {
  const labelId = useId();
  const messageId = useId();
  const name = useId();
  const [open, setOpen] = useState(false);
  const [choice, setChoice] = useState(value);
  const current = options.find((option) => option.value === value);
  const error = state === "error";

  const toggle = (next: boolean) => {
    if (next) setChoice(value || (options[0]?.value ?? ""));
    setOpen(next);
  };

  return (
    <FormField labelId={labelId} label={label} message={error ? message : undefined} messageId={messageId} className={className} revealDelay={revealDelay}>
      <Dialog open={open} onOpenChange={toggle}>
        <DialogTrigger
          aria-labelledby={labelId}
          aria-describedby={error ? messageId : undefined}
          aria-invalid={error || undefined}
          className={cn(fieldControl.base, fieldControl[state], "focus-ring cursor-pointer text-left")}
        >
          <span className={cn("min-w-0 flex-1 truncate", current ? textTones.inherit : textTones.gray400)}>{current?.label ?? placeholder}</span>
          <Icon name="arrow-down-01" size={20} tone="sub" />
        </DialogTrigger>
        <DialogContent className="flex max-w-140 flex-col gap-4 rounded-24 p-8">
          <div className="relative flex min-h-26 flex-col justify-center gap-1 border-b border-soft-line pr-10 pb-4">
            <DialogTitle asChild>
              <Text as="h2" variant="title24" tone="gray900">
                {dialog.title}
              </Text>
            </DialogTitle>
            <DialogDescription asChild>
              <Text variant="text14Relaxed" tone="muted">
                {dialog.description}
              </Text>
            </DialogDescription>
            <DialogClose aria-label={dialog.closeLabel} className="focus-ring absolute top-4 right-4 flex cursor-pointer rounded-[6px] p-0.5 text-sub hover:text-strong">
              <Icon name="close-line" size={20} />
            </DialogClose>
          </div>
          <fieldset className="flex flex-col gap-4">
            <legend className="sr-only">{dialog.title}</legend>
            {options.map((option) => (
              <OptionRow
                key={option.value}
                variant="radio"
                name={name}
                value={option.value}
                label={option.label}
                checked={choice === option.value}
                onSelect={() => setChoice(option.value)}
              />
            ))}
          </fieldset>
          <Button
            type="button"
            variant="confirm"
            size="pill"
            width="full"
            onClick={() => {
              onChange(choice);
              setOpen(false);
            }}
          >
            {dialog.confirm}
          </Button>
        </DialogContent>
      </Dialog>
    </FormField>
  );
}
