import type { SelectOption, SetupField } from "./types";

/** NICKNAME and its states NICK-CHECK and NICK-TAKEN. */
export const nicknameStep = {
  intro: { title: "Choose your nickname", description: "This is the name other members see. Make it unmistakably you." },
  field: { label: "Public nickname", placeholder: "Your nickname" },
  suggestionsLabel: "Suggested nicknames",
  suggestions: ["GoldenHour", "WildRose", "CityLights", "NorthPeak"],
  invalid: "Use 3–20 letters, numbers, underscores or dots, starting with a letter.",
  checking: {
    intro: { title: "Checking your nickname", description: "We’re checking availability before you continue." },
    note: "Checking availability…",
    primary: "Checking…",
  },
  taken: {
    intro: { title: "That nickname is taken", description: "Choose a different name so your profile stays easy to recognize." },
    message: "This nickname is already in use.",
    /** `{name}` is the recommended alternative ("Use CityLights"). */
    primary: "Use {name}",
  },
};

export const privateNameStep = {
  intro: { title: "Your private name", description: "Used for your account and verification. Other members see your nickname." },
  fields: [
    { key: "firstName", label: "First name (private)", type: "text", placeholder: "First name", autoComplete: "given-name" },
    { key: "lastName", label: "Last name (private)", type: "text", placeholder: "Last name", autoComplete: "family-name" },
  ] satisfies SetupField[],
};

/** `occupation` is free text (2–50 chars) on the API, so the value is the label itself. */
const occupations: SelectOption[] = ["Product designer", "Software engineer", "Teacher", "Healthcare", "Other"].map((label) => ({ value: label, label }));

/** BIRTHDAY and its states SELECT-OCCUPATION and AGE-GATE. */
export const birthdayStep = {
  intro: { title: "A little about you", description: "You must be 18 or older. Your profile shows your age, never your birthday." },
  dob: { key: "dob", label: "Date of birth" },
  occupation: {
    key: "occupation",
    label: "Occupation",
    placeholder: "Choose your occupation",
    options: occupations,
    dialog: {
      title: "Choose your occupation",
      description: "Choose the closest match. You can change this later.",
      closeLabel: "Close",
      confirm: "Use this occupation",
    },
  },
  minimumAge: 18,
  ageGate: {
    intro: { title: "48Date is for adults", description: "You need to be 18 or older to create an account." },
    figure: "18+",
    title: "A community for adults",
    description: "Check your date of birth if you entered it incorrectly.",
    primary: "Check my birthday",
    secondary: "Leave sign up",
  },
} as const;
