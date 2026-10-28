"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";
import { addDays, formatFullDay, formatMonth } from "@/lib/portal/date-format";
import { textTones } from "@/lib/tones";
import { Icon } from "@/components/pieces/content/icon";
import { Text } from "@/components/pieces/content/text";

type DatePickerProps = {
  /** Selected `YYYY-MM-DD`. */
  value: string;
  onChange: (value: string) => void;
  /** Earliest selectable day (`YYYY-MM-DD`). */
  min: string;
  labels: { previous: string; next: string; weekdays: string[] };
};

const firstOfMonth = (iso: string) => `${iso.slice(0, 8)}01`;
const shiftMonth = (first: string, by: number) => {
  const [year, month] = first.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1 + by, 1));
  return date.toISOString().slice(0, 10);
};
/** Monday-first weekday index (0–6) of a `YYYY-MM-DD`. */
const weekday = (iso: string) => (new Date(`${iso}T00:00:00Z`).getUTCDay() + 6) % 7;

/** Align UI "Date & Range Picker [1.1]": one month, Monday first; past days and other months are disabled. */
export function DatePicker({ value, onChange, min, labels }: DatePickerProps) {
  const [month, setMonth] = useState(firstOfMonth(value || min));
  const start = addDays(month, -weekday(month));
  const weeks = Array.from({ length: 6 }, (_, row) => Array.from({ length: 7 }, (_, column) => addDays(start, row * 7 + column)));
  const nav = "focus-ring flex cursor-pointer items-center justify-center rounded-6 bg-white p-0.5 shadow-xs disabled:cursor-not-allowed disabled:opacity-40";

  return (
    <div className="w-full overflow-hidden rounded-20 border border-soft-line bg-white shadow-picker">
      <div className="flex flex-col gap-2 p-5 max-sm:p-3">
        <div className="flex items-center gap-1.5 rounded-8 bg-weak p-1.5">
          <button type="button" aria-label={labels.previous} disabled={month <= firstOfMonth(min)} onClick={() => setMonth(shiftMonth(month, -1))} className={nav}>
            <Icon name="arrow-left-s-line" size={20} tone="sub" />
          </button>
          <Text as="span" variant="text14Medium" tone="sub" aria-live="polite" className="flex-1 text-center">
            {formatMonth(month)}
          </Text>
          <button type="button" aria-label={labels.next} onClick={() => setMonth(shiftMonth(month, 1))} className={nav}>
            <Icon name="arrow-right-s-line" size={20} tone="sub" />
          </button>
        </div>
        <table className="w-full table-fixed border-separate border-spacing-x-2 border-spacing-y-0">
          <thead>
            <tr>
              {labels.weekdays.map((day) => (
                <th key={day} scope="col" className="py-2.5">
                  <Text as="span" variant="text14Medium" tone="iconSoft">
                    {day}
                  </Text>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {weeks.map((week) => (
              <tr key={week[0]}>
                {week.map((day) => {
                  const outside = day.slice(0, 7) !== month.slice(0, 7);
                  const disabled = outside || day < min;
                  const selected = day === value;
                  return (
                    <td key={day} className="p-0">
                      <button
                        type="button"
                        disabled={disabled}
                        aria-pressed={selected}
                        aria-label={formatFullDay(day)}
                        onClick={() => onChange(day)}
                        className={cn(
                          "focus-ring flex w-full cursor-pointer items-center justify-center rounded-8 py-2.5 transition-colors disabled:cursor-default",
                          selected ? cn("bg-rose", textTones.white) : disabled ? textTones.disabled : cn("hover:bg-weak", textTones.sub),
                        )}
                      >
                        <Text as="span" variant="text14Medium" tone="inherit">
                          {Number(day.slice(8))}
                        </Text>
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
