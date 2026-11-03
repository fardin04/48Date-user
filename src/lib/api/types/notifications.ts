import type { OtherUser } from "./matches";

/** User / 12 - Notifications (inbox). */

/** `params` is left out by some notifications (the live story-consent one sends only `screen`). */
export type NotificationTarget = { screen?: string | null; params?: Record<string, string> | null };

export type InboxNotification = {
  id: string;
  type: string;
  category: string;
  title: string;
  body: string;
  imageUrl: string | null;
  actor: OtherUser | null;
  target: NotificationTarget | null;
  createdAt: string;
  readAt: string | null;
};
