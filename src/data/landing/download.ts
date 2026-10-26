import { destinations } from "../destinations";
import type { Action, ImageAsset, Intro } from "../types";
import { images } from "./images";

export type StoreBadge = { label: string; to: Action["to"]; image: ImageAsset };

export const download = {
  intro: {
    eyebrow: "TAKE THE NEXT HELLO WITH YOU",
    title: "Good connections go with you.",
    description: "Discover, chat and make plans—from wherever life takes you.",
  } satisfies Intro,
  badges: [
    { label: "Download on the App Store", to: destinations.appStore, image: { src: "/badges/app-store.svg", alt: "", width: 180, height: 60 } },
    { label: "Get it on Google Play", to: destinations.googlePlay, image: { src: "/badges/google-play.svg", alt: "", width: 204, height: 60 } },
  ] satisfies StoreBadge[],
  browser: { label: "Or continue in your browser →", to: destinations.signup } satisfies Action,
  /** Native screens are illustrative (handoff note 09). */
  phones: [images.phoneDiscover, images.phoneChat, images.phonePlanner],
};
