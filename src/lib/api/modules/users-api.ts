import { cached, invalidate, prime } from "../cache";
import { api } from "../client";
import { endpoints } from "../endpoints";
import type { UploadedFile } from "../types/onboarding";
import type {
  AttachPhoto,
  DeleteAccountData,
  GalleryChange,
  GalleryData,
  MeData,
  NotificationSettingsBody,
  NotificationSettingsData,
  TrustScoreData,
  UpdateLocationBody,
  UpdateProfileBody,
  UpdateProfileData,
} from "../types/users";
import { cacheKeys } from "./cache-keys";

const MINUTE = 60_000;

/** User / 02 - Users (own profile), 11 - Trust & Safety (score, history), 12 - Notifications (settings). */
export const usersApi = {
  /** Own profile; shared by every screen that shows it (profile card, profile page, edit form). */
  me: () => cached(cacheKeys.me, MINUTE, () => api.get<MeData>(endpoints.users.me)),
  /** The same read, never from cache (verification and onboarding status can change on the server at any time). */
  freshMe: () => cached(cacheKeys.me, 0, () => api.get<MeData>(endpoints.users.me)),
  async updateProfile(body: UpdateProfileBody) {
    const result = await api.patch<UpdateProfileData>(endpoints.users.profile, { body });
    invalidate(cacheKeys.me);
    return result;
  },
  /** The own gallery, main first (up to 6 photos, so one page of 50 holds it). */
  myPhotos: () => api.get<GalleryData>(endpoints.users.photos, { query: { limit: 50 } }),
  /** Uploads profile photos in one all-or-nothing request; they are attached separately. */
  uploadPhotos(files: File[]) {
    const form = new FormData();
    form.append("purpose", "PROFILE_PHOTO");
    for (const file of files) form.append("files", file);
    return api.upload<{ items: UploadedFile[] }>(endpoints.filesBatch, form, () => undefined);
  },
  async attachPhotos(photos: AttachPhoto[]) {
    const result = await api.post<GalleryChange & { items: GalleryData["items"] }>(endpoints.users.photos, { body: { photos } });
    invalidate(cacheKeys.me);
    return result;
  },
  async setMainPhoto(id: string) {
    const result = await api.patch<{ mainPhotoUrl: string | null }>(endpoints.users.mainPhoto(id));
    invalidate(cacheKeys.me);
    return result;
  },
  async deletePhotos(photoIds: string[]) {
    const result = await api.delete<GalleryChange & { deletedIds: string[] }>(endpoints.users.photos, { body: { photoIds } });
    invalidate(cacheKeys.me);
    return result;
  },
  async updateLocation(body: UpdateLocationBody) {
    const result = await api.patch<NonNullable<MeData["location"]>>(endpoints.users.location, { body });
    invalidate(cacheKeys.me);
    return result;
  },
  deleteAccount: () => api.delete<DeleteAccountData>(endpoints.users.me),
  trustScore: () => cached(cacheKeys.trustScore, MINUTE, () => api.get<TrustScoreData>(endpoints.users.trustScore)),
  notificationSettings: () =>
    cached(cacheKeys.notificationSettings, MINUTE, () => api.get<NotificationSettingsData>(endpoints.users.notificationSettings)),
  async updateNotificationSettings(body: NotificationSettingsBody) {
    const result = await api.put<NotificationSettingsData>(endpoints.users.notificationSettings, { body });
    prime(cacheKeys.notificationSettings, result);
    return result;
  },
};
