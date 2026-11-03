import type { MemberId } from "@/data/portal/types";
import { invalidate, onCacheClear } from "@/lib/api/cache";
import { isAborted, isApiError } from "@/lib/api/errors";
import { aiApi } from "@/lib/api/modules/ai-api";
import { cacheKeys } from "@/lib/api/modules/cache-keys";
import { chatApi } from "@/lib/api/modules/chat-api";
import { onboardingApi } from "@/lib/api/modules/onboarding-api";
import { trustApi } from "@/lib/api/modules/trust-api";
import { acquireSocket } from "@/lib/api/socket";
import type { ApiMessage, ClosedEvent, ReceiptEvent, SendMessageBody, TypingEvent } from "@/lib/api/types/chat";
import { mediaUrl, toSummary } from "@/lib/portal/api-members";
import { findMatch } from "@/lib/portal/api-match-lookup";
import type { ChatMessage, ChatService, Conversation, ConversationWatcher, MessageKind, OutgoingMessage } from "@/lib/portal/chat-service";
import { getMemberCopy } from "@/stores/portal-store";

/** Typing is sent at most this often while the member keeps typing; a silent partner stops "typing" after the timeout. */
const TYPING_EVERY_MS = 3000;
const TYPING_TIMEOUT_MS = 6000;
const INTRO_KEY = "48date.chat.intro";

const same = (a: string, b: string) => a.toLowerCase() === b.toLowerCase();
const keyOf = (member: MemberId) => member.toLowerCase();

type Outgoing = { message: ChatMessage; outgoing: OutgoingMessage; fileId?: string };

type Room = {
  member: MemberId;
  conversationId: string;
  partner: Conversation["partner"];
  /** By API id; ordered by `seq` when read. */
  messages: Map<string, { seq: number; message: ApiMessage }>;
  oldestSeq: number | null;
  newestSeq: number;
  hasOlder: boolean;
  partnerSeen: number;
  /** Highest seq this member has reported as seen. */
  reportedSeen: number;
  readOnly: boolean;
  blocked: boolean;
  /** Failed sends, kept so Retry reuses the same `clientMessageId` (the API delivers it once). */
  outbox: Map<string, Outgoing>;
};

const rooms = new Map<string, Room>();
const watchers = new Map<string, Set<ConversationWatcher>>();
const typingSent = new Map<string, { typing: boolean; at: number }>();
const suggestionRequests = new Map<string, string>();
/** Blocked in this session: the API removes the conversation, the screen shows BLOCK-DONE. */
const blockedHere = new Set<string>();
const sockets = new Map<string, ReturnType<typeof acquireSocket>>();
/** Conversation rooms joined for the live list, with how many lists need each. */
const listJoins = new Map<string, number>();
const listKey = [...cacheKeys.conversations, "raw"];

onCacheClear(() => {
  rooms.clear();
  loading.clear();
  listJoins.clear();
  typingSent.clear();
  suggestionRequests.clear();
  blockedHere.clear();
});

/** "00:18" from whole seconds. */
const clock = (seconds: number) => `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;

const kinds: Record<ApiMessage["type"], MessageKind> = {
  TEXT: "text",
  IMAGE: "photo",
  VOICE: "voice",
  GAME: "game",
  DATE_INVITE: "invite",
  DATE: "date",
  SYSTEM: "system",
};

function toMessage(message: ApiMessage, partnerSeen: number): ChatMessage {
  const kind = kinds[message.type] ?? "system";
  const seconds = message.file?.durationSeconds ?? (typeof message.payload?.durationSeconds === "number" ? message.payload.durationSeconds : 0);
  const media = mediaUrl(message.file?.url);
  return {
    id: message.id,
    kind,
    mine: message.isMine,
    text: kind === "voice" ? clock(seconds) : (message.text ?? ""),
    sentAt: Date.parse(message.createdAt) || Date.now(),
    status: message.isMine && (message.status === "SEEN" || message.seq <= partnerSeen) ? "seen" : "sent",
    ...(media ? { mediaUrl: media } : {}),
  };
}

function readIntro(): string[] {
  try {
    const value: unknown = JSON.parse(sessionStorage.getItem(INTRO_KEY) ?? "[]");
    return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string").slice(0, 200) : [];
  } catch {
    return [];
  }
}

function snapshot(room: Room): Conversation {
  const ordered = [...room.messages.values()].sort((a, b) => a.seq - b.seq).map(({ message }) => toMessage(message, room.partnerSeen));
  return {
    member: room.member,
    partner: room.partner,
    messages: [...ordered, ...[...room.outbox.values()].map((entry) => entry.message)],
    opening: "live",
    hasOlder: room.hasOlder,
    blocked: room.blocked,
    readOnly: room.readOnly,
    introSeen: readIntro().includes(keyOf(room.member)),
  };
}

function notify(room: Room) {
  const conversation = snapshot(room);
  watchers.get(keyOf(room.member))?.forEach((watcher) => watcher.onChange(conversation));
}

function merge(room: Room, list: ApiMessage[]) {
  for (const message of list) {
    if (message.conversationId !== room.conversationId) continue;
    room.messages.set(message.id, { seq: message.seq, message });
    room.newestSeq = Math.max(room.newestSeq, message.seq);
    room.oldestSeq = room.oldestSeq === null ? message.seq : Math.min(room.oldestSeq, message.seq);
  }
}

/** A conversation that doesn't exist (any more): closed, or blocked when this member blocked them. */
async function closedRoom(member: MemberId): Promise<Conversation> {
  const blocked = blockedHere.has(keyOf(member)) || (await trustApi.blocked().then(({ data }) => data.some((user) => same(user.nickname, member))).catch(() => false));
  return {
    member,
    partner: toSummary({ nickname: member }),
    messages: [],
    opening: "live",
    hasOlder: false,
    blocked,
    readOnly: true,
    introSeen: true,
  };
}

async function locate(member: MemberId): Promise<string | null> {
  const { data } = await chatApi.list();
  const item = data.find((conversation) => same(conversation.partner.nickname, member));
  if (item) return item.id;
  return (await findMatch(member))?.conversationId ?? null;
}

/** Reads in progress, per conversation: the screen, its live updates and a reconnect share one. */
const loading = new Map<string, Promise<Room | null>>();

/** Reads a conversation: header and the newest page the first time, then only what arrived since. */
function load(member: MemberId): Promise<Room | null> {
  const key = keyOf(member);
  const running = loading.get(key);
  if (running) return running;
  const read = readRoom(member).finally(() => loading.delete(key));
  loading.set(key, read);
  return read;
}

async function readRoom(member: MemberId): Promise<Room | null> {
  const known = rooms.get(keyOf(member));
  const conversationId = known?.conversationId ?? (await locate(member));
  if (!conversationId) return null;
  try {
    const [{ data: header }, page] = await Promise.all([
      chatApi.header(conversationId),
      chatApi.messages(conversationId, known ? { after: known.newestSeq } : {}),
    ]);
    const room: Room = known ?? {
      member,
      conversationId,
      partner: toSummary(header.partner),
      messages: new Map(),
      oldestSeq: null,
      newestSeq: 0,
      hasOlder: false,
      partnerSeen: 0,
      reportedSeen: header.mySeenUpToSeq,
      readOnly: false,
      blocked: false,
      outbox: new Map(),
    };
    merge(room, page.data);
    if (!known) room.hasOlder = page.meta?.hasMore ?? false;
    room.partner = toSummary(header.partner);
    room.partnerSeen = header.partnerSeenUpToSeq;
    room.readOnly = header.isReadOnly || !header.canSend || header.status !== "OPEN";
    rooms.set(keyOf(member), room);
    return room;
  } catch (error) {
    if (isApiError(error) && error.status === 404) {
      rooms.delete(keyOf(member));
      return null;
    }
    throw error;
  }
}

async function roomFor(member: MemberId): Promise<Room> {
  const room = rooms.get(keyOf(member)) ?? (await load(member));
  if (!room) throw new Error("This conversation is closed.");
  return room;
}

const purposes = { photo: "CHAT_IMAGE", voice: "CHAT_VOICE" } as const;

async function bodyFor(entry: Outgoing): Promise<SendMessageBody> {
  const { outgoing, message } = entry;
  if (outgoing.kind === "text") return { clientMessageId: message.id, type: "TEXT", text: outgoing.text };
  entry.fileId ??= (await onboardingApi.upload(outgoing.file, purposes[outgoing.kind], () => undefined)).fileId;
  if (outgoing.kind === "photo") return { clientMessageId: message.id, type: "IMAGE", fileId: entry.fileId, ...(outgoing.text ? { text: outgoing.text } : {}) };
  return { clientMessageId: message.id, type: "VOICE", fileId: entry.fileId, durationSeconds: Math.min(120, Math.max(1, Math.round(outgoing.seconds))) };
}

/** Sends one entry; a failure keeps it in the outbox as `failed`. */
async function deliver(room: Room, entry: Outgoing): Promise<ChatMessage> {
  try {
    const { data } = await chatApi.send(room.conversationId, await bodyFor(entry));
    const sent = Array.isArray(data) ? data : [data];
    merge(room, sent);
    room.outbox.delete(entry.message.id);
    notify(room);
    const last = sent.at(-1);
    return last ? toMessage(last, room.partnerSeen) : { ...entry.message, status: "sent" };
  } catch (error) {
    if (isApiError(error) && error.code === "CONVERSATION_CLOSED") room.readOnly = true;
    const failed: ChatMessage = { ...entry.message, status: "failed" };
    room.outbox.set(failed.id, { ...entry, message: failed });
    notify(room);
    return failed;
  }
}

function emit(member: MemberId, event: string, payload: Record<string, unknown>) {
  const handle = sockets.get(keyOf(member));
  if (!handle?.socket.connected) return false;
  handle.socket.emit(event, payload);
  return true;
}

/**
 * User / 07 Chat, 10 AI Suggestions, 11 blocks, with the Socket.IO gateway for live messages,
 * receipts, typing and closing. URLs name the other member; the conversation id is looked up from
 * the (cached) conversation list.
 */
export const apiChatService: ChatService = {
  async getConversations() {
    const { data } = await chatApi.list();
    const preview = getMemberCopy().preview;
    return data.map((item) => ({
      member: item.partner.nickname,
      partner: toSummary(item.partner),
      preview: item.lastMessage?.preview ?? item.lastMessage?.text ?? preview,
      unread: item.unreadCount,
      blocked: false,
    }));
  },
  async getConversation(member) {
    const room = await load(member);
    return room ? snapshot(room) : closedRoom(member);
  },
  async loadOlder(member) {
    const room = await roomFor(member);
    if (room.hasOlder && room.oldestSeq !== null) {
      const page = await chatApi.messages(room.conversationId, { before: room.oldestSeq });
      merge(room, page.data);
      room.hasOlder = page.meta?.hasMore ?? false;
    }
    return snapshot(room);
  },
  async send(member, outgoing) {
    const room = await roomFor(member);
    const message: ChatMessage = { id: crypto.randomUUID(), kind: outgoing.kind, mine: true, text: outgoing.text, sentAt: Date.now(), status: "sent" };
    typingSent.delete(keyOf(member));
    return deliver(room, { message, outgoing });
  },
  async retry(member, id) {
    const room = await roomFor(member);
    const entry = room.outbox.get(id);
    return entry ? deliver(room, entry) : null;
  },
  async discard(member, id) {
    const room = rooms.get(keyOf(member));
    if (room?.outbox.delete(id)) notify(room);
  },
  async getSuggestions(member, signal, again = false) {
    try {
      const room = await roomFor(member);
      const previous = suggestionRequests.get(keyOf(member));
      const request =
        again && previous
          ? await aiApi.regenerate(previous, signal)
          : room.messages.size === 0
            ? await aiApi.opener(room.conversationId, signal)
            : await aiApi.reply(room.conversationId, signal);
      suggestionRequests.set(keyOf(member), request.requestId);
      const lines = request.suggestions.map((item) => item.text).filter(Boolean);
      return request.status === "COMPLETED" && lines.length ? { status: "ready", suggestions: lines } : { status: "unavailable" };
    } catch (error) {
      if (isAborted(error) || signal.aborted) throw error;
      return { status: "unavailable", reason: isApiError(error) && error.status === 429 ? error.message : undefined };
    }
  },
  async markIntroSeen(member) {
    const seen = readIntro();
    if (seen.includes(keyOf(member))) return;
    try {
      sessionStorage.setItem(INTRO_KEY, JSON.stringify([...seen, keyOf(member)]));
    } catch {
      // Blocked storage: MSG-01 may show again after a reload.
    }
  },
  async markSeen(member) {
    const room = rooms.get(keyOf(member));
    if (!room) return;
    const newest = Math.max(0, ...[...room.messages.values()].filter(({ message }) => !message.isMine).map(({ seq }) => seq));
    if (newest <= room.reportedSeen) return;
    room.reportedSeen = newest;
    if (!emit(member, "message:seen", { conversationId: room.conversationId, upToSeq: newest })) await chatApi.seen(room.conversationId, newest).catch(() => undefined);
    invalidate(listKey);
  },
  watchInbox() {
    const handle = acquireSocket();
    const { socket } = handle;
    const mine = new Set<string>();
    const join = () =>
      void chatApi
        .list()
        .then(({ data }) => {
          for (const conversation of data) {
            if (!socket.connected) return;
            socket.emit("joinConversation", { conversationId: conversation.id });
            if (!mine.has(conversation.id)) {
              mine.add(conversation.id);
              listJoins.set(conversation.id, (listJoins.get(conversation.id) ?? 0) + 1);
            }
          }
        })
        .catch(() => undefined);
    const refresh = () => invalidate(listKey);
    socket.on("connect", join);
    socket.on("message:new", refresh);
    socket.on("conversation:closed", refresh);
    if (socket.connected) join();
    return () => {
      socket.off("connect", join);
      socket.off("message:new", refresh);
      socket.off("conversation:closed", refresh);
      // Leave rooms no other list and no open conversation still needs.
      const open = new Set([...watchers.keys()].map((key) => rooms.get(key)?.conversationId));
      for (const id of mine) {
        const left = (listJoins.get(id) ?? 1) - 1;
        if (left > 0) listJoins.set(id, left);
        else {
          listJoins.delete(id);
          if (!open.has(id) && socket.connected) socket.emit("leaveConversation", { conversationId: id });
        }
      }
      handle.release();
    };
  },
  watch(member, watcher) {
    const key = keyOf(member);
    const set = watchers.get(key) ?? new Set<ConversationWatcher>();
    set.add(watcher);
    watchers.set(key, set);
    const handle = sockets.get(key) ?? acquireSocket();
    sockets.set(key, handle);
    const { socket } = handle;
    let typingTimer: ReturnType<typeof setTimeout> | null = null;

    const join = () => {
      const room = rooms.get(key);
      if (room) socket.emit("joinConversation", { conversationId: room.conversationId });
    };
    // Connected (again): join; after a dropped connection also read what was missed.
    let connectedBefore = socket.connected;
    const rejoin = () => {
      join();
      if (!connectedBefore) {
        connectedBefore = true;
        return;
      }
      void load(member)
        .then((loaded) => loaded && notify(loaded))
        .catch(() => undefined);
    };
    const onMessage = (message: ApiMessage) => {
      const room = rooms.get(key);
      if (!room || message.conversationId !== room.conversationId) return;
      merge(room, [message]);
      if (!message.isMine) {
        socket.emit("message:delivered", { conversationId: room.conversationId, upToSeq: message.seq });
        watcher.onTyping(false);
      }
      notify(room);
      invalidate(listKey);
      if (message.type === "DATE" || message.type === "DATE_INVITE") invalidate(cacheKeys.dates, cacheKeys.matches);
    };
    const onReceipt = (event: ReceiptEvent) => {
      const room = rooms.get(key);
      if (!room || event.conversationId !== room.conversationId || !same(event.nickname, room.partner.name)) return;
      room.partnerSeen = Math.max(room.partnerSeen, event.seenUpToSeq);
      notify(room);
    };
    const onTyping = (event: TypingEvent) => {
      const room = rooms.get(key);
      if (!room || event.conversationId !== room.conversationId || !same(event.nickname, room.partner.name)) return;
      watcher.onTyping(event.isTyping);
      if (typingTimer) clearTimeout(typingTimer);
      if (event.isTyping) typingTimer = setTimeout(() => watcher.onTyping(false), TYPING_TIMEOUT_MS);
    };
    const onClosed = (event: ClosedEvent) => {
      const room = rooms.get(key);
      if (!room || event.conversationId !== room.conversationId) return;
      room.readOnly = true;
      notify(room);
      invalidate(cacheKeys.matches, cacheKeys.conversations);
    };

    socket.on("connect", rejoin);
    socket.on("message:new", onMessage);
    socket.on("conversation:receipt", onReceipt);
    socket.on("typing", onTyping);
    socket.on("conversation:closed", onClosed);
    void roomFor(member)
      .then(() => socket.connected && join())
      .catch(() => undefined);

    return () => {
      if (typingTimer) clearTimeout(typingTimer);
      socket.off("connect", rejoin);
      socket.off("message:new", onMessage);
      socket.off("conversation:receipt", onReceipt);
      socket.off("typing", onTyping);
      socket.off("conversation:closed", onClosed);
      set.delete(watcher);
      if (set.size > 0) return;
      watchers.delete(key);
      const room = rooms.get(key);
      if (room && socket.connected && !listJoins.has(room.conversationId)) socket.emit("leaveConversation", { conversationId: room.conversationId });
      sockets.delete(key);
      handle.release();
    };
  },
  setTyping(member, typing) {
    const room = rooms.get(keyOf(member));
    if (!room || room.readOnly) return;
    const last = typingSent.get(keyOf(member));
    const now = Date.now();
    if (typing ? last?.typing && now - last.at < TYPING_EVERY_MS : !last?.typing) return;
    if (emit(member, "typing", { conversationId: room.conversationId, isTyping: typing })) typingSent.set(keyOf(member), { typing, at: now });
  },
  async block(member) {
    await trustApi.block(member, "CHAT");
    blockedHere.add(keyOf(member));
    const room = rooms.get(keyOf(member));
    if (room) {
      room.blocked = true;
      room.readOnly = true;
      notify(room);
    }
  },
  async getBlocked() {
    const { data } = await trustApi.blocked();
    return [...data].sort((a, b) => Date.parse(a.blockedAt) - Date.parse(b.blockedAt)).map((user) => user.nickname);
  },
  async unblock(member) {
    await trustApi.unblock(member);
    blockedHere.delete(keyOf(member));
    rooms.delete(keyOf(member));
  },
};
