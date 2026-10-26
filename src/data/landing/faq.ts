import type { Intro } from "../types";

export type FaqEntry = { question: string; answer: string };

export const faq = {
  intro: {
    eyebrow: "Before your first hello",
    title: "A little\n*clarity.*",
    description: "The things you might be wondering.",
  } satisfies Intro,
  /** Figma shows the first row open; multiple rows may stay open. */
  defaultOpen: [0],
  entries: [
    {
      question: "What makes 48Date different?",
      answer:
        "48Date brings compatibility-led discovery, a focused 48-hour match window, conversation help and date planning into one connected experience.",
    },
    // Figma has no answer overrides for the rows below; this copy reuses the page's own statements and awaits approval.
    {
      question: "How does the 48-hour match window work?",
      answer:
        "When the feeling is mutual, your 48-hour match window begins. It gives you a moment to make the first move: say hello, explore what you share and see where the conversation takes you.",
    },
    {
      question: "Can I use 48Date in my browser?",
      answer: "Yes. You can continue in your browser, or download the app from the App Store or Google Play.",
    },
    {
      question: "Do I need Premium?",
      answer:
        "No. Start with your profile, then choose Premium when you want more freedom to chat, explore and plan. View current plans and billing details inside your account.",
    },
    {
      question: "How can I manage my privacy?",
      answer:
        "Review your privacy settings to choose what you share and how people find you, and use report or block controls whenever you need them.",
    },
  ] satisfies FaqEntry[],
};
