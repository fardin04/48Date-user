import { cached, invalidate, prime } from "../cache";
import { api } from "../client";
import { endpoints } from "../endpoints";
import type { PhotoRef } from "../types/onboarding";
import type {
  DeleteAccountData,
  MeData,
  NotificationSettingsBody,
  NotificationSettingsData,
  TrustEvent,
  TrustScoreData,
  UpdateLocationBody,
  UpdatePhotosData,
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
  async updatePhotos(photos: PhotoRef[]) {
    const result = await api.put<UpdatePhotosData>(endpoints.users.photos, { body: { photos } });
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
  /** Newest first; `offset` pagination (Postman `02 Get Trust Score History`). */
  trustHistory: (limit = 20, offset = 0) =>
    cached([...cacheKeys.trustHistory, limit, offset], MINUTE, () => api.get<TrustEvent[]>(endpoints.trust.history, { query: { limit, offset } })),
  notificationSettings: () =>
    cached(cacheKeys.notificationSettings, MINUTE, () => api.get<NotificationSettingsData>(endpoints.users.notificationSettings)),
  async updateNotificationSettings(body: NotificationSettingsBody) {
    const result = await api.put<NotificationSettingsData>(endpoints.users.notificationSettings, { body });
    prime(cacheKeys.notificationSettings, result);
    return result;
  },
};
