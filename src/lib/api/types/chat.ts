import type { OtherUser } from "./matches";

/** User / 07 - Chat and the Socket.IO gateway (48Date-WebSockets). Enums are case-sensitive. */

export type MessageType = "TEXT" | "IMAGE" | "VOICE" | "SYSTEM" | "DATE" | "GAME" | "DATE_INVITE";

export type MessageStatus = "SENT" | "DELIVERED" | "SEEN";

export type ConversationTimer = { active: boolean; remainingSeconds: number; formatted: string; clockStopped: boolean };

export type ConversationItem = {
  id: string;
  matchId: string;
  partner: OtherUser;
  lastMessage: {
    seq: number;
    type: MessageType;
    text: string | null;
    preview: string | null;
    createdAt: string;
    senderNickname: string | null;
    isMine: boolean;
  } | null;
  unreadCount: number;
  timer: ConversationTimer | null;
  isReadOnly: boolean;
  status: "OPEN" | "CLOSED" | string;
  updatedAt: string;
};

export type ConversationHeader = {
  id: string;
  matchId: string;
  partner: OtherUser;
  timer: ConversationTimer | null;
  canSend: boolean;
  isReadOnly: boolean;
  status: "OPEN" | "CLOSED" | string;
  myDeliveredUpToSeq: number;
  mySeenUpToSeq: number;
  partnerDeliveredUpToSeq: number;
  partnerSeenUpToSeq: number;
  lastSeq: number;
};

export type MessageFile = {
  fileId: string;
  url: string;
  mimeType: string;
  width: number | null;
  height: number | null;
  durationSeconds: number | null;
};

export type ApiMessage = {
  id: string;
  conversationId: string;
  seq: number;
  senderId: string | null;
  senderNickname: string | null;
  isMine: boolean;
  type: MessageType;
  text: string | null;
  file: MessageFile | null;
  payload: Record<string, unknown> | null;
  status: MessageStatus;
  createdAt: string;
};

export type SendMessageBody = {
  clientMessageId: string;
  type: "TEXT" | "IMAGE" | "VOICE";
  text?: string;
  fileId?: string;
  durationSeconds?: number;
};

/** `conversation:receipt`: the partner's delivered / seen pointers moved. */
export type ReceiptEvent = { conversationId: string; nickname: string; deliveredUpToSeq: number; seenUpToSeq: number };

export type TypingEvent = { conversationId: string; nickname: string; isTyping: boolean };

export type ClosedEvent = { conversationId: string; reason: "EXPIRED" | "BLOCKED" | string };

export const chatErrors = {
  notFound: "CONVERSATION_NOT_FOUND",
  closed: "CONVERSATION_CLOSED",
  tooLong: "MESSAGE_TOO_LONG",
} as const;
