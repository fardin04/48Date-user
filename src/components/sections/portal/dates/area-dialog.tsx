"use client";

import { useEffect, useId, useRef, useState } from "react";
import { ChoiceGroup } from "@/components/pieces/forms/choice-group";
import { OptionRow } from "@/components/pieces/forms/option-row";
import { OrDivider } from "@/components/pieces/forms/or-divider";
import { PortalDialog } from "@/components/pieces/overlays/portal-dialog";
import { StatusNote } from "@/components/pieces/feedback/status-note";
import { TextField } from "@/components/pieces/forms/text-field";
import { Button } from "@/components/ui/button";
import { useLoaded } from "@/hooks/use-loaded";
import { fill } from "@/lib/format";
import { areaFromPosition, toDateArea, type DateArea } from "@/lib/portal/date-area";
import { dateService, type DatePlan } from "@/lib/portal/date-service";
import { screenKeys } from "@/lib/screen-keys";
import { getDatePage } from "@/stores/portal-store";

const GEO_TIMEOUT_MS = 10_000;
const SEARCH_DEBOUNCE_MS = 250;

type AreaDialogProps = {
  plan: DatePlan;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The plan with its new area. */
  onSaved: (plan: DatePlan) => void;
};

/**
 * VENUES-AREA (rule 55): picks the area of this date only — an area from the starter list, or the
 * device's area from a click (rounded, never stored). Saved in the plan draft through `dateService`.
 */
export function AreaDialog({ plan, open, onOpenChange, onSaved }: AreaDialogProps) {
  const copy = getDatePage().venues.area.dialog;
  const name = useId();
  const [query, setQuery] = useState("");
  const [searched, setSearched] = useState("");
  const [chosenId, setChosenId] = useState<string | null>(null);
  const [busy, setBusy] = useState<"device" | "save" | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const found = useLoaded(screenKeys.dateAreas(searched), () => dateService.searchAreas(searched), { enabled: searched !== "" });
  const results = searched && query.trim() !== "" ? (found.value ?? []) : [];
  const chosen = results.find((area) => area.id === chosenId) ?? results[0];
  const noResult = searched !== "" && searched === query.trim() && found.value?.length === 0;

  useEffect(() => () => clearTimeout(timer.current), []);

  function search(value: string) {
    setQuery(value);
    setNote(null);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setSearched(value.trim()), SEARCH_DEBOUNCE_MS);
  }

  async function save(area: DateArea | null, kind: "device" | "save") {
    setBusy(kind);
    try {
      onSaved(await dateService.setPlanArea(plan.member, area));
      setQuery("");
      setSearched("");
      onOpenChange(false);
    } catch {
      setNote(getDatePage().failed);
    }
    setBusy(null);
  }

  function useDevice() {
    if (busy) return;
    if (!("geolocation" in navigator)) return setNote(copy.unavailable);
    setBusy("device");
    setNote(null);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => void save(areaFromPosition(coords.latitude, coords.longitude, copy.nearYou), "device"),
      (error) => {
        setBusy(null);
        setNote(error.code === error.PERMISSION_DENIED ? copy.denied : copy.unavailable);
      },
      { enableHighAccuracy: false, maximumAge: Infinity, timeout: GEO_TIMEOUT_MS },
    );
  }

  return (
    <PortalDialog
      open={open}
      onOpenChange={onOpenChange}
      header="fit"
      title={copy.title}
      description={copy.description}
      closeLabel={copy.close}
      actions={
        <>
          <Button type="button" variant="confirm" size="portalPill" width="full" disabled={!chosen || busy !== null} aria-busy={busy === "save" || undefined} onClick={() => chosen && void save(toDateArea(chosen), "save")}>
            {fill(copy.confirm, { area: chosen?.name ?? "" })}
          </Button>
          {plan.area && (
            <Button type="button" variant="roseOutline" size="portalPill" width="full" disabled={busy !== null} onClick={() => void save(null, "save")}>
              {copy.shared}
            </Button>
          )}
        </>
      }
    >
      <Button type="button" variant="roseOutline" size="portalPill" width="full" disabled={busy !== null} aria-busy={busy === "device" || undefined} onClick={useDevice}>
        {busy === "device" ? copy.locating : copy.device}
      </Button>
      <OrDivider label={copy.or} />
      <TextField
        label={copy.field.label}
        value={query}
        onChange={search}
        placeholder={copy.field.placeholder}
        state={noResult ? "error" : "default"}
        message={noResult ? copy.noResult : undefined}
        autoComplete="off"
      />
      {results.length > 0 && (
        <ChoiceGroup legend={copy.resultsLabel} layout="list">
          {results.map((area) => (
            <OptionRow key={area.id} variant="area" name={name} value={area.id} label={area.label} meta={area.region} checked={area.id === chosen?.id} onSelect={() => setChosenId(area.id)} />
          ))}
        </ChoiceGroup>
      )}
      {note && <StatusNote variant="notice" message={note} />}
    </PortalDialog>
  );
}
