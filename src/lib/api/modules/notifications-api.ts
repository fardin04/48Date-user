import { cached, invalidate } from "../cache";
import { api } from "../client";
import { endpoints } from "../endpoints";
import type { CursorMeta } from "../types/envelope";
import type { InboxNotification } from "../types/notifications";
import { cacheKeys } from "./cache-keys";

/** User / 12 - Notifications: the inbox and its unread badge (settings live in `users-api`). */
export const notificationsApi = {
  inbox: (cursor?: string) =>
    cached([...cacheKeys.notifications, "raw", "inbox", cursor ?? ""], 30_000, async () => {
      const result = await api.get<InboxNotification[]>(endpoints.notifications.list, { query: { limit: 20, cursor: cursor ?? undefined } });
      return { data: result.data, meta: result.meta as CursorMeta | undefined };
    }),
  unreadCount: () => cached([...cacheKeys.notifications, "raw", "unread"], 30_000, () => api.get<{ unreadCount: number }>(endpoints.notifications.unreadCount)),
  async readAll() {
    const result = await api.post<{ updated: number }>(endpoints.notifications.readAll);
    invalidate(cacheKeys.notifications);
    return result;
  },
  async deleteNotification(id: string) {
    const result = await api.delete<unknown>(endpoints.notifications.detail(id));
    invalidate(cacheKeys.notifications);
    return result;
  },
};
