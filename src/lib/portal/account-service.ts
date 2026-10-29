import type { AccountDetails, NotificationPrefs, ProfileOverview, ProfilePhoto, PublicProfile, ReportReason, TrustSummary } from "@/data/portal/account";
import type { Fact } from "@/data/portal/types";
import { apiEnabled } from "@/lib/api/config";
import { apiAccountService } from "@/lib/portal/api-account-service";
import { mockAccountService } from "@/lib/portal/mocks/mock-account-service";

/** Field errors the server sends back; the form keeps its values and shows them inline. */
export type FieldErrors<T> = Partial<Record<keyof T, string>>;

/** `message` is a failure that belongs to no single field. */
export type SaveResult<T> = { ok: true } | { ok: false; errors: FieldErrors<T>; message?: string };

/** What a report is about: a member, a story, or nothing chosen yet (from Privacy & safety). */
export type ReportSubject = { kind: "member" | "story"; id: string } | null;

/**
 * Contract the W09 profile, trust and settings screens talk to (rule 39). The server validates
 * every change; reports and trust reviews stay private; deletion is only ever a request.
 * Blocking lives in `chatService`, verification in `onboardingService`.
 */
export type AccountService = {
  /** Which public details PROFILE-EDIT may change (the nickname never can). */
  editable: { education: boolean; interests: boolean };
  getOverview: () => Promise<ProfileOverview>;
  getProfile: () => Promise<PublicProfile>;
  saveProfile: (profile: PublicProfile) => Promise<SaveResult<PublicProfile>>;
  getAccount: () => Promise<AccountDetails>;
  saveAccount: (account: AccountDetails) => Promise<SaveResult<AccountDetails>>;
  getPhotos: () => Promise<ProfilePhoto[]>;
  /** Uploads new files and saves the photos in order (main first). Rejects with a message on failure. */
  savePhotos: (photos: ProfilePhoto[]) => Promise<void>;
  getTrust: () => Promise<TrustSummary>;
  /** Trust activity, newest first (label + "Verified · 12 Oct"). */
  getTrustHistory: () => Promise<Fact[]>;
  getNotificationPrefs: () => Promise<NotificationPrefs>;
  saveNotificationPrefs: (prefs: NotificationPrefs) => Promise<void>;
  /** Rejects when it could not be sent. */
  requestTrustReview: (event: string, explanation: string) => Promise<void>;
  report: (subject: ReportSubject, reason: ReportReason, details: string) => Promise<void>;
  requestDeletion: () => Promise<void>;
};

/** The API (`NEXT_PUBLIC_API_BASE_URL` set) or the marked mock. */
export const accountService: AccountService = apiEnabled ? apiAccountService : mockAccountService;
