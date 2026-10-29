import type { MemberId } from "@/data/portal/types";
import { mockChatService } from "@/lib/portal/mocks/mock-chat-service";

export type MessageKind = "text" | "photo" | "voice";

/** A message the member sent in this conversation. */
export type ChatMessage = {
  id: string;
  kind: MessageKind;
  /** Text, photo caption, or the voice duration ("00:18"). */
  text: string;
  sentAt: number;
  status: "sent" | "failed";
};

export type Conversation = {
  member: MemberId;
  messages: ChatMessage[];
  blocked: boolean;
  /** MSG-01 has been shown for this conversation. */
  introSeen: boolean;
};

export type SuggestionsResult = { status: "ready"; suggestions: string[] } | { status: "unavailable" };

/**
 * Contract the messaging screens talk to (rule 37). Delivery, AI suggestions and blocking come
 * from the service; media stays in the browser until a real upload API exists.
 */
export type ChatService = {
  /** Open conversations: not blocked. */
  getConversations: () => Promise<{ member: MemberId; blocked: boolean }[]>;
  getConversation: (member: MemberId) => Promise<Conversation>;
  /** Resolves with the stored message, `failed` when it could not be delivered (CHAT-FAILED). */
  send: (member: MemberId, message: { kind: MessageKind; text: string }) => Promise<ChatMessage>;
  retry: (member: MemberId, id: string) => Promise<ChatMessage | null>;
  /** Removes a failed message so it can be edited and sent again. */
  discard: (member: MemberId, id: string) => Promise<void>;
  /** AI-GENERATING → CHAT-AI / AI-STARTERS, or AI-ERROR; aborting stops generation. */
  getSuggestions: (member: MemberId, signal: AbortSignal) => Promise<SuggestionsResult>;
  markIntroSeen: (member: MemberId) => Promise<void>;
  block: (member: MemberId) => Promise<void>;
  /** W09 BLOCKED: members this account has blocked, newest last. */
  getBlocked: () => Promise<MemberId[]>;
  /** Unblocking lets them find the profile again; it doesn't restore an old match. */
  unblock: (member: MemberId) => Promise<void>;
};

/** Swap this for the real implementation when the messaging API is available. */
export const chatService: ChatService = mockChatService;
