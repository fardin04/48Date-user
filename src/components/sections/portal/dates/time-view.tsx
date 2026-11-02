"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { ActionRow } from "@/components/pieces/actions/action-row";
import { DatePicker } from "@/components/pieces/forms/date-picker";
import { FormHeader } from "@/components/pieces/forms/form-header";
import { OptionRow } from "@/components/pieces/forms/option-row";
import { PickerButton } from "@/components/pieces/forms/picker-button";
import { PortalBack } from "@/components/pieces/actions/portal-back";
import { PortalDialog } from "@/components/pieces/overlays/portal-dialog";
import { SelectField } from "@/components/pieces/forms/select-field";
import { StatusNote } from "@/components/pieces/feedback/status-note";
import { Text } from "@/components/pieces/content/text";
import { Button } from "@/components/ui/button";
import type { MemberId } from "@/data/portal/types";
import { cn } from "@/lib/cn";
import { fill } from "@/lib/format";
import { addDays, formatFullDay, formatShortDay, formatTime, hasPassed, todayIso } from "@/lib/portal/date-format";
import { dateService, type DatePlan } from "@/lib/portal/date-service";
import { useDatePlan } from "@/hooks/use-date-plan";
import { hrefFor, toItem } from "@/lib/routes";
import { textTones } from "@/lib/tones";
import { typeScale } from "@/lib/type-scale";
import { getDatePage } from "@/stores/portal-store";
import { DateContext } from "@/components/sections/portal/dates/date-context";
import { Workspace } from "@/components/sections/portal/shared/workspace";

const SUGGESTED_DAYS = 3;

/** W06 / DATE-TIME with DATE-PICKER and TIME-PICKER: pick a day, a time and the date's timezone. */
export function TimeView({ memberId }: { memberId: MemberId }) {
  const { plan } = useDatePlan(memberId);
  if (!plan) return null;
  // The form mounts once the saved plan is read, so it starts from it.
  return <TimeForm plan={plan} />;
}

function TimeForm({ plan }: { plan: DatePlan }) {
  const copy = getDatePage().time;
  const router = useRouter();
  const today = todayIso();
  // As drawn, a new plan starts on the first suggested day at 4:00 PM.
  const [date, setDate] = useState(plan.date && plan.date >= today ? plan.date : addDays(today, 1));
  const [time, setTime] = useState<number | null>(plan.time ?? copy.defaultTime);
  const [timezone, setTimezone] = useState(plan.timezone);
  const [dialog, setDialog] = useState<"date" | "time" | null>(null);
  const [pickedDate, setPickedDate] = useState(date || today);
  const [pickedTime, setPickedTime] = useState(time ?? copy.defaultTime);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const days = Array.from({ length: SUGGESTED_DAYS }, (_, index) => addDays(today, index + 1));
  const slots: number[] = [];
  for (let minutes = copy.slots.from; minutes <= copy.slots.to; minutes += copy.slots.step) slots.push(minutes);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (busy) return;
    if (!date || time === null) return setError(copy.required);
    if (hasPassed(date, time)) return setError(copy.pastError);
    setBusy(true);
    await dateService.saveDraft(plan.member, { date, time, timezone });
    router.push(hrefFor("DATE-REVIEW", plan.member));
  };

  const pickDay = (day: string) => {
    setDate(day);
    setError("");
  };
  const openDate = () => {
    setPickedDate(date || addDays(today, 1));
    setDialog("date");
  };
  const openTime = () => {
    setPickedTime(time ?? copy.defaultTime);
    setDialog("time");
  };
  const applyDate = () => {
    pickDay(pickedDate);
    setDialog(null);
  };
  const applyTime = () => {
    setTime(pickedTime);
    setError("");
    setDialog(null);
  };

  const chip = (on: boolean) =>
    cn("focus-ring min-w-21.5 cursor-pointer rounded-full p-2 text-center", typeScale.text12Medium, on ? cn("bg-rose-light", textTones.rose) : cn("bg-canvas-cool", textTones.sub));

  return (
    <Workspace aside={<DateContext member={plan.member} place={plan.place} />}>
      <PortalBack action={{ ...getDatePage().back, to: toItem("VENUE-DETAIL", plan.member) }} />
      <form onSubmit={submit} noValidate aria-busy={busy || undefined} className="flex w-full flex-col gap-5">
        <FormHeader variant="portal" title={copy.title} description={copy.description} />
        <div role="group" aria-label={copy.suggestedLabel} className="flex flex-wrap gap-2">
          {days.map((day) => (
            <button key={day} type="button" aria-pressed={day === date} onClick={() => pickDay(day)} className={chip(day === date)}>
              {formatShortDay(day)}
            </button>
          ))}
        </div>
        <PickerButton
          label={copy.fields.date}
          value={date ? formatFullDay(date) : ""}
          placeholder={copy.placeholders.date}
          state={error && !date ? "error" : "default"}
          message={error}
          onClick={openDate}
        />
        <PickerButton
          label={copy.fields.time}
          value={time === null ? "" : formatTime(time)}
          placeholder={copy.placeholders.time}
          state={error && time === null ? "error" : "default"}
          message={error}
          onClick={openTime}
        />
        <SelectField label={copy.fields.timezone} value={timezone} onChange={setTimezone} options={copy.timezones.map((zone) => ({ value: zone, label: zone }))} />
        {error && date && time !== null && <StatusNote variant="alert" message={error} />}
        <ActionRow>
          <Button type="submit" variant="confirm" size="portalPill" width="actionSlot" disabled={busy} aria-busy={busy || undefined}>
            {copy.primary}
          </Button>
        </ActionRow>
      </form>
      <PortalDialog
        open={dialog === "date"}
        onOpenChange={(open) => setDialog(open ? "date" : null)}
        header="fit"
        title={copy.datePicker.title}
        description={fill(copy.datePicker.description, { timezone })}
        closeLabel={copy.datePicker.close}
        actions={
          <Button type="button" variant="confirm" size="portalPill" width="full" onClick={applyDate}>
            {copy.datePicker.primary}
          </Button>
        }
      >
        <DatePicker value={pickedDate} onChange={setPickedDate} min={today} labels={copy.datePicker} />
      </PortalDialog>
      <PortalDialog
        open={dialog === "time"}
        onOpenChange={(open) => setDialog(open ? "time" : null)}
        header="fit"
        title={copy.timePicker.title}
        description={fill(copy.timePicker.description, { timezone, date: formatFullDay(date || pickedDate) })}
        closeLabel={copy.timePicker.close}
        actions={
          <Button type="button" variant="confirm" size="portalPill" width="full" onClick={applyTime}>
            {fill(copy.timePicker.primary, { time: formatTime(pickedTime) })}
          </Button>
        }
      >
        <fieldset className="flex max-h-72 w-full flex-col gap-3 overflow-y-auto">
          <Text as="legend" variant="text14Semibold" tone="strong" className="sr-only">
            {copy.timePicker.legend}
          </Text>
          {slots.map((slot) => (
            <OptionRow key={slot} variant="choice" name="date-time" value={String(slot)} label={formatTime(slot)} checked={slot === pickedTime} onSelect={() => setPickedTime(slot)} />
          ))}
        </fieldset>
      </PortalDialog>
    </Workspace>
  );
}
