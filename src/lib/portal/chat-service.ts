import type { MemberId, MemberSummary } from "@/data/portal/types";
import { apiEnabled } from "@/lib/api/config";
import { apiChatService } from "@/lib/portal/api-chat-service";
import { mockChatService } from "@/lib/portal/mocks/mock-chat-service";

/** What a message carries: the member's own kinds, and the cards the service posts (game, date, system). */
export type MessageKind = "text" | "photo" | "voice" | "game" | "invite" | "date" | "system";

export type ChatMessage = {
  id: string;
  kind: MessageKind;
  /** The member's own message (right, rose-light) or the other member's. */
  mine: boolean;
  /** Text, photo caption, the voice duration ("00:18"), or the card's line. */
  text: string;
  sentAt: number;
  status: "sent" | "seen" | "failed";
  /** A photo or voice note the browser may load (API messages). */
  mediaUrl?: string;
};

/** How a conversation opens: the mock's sample openings, or `live` (the history as it is). */
export type Opening = "firstHello" | "invite" | "agreed" | "incoming" | "live";

export type Conversation = {
  member: MemberId;
  partner: MemberSummary;
  /** Oldest first. */
  messages: ChatMessage[];
  opening: Opening;
  /** Older messages can be read (`loadOlder`). */
  hasOlder: boolean;
  blocked: boolean;
  /** Closed by the service (time is up, or the other member blocked): nothing more can be sent. */
  readOnly: boolean;
  /** MSG-01 has been shown for this conversation. */
  introSeen: boolean;
};

export type ConversationSummary = { member: MemberId; partner: MemberSummary; preview: string; unread: number; blocked: boolean };

export type SuggestionsResult = { status: "ready"; suggestions: string[] } | { status: "unavailable"; reason?: string };

/** A message to send: text, a photo (with an optional caption) or a voice note. */
export type OutgoingMessage =
  | { kind: "text"; text: string }
  | { kind: "photo"; text: string; file: Blob }
  | { kind: "voice"; text: string; file: Blob; seconds: number };

/** Live changes while a conversation is open. */
export type ConversationWatcher = {
  onChange: (conversation: Conversation) => void;
  onTyping: (typing: boolean) => void;
};

/**
 * Contract the messaging screens talk to (rule 37). Delivery, AI suggestions, blocking and live
 * events come from the service; photos and voice notes are uploaded only when sent.
 */
export type ChatService = {
  /** Open conversations: not blocked. */
  getConversations: () => Promise<ConversationSummary[]>;
  getConversation: (member: MemberId) => Promise<Conversation>;
  /** Reads the page before the oldest message shown. */
  loadOlder: (member: MemberId) => Promise<Conversation>;
  /** Resolves with the stored message, `failed` when it could not be delivered (CHAT-FAILED). */
  send: (member: MemberId, message: OutgoingMessage) => Promise<ChatMessage>;
  /** Sends a failed message again (the service keeps it from being delivered twice). */
  retry: (member: MemberId, id: string) => Promise<ChatMessage | null>;
  /** Removes a failed message so it can be edited and sent again. */
  discard: (member: MemberId, id: string) => Promise<void>;
  /** AI-GENERATING → CHAT-AI / AI-STARTERS, or AI-ERROR; `again` asks for different lines; aborting stops generation. */
  getSuggestions: (member: MemberId, signal: AbortSignal, again?: boolean) => Promise<SuggestionsResult>;
  markIntroSeen: (member: MemberId) => Promise<void>;
  /** Tells the other member everything up to the newest message was read. */
  markSeen: (member: MemberId) => Promise<void>;
  /** Keeps the conversation list live (new messages, closed conversations) while it is on screen. */
  watchInbox: () => () => void;
  /** Live updates for an open conversation; returns the function that stops them. */
  watch: (member: MemberId, watcher: ConversationWatcher) => () => void;
  /** The member is typing (or stopped); the service throttles what it sends. */
  setTyping: (member: MemberId, typing: boolean) => void;
  block: (member: MemberId) => Promise<void>;
  /** W09 BLOCKED: members this account has blocked, newest last. */
  getBlocked: () => Promise<MemberId[]>;
  /** Unblocking lets them find the profile again; it doesn't restore an old match. */
  unblock: (member: MemberId) => Promise<void>;
};

/** The API (`NEXT_PUBLIC_API_BASE_URL` set) or the marked mock. */
export const chatService: ChatService = apiEnabled ? apiChatService : mockChatService;
