"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { ActionRow } from "@/components/pieces/actions/action-row";
import { ChoiceGroup } from "@/components/pieces/forms/choice-group";
import { FormHeader } from "@/components/pieces/forms/form-header";
import { OptionRow } from "@/components/pieces/forms/option-row";
import { OrDivider } from "@/components/pieces/forms/or-divider";
import { PortalBack } from "@/components/pieces/actions/portal-back";
import { StatusNote } from "@/components/pieces/feedback/status-note";
import { SummaryRow } from "@/components/pieces/cards/summary-row";
import { TextField } from "@/components/pieces/forms/text-field";
import { Button } from "@/components/ui/button";
import type { Area } from "@/data/onboarding/types";
import { useLoaded } from "@/hooks/use-loaded";
import { fill } from "@/lib/format";
import { accountService, type LocationChoice } from "@/lib/portal/account-service";
import { screenKeys } from "@/lib/screen-keys";
import { getAccountPage } from "@/stores/portal-store";
import { ProfileContext } from "@/components/sections/portal/profile/profile-context";
import { Workspace } from "@/components/sections/portal/shared/workspace";

const GEO_TIMEOUT_MS = 10_000;
/** Area search runs once typing pauses. */
const SEARCH_DEBOUNCE_MS = 250;

type Note = { variant: "success" | "notice" | "alert"; message: string };

/**
 * SETTINGS-LOCATION (design-silent): the member's approximate area, changed from the device's
 * position (asked only from the click, rounded before it is sent, never kept) or from the area
 * list. Saved through `accountService.saveLocation`; the page stays open with the result.
 */
export function LocationView() {
  const page = getAccountPage().location;
  const queryClient = useQueryClient();
  const name = useId();
  const current = useLoaded(screenKeys.location, accountService.getLocation);
  const [query, setQuery] = useState("");
  const [searched, setSearched] = useState("");
  const [chosenId, setChosenId] = useState<string | null>(null);
  const [busy, setBusy] = useState<"device" | "area" | null>(null);
  const [note, setNote] = useState<Note | null>(null);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const found = useLoaded(screenKeys.locationAreas(searched), () => accountService.searchAreas(searched), { enabled: searched !== "" });
  const results: Area[] = searched && query.trim() !== "" ? (found.value ?? []) : [];
  const chosen = results.find((area) => area.id === chosenId) ?? results[0];
  const noResult = searched !== "" && searched === query.trim() && found.value?.length === 0;

  // A pending search never fires after the page is left.
  useEffect(() => () => clearTimeout(searchTimer.current), []);

  function search(value: string) {
    setQuery(value);
    setNote(null);
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => setSearched(value.trim()), SEARCH_DEBOUNCE_MS);
  }

  async function save(choice: LocationChoice) {
    setBusy(choice.kind);
    setNote(null);
    try {
      const area = await accountService.saveLocation(choice);
      queryClient.setQueryData(screenKeys.location, area);
      void queryClient.invalidateQueries({ queryKey: screenKeys.overview });
      setNote({ variant: "success", message: fill(page.saved, { area }) });
      setQuery("");
      setSearched("");
    } catch (error) {
      setNote({ variant: "alert", message: error instanceof Error && error.message ? error.message : page.failed });
    }
    setBusy(null);
  }

  function useDevice() {
    if (busy) return;
    if (!("geolocation" in navigator)) {
      setNote({ variant: "notice", message: page.unavailable });
      return;
    }
    setBusy("device");
    setNote(null);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => void save({ kind: "device", latitude: coords.latitude, longitude: coords.longitude }),
      (geoError) => {
        setBusy(null);
        setNote({ variant: "notice", message: geoError.code === geoError.PERMISSION_DENIED ? page.denied : page.unavailable });
      },
      { enableHighAccuracy: false, maximumAge: Infinity, timeout: GEO_TIMEOUT_MS },
    );
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    if (chosen && !busy) void save({ kind: "area", area: chosen });
  }

  const currentValue = current.value === undefined ? "" : (current.value ?? page.none);

  return (
    <Workspace aside={<ProfileContext />}>
      <PortalBack action={page.back} />
      <form onSubmit={submit} noValidate aria-busy={busy !== null || undefined} className="flex w-full flex-col gap-5">
        <FormHeader variant="portalStatus" title={page.title} description={page.description} />
        <dl>
          <SummaryRow label={page.currentLabel} value={currentValue} />
        </dl>
        <Button type="button" variant="roseOutline" size="portalPill" width="full" disabled={busy !== null} aria-busy={busy === "device" || undefined} onClick={useDevice}>
          {busy === "device" ? page.locating : page.device}
        </Button>
        <OrDivider label={page.or} />
        <TextField
          label={page.field.label}
          value={query}
          onChange={search}
          placeholder={page.field.placeholder}
          state={noResult ? "error" : "default"}
          message={noResult ? page.noResult : undefined}
          autoComplete="address-level2"
        />
        {results.length > 0 && (
          <ChoiceGroup legend={page.resultsLabel} layout="list">
            {results.map((area) => (
              <OptionRow
                key={area.id}
                variant="area"
                name={name}
                value={area.id}
                label={area.label}
                meta={area.region}
                checked={area.id === chosen?.id}
                onSelect={() => setChosenId(area.id)}
              />
            ))}
          </ChoiceGroup>
        )}
        {note && <StatusNote variant={note.variant} message={note.message} />}
        {chosen && (
          <ActionRow>
            <Button type="submit" variant="confirm" size="portalPill" width="actionSlot" disabled={busy !== null} aria-busy={busy === "area" || undefined}>
              {busy === "area" ? page.saving : fill(page.save, { area: chosen.name })}
            </Button>
          </ActionRow>
        )}
      </form>
    </Workspace>
  );
}
