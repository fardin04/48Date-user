import type { Area, DraftField, OnboardingStep, SelectOption } from "@/data/onboarding/types";
import { apiEnabled } from "@/lib/api/config";
import { apiOnboardingService } from "@/lib/onboarding/api-onboarding-service";
import { mockOnboardingService } from "@/lib/onboarding/mocks/mock-onboarding-service";
import type { DraftPhoto } from "@/lib/onboarding/photo-store";
import type { ProfileDraft } from "@/lib/onboarding/profile-draft";

export type NicknameCheck = { available: true } | { available: false; suggestions: string[]; recommended: string };

/** `fileId` identifies the stored upload (sent with the photos step). */
export type UploadResult = { status: "uploaded"; fileId?: string } | { status: "failed" };

/** Selfie verification: separate from phone ownership; the badge shows only once verified. */
export type VerificationStatus = "none" | "pending" | "retry" | "verified";

/** A position for the location step: the browser's (rounded) or a chosen area's centre. */
export type LocationInput = { latitude: number; longitude: number; city?: string; region?: string; countryCode?: string; permission: boolean };

/** What a step's Continue sends: the saved answers, plus photos or a location where the step has them. */
export type StepInput = { draft: ProfileDraft; photos?: DraftPhoto[]; location?: LocationInput };

export type SaveResult = { ok: true } | { ok: false; message: string };

/** An interest the member can pick; `id` is what the API stores. */
export type InterestOption = { id: string; key: string; label: string };

/** Option lists from the service; a missing list falls back to the starter list in data. */
export type StepOptions = { fields: Partial<Record<DraftField, SelectOption[]>>; interests: InterestOption[] };

/** Answers saved earlier (another device, a previous visit). */
export type SavedProgress = { completed: boolean; draft: Partial<ProfileDraft> };

/**
 * Contract the onboarding screens talk to (handoff: "Any prototype timeout illustrates a
 * service response"). Availability, area search, uploads, saving each step and selfie review
 * come from the service.
 */
export type OnboardingService = {
  checkNickname: (nickname: string) => Promise<NicknameCheck>;
  /** Suggested nicknames, or null to use the starter list. */
  getNicknameSuggestions: () => Promise<string[] | null>;
  searchAreas: (query: string) => Promise<Area[]>;
  /** Option lists for the select and interest steps, or null to use the starter lists. */
  getOptions: () => Promise<StepOptions | null>;
  /** Saved progress to restore the draft from, or null when there is nothing to restore. */
  getProgress: () => Promise<SavedProgress | null>;
  /** Saves one step's answers; the screen moves on only when it resolves `ok`. */
  saveStep: (step: OnboardingStep, input: StepInput) => Promise<SaveResult>;
  /** Reports progress from 0 to 100; resolves once the upload settles. */
  uploadPhoto: (file: File, onProgress: (percent: number) => void, signal: AbortSignal) => Promise<UploadResult>;
  /** Sends the selfie for private review; the review result arrives later through `getVerification`. */
  submitSelfie: (selfie: Blob) => Promise<VerificationStatus>;
  getVerification: () => Promise<VerificationStatus>;
};

/** The API (`NEXT_PUBLIC_API_BASE_URL` set) or the marked mock. */
export const onboardingService: OnboardingService = apiEnabled ? apiOnboardingService : mockOnboardingService;
