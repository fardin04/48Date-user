import { invalidate } from "@/lib/api/cache";
import { matchingApi } from "@/lib/api/modules/discovery-api";
import { cacheKeys } from "@/lib/api/modules/cache-keys";
import { pause } from "@/lib/format";
import { isAborted, isApiError } from "@/lib/api/errors";
import { onboardingApi } from "@/lib/api/modules/onboarding-api";
import { usersApi } from "@/lib/api/modules/users-api";
import type { ApiStepKey, OnboardingStateData, VerificationData } from "@/lib/api/types/onboarding";
import type { OnboardingStep } from "@/data/onboarding/types";
import { getOnboardingFlow } from "@/stores/onboarding-store";
import { MEMBER_PREFIX } from "@/lib/auth/member-data";
import { setupStatus } from "@/lib/auth/setup-status";
import { searchAreaList } from "@/lib/onboarding/area-search";
import type { OnboardingService, SaveResult, SavedProgress, Verification, VerificationStatus } from "@/lib/onboarding/onboarding-service";
import { toStepOptions } from "@/lib/onboarding/options";
import type { ProfileDraft } from "@/lib/onboarding/profile-draft";
import { stepCalls } from "@/lib/onboarding/step-payloads";

/**
 * The latest verification attempt, so a reload or another tab can read its result (localStorage,
 * cleared on sign-out with every `48date.` key). The profile only says PENDING / VERIFIED / UNVERIFIED:
 * a failed or rejected attempt sets it back to UNVERIFIED, so "sent back" is known only from the attempt.
 */
const VERIFICATION_KEY = `${MEMBER_PREFIX}verification`;

const fallbackMessage = "We couldn’t save this step. Check your connection and try again.";

const fromAttempt: Record<string, VerificationStatus> = {
  QUEUED: "pending",
  PROCESSING: "pending",
  MANUAL_REVIEW: "pending",
  NEEDS_REVIEW: "pending",
  PENDING: "pending",
  PASSED: "verified",
  APPROVED: "verified",
  VERIFIED: "verified",
  FAILED: "retry",
  REJECTED: "retry",
  EXPIRED: "retry",
  CANCELLED: "retry",
};

/** An attempt's result with the backend's reason; a status this app doesn't know yet reads as still in review. */
function fromSnapshot(data: Partial<Pick<VerificationData, "status" | "rejectReason" | "reasonCodes">>): Verification {
  const status = fromAttempt[String(data.status ?? "").toUpperCase()] ?? "pending";
  const reason = data.rejectReason ?? data.reasonCodes?.[0] ?? undefined;
  return status === "retry" && reason ? { status, reason } : { status };
}

/** A review can take a while (manual review): after the stream closes, look again this much later. */
const REVIEW_RETRY_MS = 15_000;

const fromProfile = (status: string): VerificationStatus =>
  status === "VERIFIED" ? "verified" : status === "PENDING" ? "pending" : status === "REJECTED" || status === "FAILED" ? "retry" : "none";

function storedAttempt() {
  try {
    return localStorage.getItem(VERIFICATION_KEY);
  } catch {
    return null;
  }
}

function storeAttempt(id: string) {
  try {
    localStorage.setItem(VERIFICATION_KEY, id);
  } catch {
    // Blocked storage: the profile status still shows pending / verified.
  }
}

/** A failure message for the step's note: the first field error, else the API's message. */
function failure(error: unknown): SaveResult {
  if (!isApiError(error)) return { ok: false, message: fallbackMessage };
  return { ok: false, message: Object.values(error.fields)[0] ?? error.message };
}

const text = (value: unknown) => (typeof value === "string" || typeof value === "number" ? String(value) : undefined);

/** The screen that saves each API step (PERSONALITY and COMMUNICATION have none; `bio` has no screen). */
const screenOf: Partial<Record<ApiStepKey, OnboardingStep>> = {
  location: "location",
  nickname: "nickname",
  real_name: "privateName",
  birthday: "birthday",
  gender: "identity",
  interested_in: "identity",
  smoking: "lifestyle",
  drinking: "lifestyle",
  kids: "lifestyle",
  height: "details",
  weight: "details",
  education: "details",
  religion: "details",
  languages: "details",
  interests: "interests",
  looking_for: "goals",
  photos: "photos",
  selfie: "verify",
  notifications: "notify",
};

/** The earliest screen (in setup order) that still has a required step to save. */
function resumeAt(state: OnboardingStateData): OnboardingStep | undefined {
  const flow = getOnboardingFlow();
  return state.steps
    .filter((step) => step.required && step.state === "PENDING")
    .map((step) => screenOf[step.step])
    .filter((screen): screen is OnboardingStep => screen !== undefined)
    .sort((a, b) => flow[a].number - flow[b].number)[0];
}

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
  const completed = state.onboardingStatus === "COMPLETED";
  const resume = completed ? undefined : resumeAt(state);
  return {
    completed,
    ...(resume ? { resumeAt: resume } : {}),
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
      const { data } = await onboardingApi.state();
      setupStatus.fromApi(data.onboardingStatus);
      return toProgress(data);
    } catch {
      return null;
    }
  },
  async saveStep(step, input) {
    try {
      // In order: the API advances `nextStep` one step at a time.
      for (const { step: key, body } of stepCalls(step, input)) setupStatus.fromApi((await onboardingApi.saveStep(key, body)).data.onboardingStatus);
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
      storeAttempt(data.id);
      return fromSnapshot(data);
    } catch (error) {
      if (isAborted(error)) return { status: "none" };
      return { status: "retry" };
    }
  },
  /**
   * The profile's status is the authority for "verified"; the latest attempt says why one was sent
   * back. An attempt still "in review" while the profile is no longer PENDING has been decided against.
   */
  async getVerification() {
    try {
      const attempt = storedAttempt();
      const [me, snapshot] = await Promise.all([usersApi.freshMe(), attempt ? onboardingApi.verification(attempt).catch(() => null) : null]);
      const profile = String(me.data.verificationStatus).toUpperCase();
      if (profile === "VERIFIED") return { status: "verified" };
      if (!snapshot) return { status: fromProfile(profile) };
      const result = fromSnapshot(snapshot.data);
      return result.status === "pending" && profile !== "PENDING" ? { status: "retry" } : result;
    } catch {
      return { status: "none" };
    }
  },
  startMatching() {
    void matchingApi.start().catch(() => undefined);
  },
  /** Follows the attempt's event stream (Users `27`) instead of polling; reads it again only after the stream ends. */
  async waitForVerification(signal) {
    for (;;) {
      const attempt = storedAttempt();
      if (attempt) {
        let latest: Verification = { status: "pending" };
        try {
          await onboardingApi.verificationEvents(
            attempt,
            ({ data }) => {
              if (typeof data === "object" && data !== null && "status" in data) latest = fromSnapshot(data as Partial<VerificationData>);
              return latest.status !== "pending";
            },
            signal,
          );
        } catch (error) {
          if (signal.aborted) throw error;
        }
        if (latest.status !== "pending") {
          invalidate(cacheKeys.me, cacheKeys.verification);
          // The event may not carry the reason; the snapshot does.
          return latest.status === "retry" && !latest.reason ? apiOnboardingService.getVerification() : latest;
        }
      }
      const current = await apiOnboardingService.getVerification();
      if (current.status !== "pending") return current;
      await pause(REVIEW_RETRY_MS, signal);
    }
  },
};
