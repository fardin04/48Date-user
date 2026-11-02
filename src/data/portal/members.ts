import { to } from "@/lib/routes";
import type { Action, ImageAsset } from "../types";
import type { Fact, Member, SampleMemberId } from "./types";

const photo = (name: string, alt: string, height: number, width = 720): ImageAsset => ({ src: `/images/portal/${name}.webp`, alt, width, height });

const overviewFacts: Fact[] = [
  { label: "Height", value: "165 cm" },
  { label: "Occupation", value: "Product designer" },
  { label: "Smoking", value: "Doesn’t smoke" },
  { label: "Alcohol", value: "Occasionally" },
  { label: "Children", value: "Doesn’t have children" },
  { label: "Looking for", value: "A relationship" },
];

const aboutFacts: Fact[] = [
  { label: "Height", value: "165 cm" },
  { label: "Weight", value: "55 kg" },
  { label: "Smoking", value: "Doesn’t smoke" },
  { label: "Alcohol", value: "Occasionally" },
  { label: "Children", value: "Doesn’t have children" },
  { label: "Family plans", value: "Open to children" },
  { label: "Religion", value: "Muslim" },
  { label: "Occupation", value: "Product designer" },
  { label: "Education", value: "Bachelor of Arts" },
  { label: "Languages", value: "English · Hindi" },
  { label: "Looking for", value: "A real relationship" },
  { label: "Location", value: "San Francisco, US" },
];

/** Shared sample profile details (W04 draws every candidate with the same details). */
const sample = {
  location: "San Francisco",
  distance: "3 miles away",
  distanceMiles: 3,
  verified: true,
  cardInterests: ["Hiking", "Baking", "Trivia nights"],
  trustLine: "4.9 Excellent · Looking for a relationship",
  headline: "Looking for something real",
  tagline: "Photography. Coffee. Long walks.",
  bio: "Professional overthinker seeking someone who analyzes texts as much as I do. A little self-awareness, a lot of curiosity.",
  overviewFacts,
  aboutFacts,
  profileInterests: ["Running", "Gym", "Soccer", "Cricket", "Tennis", "Basketball"],
  interestsSummary: "Hiking · Coffee · Art",
  compatibility: 92,
  trustScore: "4.9",
};

/** Sample members from W04 — illustrative content, not production records. */
export const members: Record<SampleMemberId, Member> = {
  wildflower: {
    ...sample,
    id: "wildflower",
    name: "Wildflower",
    age: 27,
    gender: "woman",
    photo: photo("wildflower", "Wildflower in a straw hat and red sunglasses", 1080),
    morePhotos: [
      photo("wildflower-2", "Wildflower adjusting her sunglasses", 1024, 683),
      photo("wildflower-3", "Wildflower in an art studio", 1024, 683),
    ],
  },
  goldenhour: {
    ...sample,
    id: "goldenhour",
    name: "GoldenHour",
    age: 26,
    gender: "woman",
    bio: "Photography, good coffee and a little spontaneity. Looking for someone to turn a first hello into a real plan.",
    photo: photo("goldenhour", "GoldenHour smiling in a pink sweater", 1082),
    morePhotos: [],
  },
  wildrose: {
    ...sample,
    id: "wildrose",
    name: "WildRose",
    age: 25,
    gender: "woman",
    photo: photo("wildrose", "WildRose with dark wavy hair", 1100),
    morePhotos: [],
  },
  riverstone: {
    ...sample,
    id: "riverstone",
    name: "RiverStone",
    age: 28,
    gender: "man",
    photo: photo("riverstone", "RiverStone in a dark shirt", 960),
    morePhotos: [],
  },
  northpeak: {
    ...sample,
    id: "northpeak",
    name: "NorthPeak",
    age: 29,
    gender: "man",
    photo: photo("northpeak", "NorthPeak in a black jacket", 871),
    morePhotos: [],
  },
};

/**
 * How members from the API are described (design-silent; for owner approval). Values that come
 * as enums use the labels of `GET /onboarding/options`.
 */
export const memberCopy = {
  /** Shown when a member has no photo the app can display. */
  placeholder: { src: "/images/portal/member-placeholder.svg", alt: "", width: 720, height: 960 } satisfies ImageAsset,
  photoAlt: "Photo of {name}",
  morePhotoAlt: "Another photo of {name}",
  distance: { one: "1 mile away", many: "{miles} miles away", hidden: "Nearby" },
  location: { city: "{city}", unknown: "Location not shared" },
  /** `{value}` is the score ("4.9"), `{label}` its band ("Excellent"). */
  trust: "{value} {label}",
  trustLine: "{trust} · {lookingFor}",
  headline: "Getting to know {name}",
  missing: "Not shared",
  height: "{value} cm",
  weight: "{value} kg",
  kids: { yes: "Has children", no: "Doesn’t have children" },
  facts: {
    height: "Height",
    weight: "Weight",
    smoking: "Smoking",
    alcohol: "Alcohol",
    children: "Children",
    religion: "Religion",
    occupation: "Occupation",
    education: "Education",
    languages: "Languages",
    lookingFor: "Looking for",
    location: "Location",
  },
  /** A match without messages yet. */
  preview: "Say hello and make a plan.",
  /** `{count}` shared interests (shown instead of a compatibility score). */
  shared: { none: "No shared interests yet", some: "{count} shared interests", one: "1 shared interest" },
  /** A profile that is blocked, banned or deleted (`availability: UNAVAILABLE`). */
  unavailable: {
    title: "This profile isn’t available",
    description: "They may have paused or closed their account.",
    primary: { label: "Back to discovery", to: to("DISCOVER") } satisfies Action,
  },
};

/** The signed-in member's avatar in the web header (sample). */
export const memberAvatar: ImageAsset = photo("me", "Your profile", 1197);
