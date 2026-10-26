import { to } from "@/lib/routes";
import { destinations } from "../destinations";
import type { Action } from "../types";
import { anchors } from "./anchors";
import { images } from "./images";

export const hero = {
  eyebrow: "48 hours. One real possibility.",
  title: "Your next story\nstarts with *hello.*",
  description:
    "Discover people who share your interests, connect through a mutual match, and make the next 48 hours count. From the first message to a date you both choose, 48Date helps you take the next step.",
  primary: { label: "Find your connection", to: destinations.signup, icon: "arrow-up-right-01" } satisfies Action,
  secondary: { label: "See how it works", to: to("L02", anchors.howItWorks) } satisfies Action,
  background: { ...images.cafeCouple, alt: "" },
  collage: {
    label: "A connection taking shape",
    photos: [
      { image: { ...images.sunsetCouple, alt: "A couple enjoying the evening together" }, label: "Shared interests", title: "Art walks · Live music" },
      { image: { ...images.cafeCouple, alt: "A couple talking at an outdoor café" }, label: "The first plan", title: "Coffee this Saturday?" },
    ],
    quote: { lines: ["“I know a little café", "you might love.”"], caption: "A conversation becomes a plan." },
  },
  scrollCue: { label: "Explore the story", to: to("L02", anchors.howItWorks), icon: "arrow-down-01" } satisfies Action,
};
