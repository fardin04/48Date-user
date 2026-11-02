"use client";

import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { AreaMap } from "@/components/pieces/media/area-map";
import { ChoiceGroup } from "@/components/pieces/forms/choice-group";
import { OptionRow } from "@/components/pieces/forms/option-row";
import { SetupStep } from "@/components/pieces/shells/setup-step";
import { TextField } from "@/components/pieces/forms/text-field";
import type { Area } from "@/data/onboarding/types";
import { onboardingService } from "@/lib/onboarding/onboarding-service";
import { profileDraft } from "@/lib/onboarding/profile-draft";
import { screenKeys } from "@/lib/screen-keys";
import { useLoaded } from "@/hooks/use-loaded";
import { getLocationStep, getStepFlow } from "@/stores/onboarding-store";
import { SetupBack, SetupError, SetupPrimary, SetupTextAction, useSaveStep } from "./step-actions";

const GEO_TIMEOUT_MS = 10_000;
/** Area search runs once typing pauses. */
const SEARCH_DEBOUNCE_MS = 250;

type Phase = "ask" | "locating" | "denied" | "manual";

/**
 * LOCATION → LOC-DENIED / LOC-MANUAL → LOC-NORESULT. Location is requested only after the
 * member asks. The browser's position goes to the service rounded to about 1 km and is never
 * stored; the draft keeps only an approximate area label (handoff).
 */
export function LocationStep() {
  const copy = getLocationStep();
  const { save, saving, error } = useSaveStep("location");
  const name = useId();
  const [phase, setPhase] = useState<Phase>("ask");
  const [query, setQuery] = useState("");
  const [searched, setSearched] = useState("");
  const [chosenId, setChosenId] = useState<string | null>(null);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  // One cached search per text; an outdated search is cancelled when the text changes.
  const found = useLoaded(screenKeys.areas(searched), () => onboardingService.searchAreas(searched), { enabled: searched !== "" });
  const results: Area[] = searched && query.trim() !== "" ? (found.value ?? []) : [];
  const chosen = results.find((area) => area.id === chosenId) ?? results[0];
  const noResult = phase === "manual" && searched !== "" && searched === query.trim() && found.value?.length === 0;

  // A pending search never fires after the step is left.
  useEffect(() => () => clearTimeout(searchTimer.current), []);

  function locate() {
    if (!("geolocation" in navigator)) {
      setPhase("manual");
      return;
    }
    setPhase("locating");
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        profileDraft.update((draft) => ({ ...draft, area: { label: copy.currentAreaLabel, source: "device" } }));
        const { latitude, longitude } = position.coords;
        await save({ location: { latitude, longitude, permission: true } });
        setPhase("ask");
      },
      (geoError) => setPhase(geoError.code === geoError.PERMISSION_DENIED ? "denied" : "manual"),
      { enableHighAccuracy: false, maximumAge: Infinity, timeout: GEO_TIMEOUT_MS },
    );
  }

  function search(value: string) {
    setQuery(value);
    clearTimeout(searchTimer.current);
    // Searched once typing pauses; the same text is answered from the query cache.
    searchTimer.current = setTimeout(() => setSearched(value.trim()), SEARCH_DEBOUNCE_MS);
  }

  function resetSearch() {
    clearTimeout(searchTimer.current);
    setQuery("");
    setSearched("");
  }

  function confirmArea(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!chosen || saving) return;
    profileDraft.update((draft) => ({ ...draft, area: { label: chosen.label, source: "manual" } }));
    const [latitude, longitude] = chosen.center;
    void save({ location: { latitude, longitude, city: chosen.name, countryCode: chosen.countryCode, permission: false } });
  }

  if (phase === "denied") {
    return (
      <SetupStep
        intro={copy.denied.intro}
        back={<SetupBack onClick={() => setPhase("ask")} />}
        primary={<SetupPrimary label={copy.denied.primary} onClick={() => setPhase("manual")} />}
        secondary={<SetupTextAction label={copy.denied.secondary} onClick={() => setPhase("ask")} />}
      >
        <AreaMap map={copy.map} />
      </SetupStep>
    );
  }

  if (noResult) {
    return (
      <SetupStep
        intro={copy.noResult.intro}
        onSubmit={(event) => {
          event.preventDefault();
          resetSearch();
        }}
        back={<SetupBack onClick={resetSearch} />}
        primary={<SetupPrimary label={copy.noResult.primary} />}
      >
        <TextField
          label={copy.noResult.field.label}
          value={query}
          onChange={(value) => void search(value)}
          placeholder={copy.manual.field.placeholder}
          state="error"
          message={copy.noResult.message}
          autoComplete="address-level2"
        />
      </SetupStep>
    );
  }

  if (phase === "manual") {
    return (
      <SetupStep
        intro={copy.manual.intro}
        onSubmit={confirmArea}
        back={<SetupBack onClick={() => setPhase("ask")} />}
        primary={<SetupPrimary label={chosen ? copy.manual.primary.replace("{area}", chosen.name) : copy.manual.primaryEmpty} disabled={!chosen} busy={saving} />}
        busy={saving}
        secondary={<SetupTextAction label={copy.manual.secondary} onClick={locate} />}
      >
        <TextField
          label={copy.manual.field.label}
          value={query}
          onChange={(value) => void search(value)}
          placeholder={copy.manual.field.placeholder}
          autoComplete="address-level2"
        />
        {results.length > 0 && (
          <ChoiceGroup legend={copy.manual.resultsLabel} layout="list">
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
        <SetupError message={error} />
      </SetupStep>
    );
  }

  const locating = phase === "locating" || saving;
  return (
    <SetupStep
      intro={copy.ask.intro}
      align="center"
      headerAlign="center"
      busy={locating}
      back={<SetupBack link={getStepFlow("location").back} />}
      primary={<SetupPrimary label={locating ? copy.ask.locating : copy.ask.primary} busy={locating} onClick={locate} />}
      secondary={<SetupTextAction label={copy.ask.secondary} onClick={() => setPhase("manual")} />}
      revealDelay={0}
    >
      <AreaMap map={copy.map} align="center" />
      <SetupError message={error} />
    </SetupStep>
  );
}
