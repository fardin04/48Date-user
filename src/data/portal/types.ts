import type { Destination, ScreenCode } from "@/lib/routes";
import type { IconName, ImageAsset } from "../types";

export const memberIds = ["wildflower", "goldenhour", "wildrose", "riverstone", "northpeak"] as const;

export type MemberId = (typeof memberIds)[number];

export type MeetPreference = "everyone" | "women" | "men";

export const distanceValues = ["5", "15", "30", "50"] as const;

export type DistancePreference = (typeof distanceValues)[number];

/** FILTERS answers ("Who would you like to meet?", distance, age range, two checkboxes). */
export type Preferences = {
  meet: MeetPreference;
  distance: DistancePreference;
  minAge: number;
  maxAge: number;
  verifiedOnly: boolean;
  sharedInterest: boolean;
};

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

/** An action whose page belongs to the member on screen (Plan a date → /dates/venues/<member>). */
export type MemberLink = { label: string; step: ScreenCode };

export type PortalScreenCopy = { title: string; description: string };

/** A discovery candidate: the overview card links to the full profile or to "Why we could click". */
export type DeckEntry = { member: MemberId; overview: "profile" | "compat" };
