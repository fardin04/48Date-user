import { cached, invalidate } from "../cache";
import { api } from "../client";
import { endpoints } from "../endpoints";
import type {
  FilePurpose,
  NicknameAvailabilityData,
  NicknameSuggestionsData,
  OnboardingOptionsData,
  OnboardingStateData,
  SaveStepData,
  StepBodies,
  UploadedFile,
  VerificationData,
} from "../types/onboarding";
import { cacheKeys } from "./cache-keys";

const HOUR = 60 * 60 * 1000;

/** User / 02 - Users: onboarding state, options, nickname, steps, the central upload and verification. */
export const onboardingApi = {
  /** Resume point and saved answers; fetched once per visit to onboarding. */
  state: () => cached(cacheKeys.onboardingState, 60_000, () => api.get<OnboardingStateData>(endpoints.onboarding.state)),
  /** Static option lists (public); kept for an hour. */
  options: () => cached(cacheKeys.options, HOUR, () => api.get<OnboardingOptionsData>(endpoints.onboarding.options, { auth: false })),
  nicknameSuggestions: () => api.get<NicknameSuggestionsData>(endpoints.onboarding.nicknameSuggestions),
  nicknameAvailability: (nickname: string, signal?: AbortSignal) =>
    api.get<NicknameAvailabilityData>(endpoints.onboarding.nicknameAvailability, { query: { nickname }, auth: false, signal }),
  async saveStep<S extends keyof StepBodies>(step: S, body: StepBodies[S]) {
    const result = await api.put<SaveStepData>(endpoints.onboarding.step(step), { body });
    invalidate(cacheKeys.onboardingState, cacheKeys.me);
    return result;
  },
  upload(file: File | Blob, purpose: FilePurpose, onProgress: (percent: number) => void, signal?: AbortSignal) {
    const form = new FormData();
    form.append("file", file);
    form.append("purpose", purpose);
    return api.upload<UploadedFile>(endpoints.files, form, onProgress, signal);
  },
  async startVerification(selfieFileId: string) {
    const result = await api.post<VerificationData>(endpoints.verification.start, { body: { selfieFileId } });
    invalidate(cacheKeys.verification, cacheKeys.me);
    return result;
  },
  verification: (id: string) => api.get<VerificationData>(endpoints.verification.snapshot(id)),
  /** Live review updates (Users `27 Verification Events (SSE)`); ends on a terminal status or `signal`. */
  verificationEvents: (id: string, onEvent: Parameters<typeof api.stream>[1], signal: AbortSignal) =>
    api.stream(endpoints.verification.events(id), onEvent, signal),
};
