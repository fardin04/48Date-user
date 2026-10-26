import { to } from "@/lib/routes";
import { destinations } from "./destinations";
import { anchors } from "./landing/anchors";
import type { Action } from "./types";

export const brand = {
  name: "48Date",
  wordmark: { number: "48", word: "Date" },
  homeLabel: "48Date home",
  tagline: "A little spark. A real possibility.",
};

const sectionLinks: Action[] = [
  { label: "How it works", to: to("L02", anchors.howItWorks) },
  { label: "Features", to: to("L02", anchors.features) },
  { label: "Safety", to: to("L02", anchors.safety) },
  { label: "Membership", to: to("L02", anchors.membership) },
];

const login: Action = { label: "Log in", to: destinations.login };

export const nav = {
  label: "Main navigation",
  menuLabel: "Menu",
  home: to("L02"),
  links: sectionLinks,
  login,
  signup: { label: "Get started", to: destinations.signup, icon: "arrow-up-right-01" } satisfies Action,
};

export const footer = {
  label: "Footer",
  columns: [
    // `capitalize` renders the shared sentence-case labels in Figma's Title Case.
    { title: "Explore", capitalize: true, links: sectionLinks },
    {
      title: "Get Started",
      capitalize: false,
      links: [
        { label: "Create Your Profile", to: destinations.signup },
        { label: "Log In", to: destinations.login },
        { label: "Get the App", to: to("L02", anchors.download) },
      ],
    },
    {
      title: "Legal",
      capitalize: false,
      links: [
        { label: "Terms & Conditions", to: to("L02-TC") },
        { label: "Privacy Policy", to: to("L03") },
      ],
    },
  ],
  copyright: "© 2026 48Date",
  note: "Made for meaningful connections.",
};
