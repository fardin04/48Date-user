import type { Area } from "@/data/onboarding/types";
import { mockOnboardingService } from "./mock-onboarding-service";

export type NicknameCheck = { available: true } | { available: false; suggestions: string[]; recommended: string };

export type UploadResult = "uploaded" | "failed";

/** Selfie verification: separate from phone ownership; the badge shows only once verified. */
export type VerificationStatus = "none" | "pending" | "retry" | "verified";

/**
 * Contract the onboarding screens talk to (handoff: "Any prototype timeout illustrates a
 * service response"). Availability, area search, uploads and selfie review come from the service.
 */
export type OnboardingService = {
  checkNickname: (nickname: string) => Promise<NicknameCheck>;
  searchAreas: (query: string) => Promise<Area[]>;
  /** Reports progress from 0 to 100; resolves once the upload settles. */
  uploadPhoto: (file: File, onProgress: (percent: number) => void, signal: AbortSignal) => Promise<UploadResult>;
  /** Sends the selfie for private review; the review result arrives later through `getVerification`. */
  submitSelfie: (selfie: Blob) => Promise<VerificationStatus>;
  getVerification: () => Promise<VerificationStatus>;
};

/** Swap this for the real implementation when the profile API is available. */
export const onboardingService: OnboardingService = mockOnboardingService;
