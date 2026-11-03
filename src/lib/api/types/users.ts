import type { OnboardingStatus } from "./auth";
import type { Drinking, EducationLevel, Gender, InterestedIn, LocationPermission, LookingFor, Religion, Smoking } from "./onboarding";

/** User / 02 - Users (profile), 11 - Trust & Safety (score), 12 - Notifications (settings). */

export type VerificationState = "UNVERIFIED" | "PENDING" | "VERIFIED" | "REJECTED";

export type ProfilePhoto = { id: string; fileId: string; url: string; position: number; isMain: boolean };

export type MeData = {
  nickname: string;
  status: string;
  verificationStatus: VerificationState | string;
  onboardingStatus: OnboardingStatus;
  profileCompletenessPercent: number;
  phone: string | null;
  email: string | null;
  googleLinked: boolean;
  birthDate: string | null;
  age: number | null;
  occupation: string | null;
  smoking: Smoking | null;
  drinking: Drinking | null;
  gender: Gender | null;
  hasKids: boolean | null;
  wantsKids: boolean | null;
  interestedIn: InterestedIn | null;
  heightCm: number | null;
  weightKg: number | null;
  lookingFor: LookingFor | null;
  languageCodes: string[];
  educationLevel: EducationLevel | null;
  religion: Religion | null;
  bio: string | null;
  location: {
    latitude: number;
    longitude: number;
    city: string | null;
    region: string | null;
    countryCode: string | null;
    permission: LocationPermission;
    source: "GPS" | "MANUAL";
  } | null;
  interests: { id: string; key: string; label: string; category: string; icon?: string }[];
  photos: ProfilePhoto[];
  createdAt: string;
};

/** `PATCH /users/me/profile` — nickname, real name, education and interests cannot be changed here. */
export type UpdateProfileBody = Partial<{ bio: string; occupation: string; smoking: Smoking; drinking: Drinking; lookingFor: LookingFor }>;
export type UpdateProfileData = Partial<MeData> & { nickname: string };

export type UpdatePhotosData = { photos: ProfilePhoto[] };

/** `PATCH /users/me/location` merges the fields sent; `null` clears a name (a new GPS position without one). */
export type UpdateLocationBody = Partial<{
  latitude: number;
  longitude: number;
  city: string | null;
  region: string | null;
  countryCode: string | null;
  permission: LocationPermission;
  source: "GPS" | "MANUAL";
}>;

export type DeleteAccountData = { deleted: boolean; purgeAt: string; message: string };

export type TrustScoreData = {
  value: number;
  label: string;
  percentile: number;
  completedDatesCount: number;
  isVerified: boolean;
  breakdown: {
    items: { type: string; title: string; points: number; originalPoints: number; createdAt: string }[];
    rules: { title: string; description: string; impact: string; category: string }[];
  };
};

export type TrustEvent = {
  id: string;
  type: string;
  points: number;
  reason: string;
  sourceType: string;
  sourceId: string | null;
  fadesUntil: string | null;
  isReversed: boolean;
  createdAt: string;
};

export type NotificationSettingsData = { matches: boolean; messages: boolean; dates: boolean; games: boolean; announcements: boolean; account: boolean };
export type NotificationSettingsBody = Partial<Omit<NotificationSettingsData, "account">>;
