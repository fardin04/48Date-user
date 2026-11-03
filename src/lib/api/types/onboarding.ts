import type { OnboardingStatus } from "./auth";

/** User / 02 - Users (onboarding, files, verification). Enum values are case-sensitive. */

export type ApiStepKey =
  | "location"
  | "nickname"
  | "real_name"
  | "birthday"
  | "smoking"
  | "drinking"
  | "gender"
  | "kids"
  | "interested_in"
  | "interests"
  | "height"
  | "weight"
  | "looking_for"
  | "languages"
  | "education"
  | "religion"
  | "bio"
  | "photos"
  | "selfie"
  | "notifications";

export type Smoking = "REGULARLY" | "OCCASIONALLY" | "NEVER";
export type Drinking = "REGULARLY" | "SOCIALLY" | "NEVER";
export type Gender = "WOMAN" | "MAN" | "PREFER_NOT_TO_SAY";
export type InterestedIn = "WOMEN" | "MEN" | "EVERYONE";
export type LookingFor = "REAL_RELATIONSHIP" | "SOMETHING_MEANINGFUL" | "SEE_WHERE_IT_GOES" | "NEW_FRIENDS_FIRST";
export type EducationLevel = "HIGH_SCHOOL" | "DIPLOMA" | "BACHELORS" | "MASTERS" | "DOCTORATE" | "OTHER";
export type Religion = "ISLAM" | "HINDUISM" | "CHRISTIANITY" | "BUDDHISM" | "SIKHISM" | "JUDAISM" | "OTHER" | "NOT_RELIGIOUS";
export type LocationPermission = "NOT_ASKED" | "WHILE_IN_USE" | "ONE_TIME" | "ALWAYS" | "DENIED" | "DENIED_FOREVER";

export type StepState = "PENDING" | "DONE" | "SKIPPED";

export type OnboardingStateData = {
  onboardingStatus: OnboardingStatus;
  nextStep: ApiStepKey | null;
  progressPercent: number;
  steps: { step: ApiStepKey; name: string; required: boolean; state: StepState }[];
  savedValues?: Partial<Record<ApiStepKey, Record<string, unknown>>>;
};

/** Body of each `PUT /onboarding/steps/:step` (Postman 06–24). */
export type StepBodies = {
  location: { latitude: number; longitude: number; city?: string; region?: string; countryCode?: string; permission?: boolean };
  nickname: { nickname: string };
  real_name: { firstName: string; lastName: string };
  birthday: { birthDate: string; occupation: string };
  smoking: { smoking: Smoking };
  drinking: { drinking: Drinking };
  gender: { gender: Gender };
  kids: { hasKids: boolean; wantsKids: boolean };
  interested_in: { interestedIn: InterestedIn };
  interests: { interestIds: string[] };
  height: { heightCm: number };
  weight: { weightKg: number };
  looking_for: { lookingFor: LookingFor };
  languages: { languageCodes: string[] };
  education: { educationLevel: EducationLevel } | { skipped: true };
  religion: { religion: Religion } | { skipped: true };
  bio: { bio: string } | { skipped: true };
  photos: { photos: PhotoRef[] };
  notifications: { skipped?: boolean };
};

export type SaveStepData = {
  step: ApiStepKey;
  state: StepState;
  nextStep: ApiStepKey | null;
  progressPercent: number;
  onboardingStatus: OnboardingStatus;
};

export type OptionValue<T extends string = string> = { value: T; label: string };
export type InterestOption = { id: string; key: string; label: string; icon?: string };

export type OnboardingOptionsData = {
  /** Grouped by category (CREATIVITY, SPORTS…). */
  interests: Record<string, InterestOption[]>;
  occupations: string[];
  smoking: OptionValue<Smoking>[];
  drinking: OptionValue<Drinking>[];
  gender: OptionValue<Gender>[];
  interestedIn: OptionValue<InterestedIn>[];
  lookingFor: OptionValue<LookingFor>[];
  educationLevels: OptionValue<EducationLevel>[];
  religions: OptionValue<Religion>[];
  languages: { code: string; label: string }[];
};

export type NicknameSuggestionsData = { suggestions: string[] };
export type NicknameAvailabilityData = { available: boolean; reason?: string };

export type FilePurpose = "PROFILE_PHOTO" | "VERIFICATION_SELFIE" | "CHAT_IMAGE" | "CHAT_VOICE" | "CHAT_VIDEO" | "STORY_IMAGE" | "GAME_QUESTION_IMAGE" | "DOCUMENT";
export type UploadedFile = { fileId: string; url: string; purpose: FilePurpose; mimeType: string; width?: number; height?: number; sizeBytes: number };

export type PhotoRef = { fileId: string; isMain: boolean };

/**
 * The collection lists QUEUED / PROCESSING / PASSED / FAILED / MANUAL_REVIEW; an admin decision sets
 * the attempt to APPROVED or REJECTED (Admin 10–11) and the queue shows NEEDS_REVIEW.
 */
export type VerificationApiStatus = "QUEUED" | "PROCESSING" | "MANUAL_REVIEW" | "NEEDS_REVIEW" | "PASSED" | "APPROVED" | "FAILED" | "REJECTED";
/** Live snapshot (checked against the running API): the automatic check adds scores and `rejectReason`. */
export type VerificationData = {
  id: string;
  status: VerificationApiStatus | string;
  method: string;
  confidence: number | null;
  selfieUrl: string;
  comparedUrl: string;
  createdAt: string;
  matchScore?: number | null;
  livenessScore?: number | null;
  gestureDetected?: boolean | null;
  /** A code from the automatic check ("LOW_SIMILARITY") or the reviewer's written reason. */
  rejectReason?: string | null;
  reasonCodes?: string[];
  decidedAt?: string | null;
};
