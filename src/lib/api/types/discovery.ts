import type { Drinking, EducationLevel, InterestedIn, LookingFor, Religion, Smoking } from "./onboarding";

/** User / 03 - Auto-Matching, 05 - Discovery Runs, 06 - Discovery Cards & Swipes. Enums are case-sensitive. */

export type Availability = "ACTIVE" | "UNAVAILABLE";

export type InterestTag = { id: string; label: string; icon?: string };

export type TrustBadge = { value: number; label: string };

export type DiscoveryPreferences = {
  interestedIn: InterestedIn;
  ageMin: number;
  ageMax: number;
  ageExpand: boolean;
  /** null is "No limit". */
  maxDistanceKm: number | null;
  interestsExpand: boolean;
  verifiedOnly: boolean;
  interests: InterestTag[];
  allowedRanges: { minAge: number; maxAge: number; maxDistanceKm: number; maxInterests: number };
};

/** `PUT /discovery/preferences`: every field optional. */
export type DiscoveryPreferencesBody = Partial<{
  ageMin: number;
  ageMax: number;
  ageExpand: boolean;
  maxDistanceKm: number | null;
  interestsExpand: boolean;
  verifiedOnly: boolean;
  interestIds: string[];
  interestedIn: InterestedIn;
}>;

export type RunStatus = "QUEUED" | "RUNNING" | "COMPLETED" | "FAILED" | "CANCELLED";

export type DiscoveryRun = {
  id: string;
  runType: "DECK" | "AUTO_MATCH";
  status: RunStatus;
  stage: string | null;
  progressPercent: number;
  totalCandidates: number | null;
  cardsReady?: number;
  matchesCreated: number | { id: string; matchedUserId: string; source: string }[];
  createdAt: string;
  expiresAt?: string | null;
};

export type StartRunData = { run: DiscoveryRun; reused: boolean; eventsUrl: string };

export type UpdatePreferencesData = { preferences: DiscoveryPreferences; run: DiscoveryRun };

export type DeckCard = {
  id: string;
  availability: Availability;
  nickname: string;
  age: number;
  mainPhotoUrl: string | null;
  isVerified: boolean;
  distanceKm: number | null;
  photos: { url: string; position: number }[];
  interests: InterestTag[];
  trustScore: TrustBadge | null;
};

export type DeckCardsData = { cards: DeckCard[]; meta: { nextCursor: string | null; hasMore: boolean } };

export type DiscoveryProfile =
  | {
      id: string;
      availability: "ACTIVE";
      nickname: string;
      age: number;
      isVerified: boolean;
      distanceKm: number | null;
      trustScore: TrustBadge | null;
      bio: string | null;
      heightCm: number | null;
      weightKg: number | null;
      drinking: Drinking | null;
      hasKids: boolean | null;
      smoking: Smoking | null;
      religion: Religion | null;
      interests: InterestTag[];
      lookingFor: LookingFor | null;
      occupation: string | null;
      educationLevel: EducationLevel | null;
      languages: string[];
      location: { city: string | null; countryCode: string | null } | null;
      photos: { url: string; position: number; isMain: boolean }[];
    }
  | { id: string; availability: "UNAVAILABLE"; nickname: string; message?: string };

/** `SUPER_LIKE` has a weekly quota: past it the API answers 429 with its own message. */
export type SwipeAction = "PASS" | "LIKE" | "SUPER_LIKE";

export type SwipeBody = { targetNickname: string; action: SwipeAction; source?: "DECK" | "PROFILE"; runId?: string };

export type SwipeData = {
  swipe: { id: string; action: SwipeAction; createdAt: string };
  match: { id: string; conversationId: string; matchedUser: { id: string; nickname: string; mainPhotoUrl: string | null } } | null;
};

/** Error codes the deck reacts to. */
export const discoveryErrors = {
  onboardingIncomplete: "DISCOVERY_ONBOARDING_INCOMPLETE",
  locationRequired: "DISCOVERY_LOCATION_REQUIRED",
  runExpired: "DISCOVERY_RUN_EXPIRED",
  runNotFound: "DISCOVERY_RUN_NOT_FOUND",
  alreadyDecided: "SWIPE_ALREADY_DECIDED",
  unavailable: "USER_UNAVAILABLE",
} as const;
