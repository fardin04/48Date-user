import { destinations } from "../destinations";
import type { Action, IconItem, Intro } from "../types";

/** Plan names, prices and billing come from the account subscription catalog, not this page (handoff note 05). */
export const membership = {
  intro: {
    eyebrow: "Membership",
    title: "Make more room for connection.",
    description: "Start with your profile, then choose Premium when you want more freedom to chat, explore and plan.",
  } satisfies Intro,
  cta: { label: "Create your profile", to: destinations.signup, icon: "arrow-up-right-01" } satisfies Action,
  card: {
    badge: "PREMIUM",
    title: "Your account, with more room to explore.",
    benefits: [
      { icon: "tick-02", title: "Unlimited chats and dates", description: "Keep conversations and plans moving." },
      { icon: "tick-02", title: "Advanced preferences", description: "Fine-tune what matters to you." },
      { icon: "tick-02", title: "AI conversation help", description: "Find a starting point when you want one." },
    ] satisfies IconItem[],
    note: "View current plans and billing details inside your account.",
  },
};
