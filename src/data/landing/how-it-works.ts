import type { IconName, ImageAsset, Intro } from "../types";
import { images } from "./images";

export type Step = {
  number: string;
  title: string;
  description: string;
  image: ImageAsset;
  status: { icon: IconName; label: string };
};

export const howItWorks = {
  intro: {
    eyebrow: "How it works",
    title: "From a first look to a first plan.",
    description: "Three thoughtful steps make room for a connection to grow naturally.",
  } satisfies Intro,
  steps: [
    {
      number: "01",
      title: "Create a profile that feels like you.",
      description: "Share your photos, interests and a little about yourself so potential connections can discover more than a picture.",
      image: images.womanPhone,
      status: { icon: "tick-02", label: "Profile 72% complete" },
    },
    {
      number: "02",
      title: "Find a mutual connection.",
      description: "Discover people who catch your interest. When the feeling is mutual, your 48-hour match window begins.",
      image: images.sunsetCouple,
      status: { icon: "favourite", label: "It’s a match · 48:00" },
    },
    {
      number: "03",
      title: "Turn a conversation into a plan.",
      description: "Break the ice, explore a date idea and choose a time and public place together.",
      image: images.cafeCouple,
      status: { icon: "calendar-03", label: "Saturday · 6:30 PM" },
    },
  ] satisfies Step[],
};
