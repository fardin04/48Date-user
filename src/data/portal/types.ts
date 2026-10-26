import type { Destination } from "@/lib/routes";
import type { IconName, ImageAsset } from "../types";

export type MemberId = "wildflower" | "goldenhour" | "wildrose" | "riverstone";

export type Fact = { label: string; value: string };

/** A sample member shown in discovery and matches (illustrative, not production records). */
export type Member = {
  id: MemberId;
  name: string;
  age: number;
  /** Used by the frontend filter mock ("Who would you like to meet?"). */
  gender: "woman" | "man";
  photo: ImageAsset;
  morePhotos: ImageAsset[];
  location: string;
  distance: string;
  distanceMiles: number;
  verified: boolean;
  /** Interest pills on the swipe card. */
  cardInterests: string[];
  trustLine: string;
  headline: string;
  tagline: string;
  bio: string;
  /** Six facts on the discovery overview card. */
  overviewFacts: Fact[];
  /** Full "About me" grid on the profile page. */
  aboutFacts: Fact[];
  profileInterests: string[];
  interestsSummary: string;
  compatibility: number;
  trustScore: string;
};

export type NavItem = { label: string; icon: IconName; to: Destination };

export type StatusSummaryCopy = { icon: IconName; title: string; description: string };

export type PortalScreenCopy = { title: string; description: string };
