import { destinations } from "../destinations";
import type { Action, Intro } from "../types";

export const finalCta = {
  intro: {
    eyebrow: "Ready when you are",
    title: "Make time for\na real hello.",
    description: "Your next connection can start with one small step.",
  } satisfies Intro,
  cta: { label: "Start your story", to: destinations.signup, icon: "arrow-up-right-01" } satisfies Action,
};
