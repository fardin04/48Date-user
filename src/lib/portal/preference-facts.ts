import { distanceValues, type Fact, type Preferences } from "@/data/portal/types";
import { milesToKm } from "@/lib/portal/api-members";
import { getFiltersPage, getPortalShell } from "@/stores/portal-store";
import { fill } from "../format";

export type PreferenceFact = "location" | "distance" | "ageRange" | "interestedIn" | "verification";

/** Saved preferences as display facts, in the order a card lists them. */
export function preferenceFacts(preferences: Preferences, location: string, order: PreferenceFact[]): Fact[] {
  const shell = getPortalShell();
  const { fields } = getFiltersPage();
  const values: Record<PreferenceFact, string> = {
    location,
    distance: fields.distance.options.find((option) => option.value === preferences.distance)?.label ?? "",
    ageRange: fill(shell.ageRange, { min: preferences.minAge, max: preferences.maxAge }),
    interestedIn: fields.meet.options.find((option) => option.value === preferences.meet)?.label ?? "",
    verification: preferences.verifiedOnly ? shell.verification.on : shell.verification.off,
  };
  return order.map((key) => ({ label: shell.preferenceLabels[key], value: values[key] }));
}

/** Whole ages only ("25"), within the allowed limits (18–80); anything else is null. */
export function parseAge(value: string) {
  const { min, max } = getFiltersPage().ageLimits;
  if (!/^\d{1,3}$/.test(value.trim())) return null;
  const age = Number(value);
  return age >= min && age <= max ? age : null;
}

/** `maxDistanceKm` → the nearest distance option in miles ("any" for no limit). */
export function distanceFromKm(km: number | null): Preferences["distance"] {
  if (km === null) return "any";
  const options = distanceValues.filter((value) => value !== "any");
  return options.reduce((best, value) => (Math.abs(milesToKm(Number(value)) - km) < Math.abs(milesToKm(Number(best)) - km) ? value : best), options[0]);
}

/** A distance option → `maxDistanceKm` ("Any distance" is null: no limit). */
export const distanceToKm = (distance: Preferences["distance"]) => (distance === "any" ? null : milesToKm(Number(distance)));
