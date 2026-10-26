import type { IconItem, Intro } from "../types";
import { images } from "./images";

export const safety = {
  intro: {
    eyebrow: "Safety & control",
    title: "Connect at your own pace.",
    description: "Look for verification signals, review your privacy settings and use report or block controls when you need them.",
  } satisfies Intro,
  image: images.verifiedMember,
  verified: { icon: "shield-01", title: "Profile verified", description: "A visible signal on the profile" } satisfies IconItem,
  controls: { eyebrow: "YOUR CONTROLS", title: "Privacy settings", items: ["Report profile", "Block connection"] },
  items: [
    { icon: "shield-01", title: "Profile verification", description: "Look for verification signals as you browse." },
    { icon: "square-lock-02", title: "Privacy controls", description: "Review what you share and how people find you." },
    { icon: "shield-01", title: "Reporting and blocking", description: "Use account controls whenever you need them." },
  ] satisfies IconItem[],
};
