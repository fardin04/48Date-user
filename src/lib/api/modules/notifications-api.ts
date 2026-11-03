import { cached, invalidate } from "../cache";
import { api } from "../client";
import { endpoints } from "../endpoints";
import type { InboxNotification } from "../types/notifications";
import { cacheKeys } from "./cache-keys";

/** User / 12 - Notifications: the inbox and its unread badge (settings live in `users-api`). */
export const notificationsApi = {
  inbox: () => cached([...cacheKeys.notifications, "raw", "inbox"], 30_000, () => api.get<InboxNotification[]>(endpoints.notifications.list, { query: { limit: 30 } })),
  unreadCount: () => cached([...cacheKeys.notifications, "raw", "unread"], 30_000, () => api.get<{ unreadCount: number }>(endpoints.notifications.unreadCount)),
  async readAll() {
    const result = await api.post<{ updated: number }>(endpoints.notifications.readAll);
    invalidate(cacheKeys.notifications);
    return result;
  },
};
