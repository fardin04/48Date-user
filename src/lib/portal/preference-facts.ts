import type { Fact, Preferences } from "@/data/portal/types";
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
