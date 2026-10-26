import type { IconName, Intro } from "../types";
import { images } from "./images";

export type FeatureCopy = { icon: IconName; eyebrow: string; title: string; description: string };

/** Product illustrations: nothing here sends a message or books a date (handoff note 03). */
export const features = {
  intro: {
    eyebrow: "Features",
    title: "From finding your person to planning your first date.",
    description:
      "Explore connections through shared interests, find a starting point for conversation, and discover date ideas you can choose together.",
  } satisfies Intro,
  matching: {
    copy: {
      icon: "sparkles",
      eyebrow: "AI Compatibility Matching",
      title: "More context than a profile picture.",
      description: "Discover profiles through your interests and preferences, with useful context for starting a connection.",
    } satisfies FeatureCopy,
    profile: {
      image: images.maya,
      fit: { title: "Great fit", detail: "Photography · Coffee · City walks" },
      eyebrow: "WHY YOU MAY CONNECT",
      name: "Maya, 26",
      reason: "You both make time for creative weekends and know the best conversations rarely need a perfect opening.",
      interests: ["Film photography", "Live music", "Sunday coffee"],
    },
  },
  conversation: {
    copy: {
      icon: "message-01",
      eyebrow: "AI Conversation Assistant",
      title: "A first message that still sounds like you.",
      description: "Get help finding an opening message, then make it sound like you.",
    } satisfies FeatureCopy,
    suggestion: {
      avatar: images.avatar,
      context: "You both love photography and good coffee.",
      message: "“What’s one place you’d love to photograph over coffee?”",
      alternative: "Make it more casual",
      accept: "Use this idea →",
    },
  },
  planner: {
    copy: {
      icon: "calendar-03",
      eyebrow: "AI Date Planner",
      title: "Less “where should we go?”",
      description: "Explore venue suggestions and choose a date plan together.",
    } satisfies FeatureCopy,
    venue: {
      map: images.map,
      eyebrow: "SUGGESTED FOR YOU",
      name: "Little Fern Café",
      time: "Saturday · 6:30 PM",
      location: { icon: "location-01" as IconName, label: "Public café · 1.2 miles away" },
      cta: "Choose together",
    },
  },
};
