import { cached, invalidate } from "../cache";
import { api } from "../client";
import { endpoints } from "../endpoints";
import type { CursorMeta } from "../types/envelope";
import type { ApiMessage, ConversationHeader, ConversationItem, SendMessageBody } from "../types/chat";
import { cacheKeys } from "./cache-keys";

/** Messages read per page (the API allows up to 50). */
const PAGE = 30;

/** User / 07 - Chat (REST); live events come through `../socket.ts`. */
export const chatApi = {
  /** Open conversations, newest first (one page of 50: at most a handful are open at a time). */
  list: () =>
    cached([...cacheKeys.conversations, "raw"], 15_000, () => api.get<ConversationItem[]>(endpoints.conversations.list, { query: { limit: 50 } })),
  header: (id: string, signal?: AbortSignal) => api.get<ConversationHeader>(endpoints.conversations.detail(id), { signal }),
  /** The newest page (`before` absent), an older page (`before` = oldest seq) or missed messages (`after` = newest seq). */
  messages: (id: string, page: { before?: number; after?: number } = {}, signal?: AbortSignal) =>
    api
      .get<ApiMessage[]>(endpoints.conversations.messages(id), { query: { cursor: page.before, after: page.after, limit: PAGE }, signal })
      .then((result) => ({ data: result.data, meta: result.meta as CursorMeta | undefined })),
  async send(id: string, body: SendMessageBody) {
    const result = await api.post<ApiMessage | ApiMessage[]>(endpoints.conversations.messages(id), { body });
    invalidate([...cacheKeys.conversations, "raw"]);
    return result;
  },
  seen: (id: string, upToSeq: number) => api.post<{ seenUpToSeq: number }>(endpoints.conversations.seen(id), { body: { upToSeq } }),
};
