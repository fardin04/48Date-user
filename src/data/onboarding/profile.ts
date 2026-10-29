import type { SelectOption, SetupField, SetupIntro } from "./types";

/**
 * Option values are the API's case-sensitive enums (Postman `PUT /onboarding/steps/*`), so the draft
 * maps straight onto each step's body; labels are the Figma copy. With the API on, the lists come
 * from `GET /onboarding/options` instead (see lib/onboarding/options.ts).
 */
const options = (...pairs: [value: string, label: string][]): SelectOption[] => pairs.map(([value, label]) => ({ value, label }));
const range = (from: number, to: number, unit: string) =>
  Array.from({ length: to - from + 1 }, (_, index) => ({ value: String(from + index), label: `${from + index} ${unit}` }));

const choose = "Select an option";

/** IDENTITY, LIFESTYLE and DETAILS: labelled select fields. */
export const profileSteps = {
  identity: {
    intro: { title: "Who would you like to meet?", description: "Your identity and preferences help personalize your matches." },
    fields: [
      {
        key: "identity",
        label: "I identify as",
        type: "select",
        placeholder: choose,
        // The API has no non-binary value (WOMAN, MAN, PREFER_NOT_TO_SAY); with the API on its own labels show.
        options: options(["WOMAN", "Woman"], ["MAN", "Man"], ["PREFER_NOT_TO_SAY", "Non-binary"]),
      },
      { key: "meet", label: "I’d like to meet", type: "select", placeholder: choose, options: options(["WOMEN", "Women"], ["MEN", "Men"], ["EVERYONE", "Everyone"]) },
    ],
  },
  lifestyle: {
    intro: { title: "Your lifestyle", description: "A few everyday details help us find people who fit your life." },
    fields: [
      {
        key: "smoking",
        label: "Smoking",
        type: "select",
        placeholder: choose,
        options: options(["NEVER", "I don’t smoke"], ["OCCASIONALLY", "Occasionally"], ["REGULARLY", "Regularly"]),
      },
      { key: "alcohol", label: "Alcohol", type: "select", placeholder: choose, options: options(["NEVER", "Never"], ["SOCIALLY", "Socially"], ["REGULARLY", "Regularly"]) },
      // `kids` takes two booleans (hasKids, wantsKids); /onboarding/options has no list for them.
      { key: "children", label: "Children", type: "select", placeholder: choose, options: options(["false", "I don’t have children"], ["true", "I have children"]) },
      {
        key: "familyPlans",
        label: "Family plans",
        type: "select",
        placeholder: choose,
        options: options(["true", "Open to children"], ["true:want", "Want children"], ["false", "Don’t want children"], ["false:unsure", "Not sure yet"]),
      },
    ],
  },
  details: {
    intro: { title: "Your profile details", description: "Add the details you’re comfortable sharing." },
    fields: [
      // API ranges: 120–230 cm and 30–250 kg.
      { key: "height", label: "Height", type: "select", placeholder: choose, options: range(140, 210, "cm"), row: "body" },
      { key: "weight", label: "Weight", type: "select", placeholder: choose, options: range(40, 150, "kg"), row: "body" },
      {
        key: "education",
        label: "Education",
        type: "select",
        placeholder: choose,
        options: options(
          ["HIGH_SCHOOL", "High school"],
          ["DIPLOMA", "Some college"],
          ["BACHELORS", "Bachelor’s degree"],
          ["MASTERS", "Master’s degree"],
          ["DOCTORATE", "Doctorate"],
          ["OTHER", "Other"],
        ),
      },
      {
        key: "religion",
        label: "Religion (optional)",
        type: "select",
        placeholder: choose,
        optional: true,
        options: options(
          ["BUDDHISM", "Buddhist"],
          ["CHRISTIANITY", "Christian"],
          ["HINDUISM", "Hindu"],
          ["JUDAISM", "Jewish"],
          ["ISLAM", "Muslim"],
          ["SIKHISM", "Sikh"],
          ["NOT_RELIGIOUS", "Not religious"],
          ["OTHER", "Other"],
        ),
      },
      {
        key: "languages",
        label: "Languages",
        type: "select",
        placeholder: choose,
        // Comma-separated ISO codes → `languageCodes` (1–5); a multi-select isn't designed yet.
        options: options(["en", "English"], ["en,hi", "English · Hindi"], ["en,bn", "English · Bengali"], ["en,es", "English · Spanish"], ["en,fr", "English · French"]),
      },
    ],
  },
} satisfies Record<string, { intro: SetupIntro; fields: SetupField[] }>;
