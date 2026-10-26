import type { SelectOption, SetupField, SetupIntro } from "./types";

const options = (...labels: string[]): SelectOption[] => labels.map((label) => ({ value: label, label }));
const range = (from: number, to: number, step: number, unit: string) =>
  options(...Array.from({ length: Math.floor((to - from) / step) + 1 }, (_, index) => `${from + index * step} ${unit}`));

const choose = "Select an option";

/** IDENTITY, LIFESTYLE and DETAILS: labelled select fields. */
export const profileSteps = {
  identity: {
    intro: { title: "Who would you like to meet?", description: "Your identity and preferences help personalize your matches." },
    fields: [
      { key: "identity", label: "I identify as", type: "select", placeholder: choose, options: options("Woman", "Man", "Non-binary") },
      { key: "meet", label: "I’d like to meet", type: "select", placeholder: choose, options: options("Women", "Men", "Everyone") },
    ],
  },
  lifestyle: {
    intro: { title: "Your lifestyle", description: "A few everyday details help us find people who fit your life." },
    fields: [
      { key: "smoking", label: "Smoking", type: "select", placeholder: choose, options: options("I don’t smoke", "Occasionally", "Regularly") },
      { key: "alcohol", label: "Alcohol", type: "select", placeholder: choose, options: options("Never", "Occasionally", "Socially", "Regularly") },
      { key: "children", label: "Children", type: "select", placeholder: choose, options: options("I don’t have children", "I have children") },
      {
        key: "familyPlans",
        label: "Family plans",
        type: "select",
        placeholder: choose,
        options: options("Open to children", "Want children", "Don’t want children", "Not sure yet"),
      },
    ],
  },
  details: {
    intro: { title: "Your profile details", description: "Add the details you’re comfortable sharing." },
    fields: [
      { key: "height", label: "Height", type: "select", placeholder: choose, options: range(140, 210, 1, "cm"), row: "body" },
      { key: "weight", label: "Weight", type: "select", placeholder: choose, options: range(40, 150, 1, "kg"), row: "body" },
      {
        key: "education",
        label: "Education",
        type: "select",
        placeholder: choose,
        options: options("High school", "Some college", "Bachelor of Arts", "Bachelor of Science", "Master’s degree", "Doctorate", "Other"),
      },
      {
        key: "religion",
        label: "Religion (optional)",
        type: "select",
        placeholder: choose,
        optional: true,
        options: options("Prefer not to say", "Buddhist", "Christian", "Hindu", "Jewish", "Muslim", "Spiritual", "Not religious", "Other"),
      },
      {
        key: "languages",
        label: "Languages",
        type: "select",
        placeholder: choose,
        options: options("English", "English · Hindi", "English · Bengali", "English · Spanish", "English · French", "Other"),
      },
    ],
  },
} satisfies Record<string, { intro: SetupIntro; fields: SetupField[] }>;
