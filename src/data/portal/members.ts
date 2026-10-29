import type { ImageAsset } from "../types";
import type { Fact, Member, MemberId } from "./types";

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
export const members: Record<MemberId, Member> = {
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

/** The signed-in member's avatar in the web header (sample). */
export const memberAvatar: ImageAsset = photo("me", "Your profile", 1197);
