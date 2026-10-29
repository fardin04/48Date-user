import type { Choice, DraftField, SelectOption } from "@/data/onboarding/types";
import type { OnboardingOptionsData } from "@/lib/api/types/onboarding";
import type { InterestOption, StepOptions } from "@/lib/onboarding/onboarding-service";

const fromValues = (list: { value: string; label: string }[] | undefined): SelectOption[] | undefined =>
  list?.map(({ value, label }) => ({ value, label }));

/** `GET /onboarding/options` → the select lists of the profile steps (keyed by draft field). */
export function toStepOptions(data: OnboardingOptionsData): StepOptions {
  const fields: Partial<Record<DraftField, SelectOption[]>> = {
    identity: fromValues(data.gender),
    meet: fromValues(data.interestedIn),
    smoking: fromValues(data.smoking),
    alcohol: fromValues(data.drinking),
    education: fromValues(data.educationLevels),
    religion: fromValues(data.religions),
    languages: data.languages?.map(({ code, label }) => ({ value: code, label })),
    occupation: data.occupations?.map((label) => ({ value: label, label })),
    goal: fromValues(data.lookingFor),
  };
  const interests: InterestOption[] = Object.values(data.interests ?? {}).flatMap((group) => group.map(({ id, key, label }) => ({ id, key, label })));
  return { fields, interests };
}

const normal = (text: string) => text.toLowerCase().replace(/[^a-z0-9]/g, "");

/**
 * The Figma interest cards with their API ids: a card matches an API interest by key or label;
 * cards the API doesn't offer are left out. When too few match, the API's own list is shown.
 */
export function interestChoices(cards: Choice[], available: InterestOption[] | undefined, fallbackIcon: Choice["icon"]): Choice[] {
  if (!available?.length) return cards;
  const matched = cards.flatMap((card) => {
    const found = available.find((item) => normal(item.key) === normal(card.value) || normal(item.label) === normal(card.title));
    return found ? [{ ...card, value: found.id }] : [];
  });
  if (matched.length >= 4) return matched;
  return available.map((item) => ({ value: item.id, icon: fallbackIcon, title: item.label, description: "" }));
}
