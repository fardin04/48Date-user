import { isAborted, isApiError } from "@/lib/api/errors";
import { onboardingApi } from "@/lib/api/modules/onboarding-api";
import { usersApi } from "@/lib/api/modules/users-api";
import type { OnboardingStateData, VerificationApiStatus } from "@/lib/api/types/onboarding";
import { searchAreaList } from "@/lib/onboarding/area-search";
import type { OnboardingService, SaveResult, SavedProgress, VerificationStatus } from "@/lib/onboarding/onboarding-service";
import { toStepOptions } from "@/lib/onboarding/options";
import type { ProfileDraft } from "@/lib/onboarding/profile-draft";
import { stepCalls } from "@/lib/onboarding/step-payloads";

/** The latest verification attempt, so a reload can keep polling it (cleared on sign-out). */
const VERIFICATION_KEY = "48date.verification.id";

const fallbackMessage = "We couldn’t save this step. Check your connection and try again.";

const fromAttempt: Record<VerificationApiStatus, VerificationStatus> = {
  QUEUED: "pending",
  PROCESSING: "pending",
  MANUAL_REVIEW: "pending",
  PASSED: "verified",
  FAILED: "retry",
};

const fromProfile = (status: string): VerificationStatus =>
  status === "VERIFIED" ? "verified" : status === "PENDING" ? "pending" : status === "REJECTED" || status === "FAILED" ? "retry" : "none";

function storedAttempt() {
  try {
    return sessionStorage.getItem(VERIFICATION_KEY);
  } catch {
    return null;
  }
}

/** A failure message for the step's note: the first field error, else the API's message. */
function failure(error: unknown): SaveResult {
  if (!isApiError(error)) return { ok: false, message: fallbackMessage };
  return { ok: false, message: Object.values(error.fields)[0] ?? error.message };
}

const text = (value: unknown) => (typeof value === "string" || typeof value === "number" ? String(value) : undefined);

/** `GET /onboarding` saved values → the draft fields of each screen (the real name is never returned). */
function toProgress(state: OnboardingStateData): SavedProgress {
  const saved = state.savedValues ?? {};
  const value = (step: keyof typeof saved, key: string) => text(saved[step]?.[key]);
  const fields: ProfileDraft["fields"] = {
    nickname: value("nickname", "nickname"),
    dob: value("birthday", "birthDate"),
    occupation: value("birthday", "occupation"),
    identity: value("gender", "gender"),
    meet: value("interested_in", "interestedIn"),
    smoking: value("smoking", "smoking"),
    alcohol: value("drinking", "drinking"),
    children: saved.kids ? String(saved.kids.hasKids === true) : undefined,
    familyPlans: saved.kids ? String(saved.kids.wantsKids === true) : undefined,
    height: value("height", "heightCm"),
    weight: value("weight", "weightKg"),
    goal: value("looking_for", "lookingFor"),
    education: value("education", "educationLevel"),
    religion: value("religion", "religion"),
    languages: Array.isArray(saved.languages?.languageCodes) ? (saved.languages.languageCodes as string[]).join(",") : undefined,
  };
  const interests = Array.isArray(saved.interests?.interestIds) ? (saved.interests.interestIds as string[]) : undefined;
  const city = value("location", "city");
  return {
    completed: state.onboardingStatus === "COMPLETED",
    draft: {
      fields: Object.fromEntries(Object.entries(fields).filter(([, entry]) => entry !== undefined)),
      ...(interests ? { interests } : {}),
      ...(city ? { area: { label: city, source: "manual" as const } } : {}),
    },
  };
}

/** User / 02 - Users: onboarding against the API (Postman 01–26). */
export const apiOnboardingService: OnboardingService = {
  async checkNickname(nickname) {
    try {
      const { data } = await onboardingApi.nicknameAvailability(nickname);
      if (data.available) return { available: true };
    } catch {
      // Unknown: saving the step reports a conflict if the name is taken.
      return { available: true };
    }
    const suggestions = (await apiOnboardingService.getNicknameSuggestions()) ?? [];
    return { available: false, suggestions, recommended: suggestions[0] ?? nickname };
  },
  async getNicknameSuggestions() {
    try {
      return (await onboardingApi.nicknameSuggestions()).data.suggestions;
    } catch {
      return null;
    }
  },
  async searchAreas(query) {
    return searchAreaList(query);
  },
  async getOptions() {
    try {
      return toStepOptions((await onboardingApi.options()).data);
    } catch {
      return null;
    }
  },
  async getProgress() {
    try {
      return toProgress((await onboardingApi.state()).data);
    } catch {
      return null;
    }
  },
  async saveStep(step, input) {
    try {
      // In order: the API advances `nextStep` one step at a time.
      for (const { step: key, body } of stepCalls(step, input)) await onboardingApi.saveStep(key, body);
      return { ok: true };
    } catch (error) {
      return failure(error);
    }
  },
  async uploadPhoto(file, onProgress, signal) {
    try {
      const uploaded = await onboardingApi.upload(file, "PROFILE_PHOTO", onProgress, signal);
      return { status: "uploaded", fileId: uploaded.fileId };
    } catch {
      return { status: "failed" };
    }
  },
  async submitSelfie(selfie) {
    try {
      const uploaded = await onboardingApi.upload(selfie, "VERIFICATION_SELFIE", () => undefined);
      const { data } = await onboardingApi.startVerification(uploaded.fileId);
      sessionStorage.setItem(VERIFICATION_KEY, data.id);
      return fromAttempt[data.status] ?? "pending";
    } catch (error) {
      if (isAborted(error)) return "none";
      return "retry";
    }
  },
  async getVerification() {
    try {
      const attempt = storedAttempt();
      if (attempt) return fromAttempt[(await onboardingApi.verification(attempt)).data.status] ?? "pending";
      return fromProfile(String((await usersApi.me()).data.verificationStatus));
    } catch {
      return "none";
    }
  },
};
