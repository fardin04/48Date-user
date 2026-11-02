import type { Destination, ScreenCode } from "@/lib/routes";
import type { IconName, ImageAsset } from "../types";

/** The sample members (mocks and prerendered pages). */
export const memberIds = ["wildflower", "goldenhour", "wildrose", "riverstone", "northpeak"] as const;

export type SampleMemberId = (typeof memberIds)[number];

export const isSampleMember = (id: string): id is SampleMemberId => memberIds.some((member) => member === id);

/**
 * A member's public id: a sample id with the mocks, the permanent nickname with the API (the
 * nickname is also the name members see).
 */
export type MemberId = string;

/** Nicknames as the API allows them (3–20, starts with a letter): a member URL segment must be one. */
export const memberIdPattern = /^[A-Za-z][A-Za-z0-9_.]{2,19}$/;

export type MeetPreference = "everyone" | "women" | "men";

/** Miles; "any" is no limit (the API's `maxDistanceKm: null`). */
export const distanceValues = ["5", "15", "30", "50", "any"] as const;

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

/** What a list shows of a member: matches, conversations, blocked members. */
export type MemberSummary = {
  id: MemberId;
  name: string;
  age: number | null;
  photo: ImageAsset;
  verified: boolean;
};

/** A member shown in discovery and matches (samples with the mocks, profiles with the API). */
export type Member = {
  id: MemberId;
  name: string;
  age: number;
  /** Used by the frontend filter mock only ("Who would you like to meet?"). */
  gender?: "woman" | "man";
  photo: ImageAsset;
  morePhotos: ImageAsset[];
  location: string;
  distance: string;
  /** Used by the frontend filter mock only. */
  distanceMiles?: number;
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
  /** Sample percentage; null where no score exists (the API has none: shared interests show instead). */
  compatibility: number | null;
  /** Interests the signed-in member shares with this one (API). */
  sharedInterests?: string[];
  trustScore: string;
};

export type NavItem = { label: string; icon: IconName; to: Destination };

export type StatusSummaryCopy = { icon: IconName; title: string; description: string };

/** An action whose page belongs to the member on screen (Plan a date → /dates/venues/<member>). */
export type MemberLink = { label: string; step: ScreenCode };

export type PortalScreenCopy = { title: string; description: string };

/** A discovery candidate: the overview card links to the full profile or to "Why we could click". */
export type DeckEntry = { member: MemberId; overview: "profile" | "compat" };
