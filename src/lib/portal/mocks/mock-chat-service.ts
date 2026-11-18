import { isSampleMember, type MemberId, type MemberSummary } from "@/data/portal/types";
import { getInboxPage, getMember, getMemberCopy } from "@/stores/portal-store";
import type { ChatMessage, ChatService, Conversation, ConversationWatcher, MessageKind } from "@/lib/portal/chat-service";

/**
 * MOCK — stands in for the real messaging API so every W05 state can be reviewed.
 * Not for production: replace `chatService` in ./chat-service.ts.
 *
 * - Messages are "delivered" after ~0.8s, and fail while the browser is offline (CHAT-FAILED).
 * - Suggestions take ~1.5s; every third request fails (AI-ERROR). "Try another" rotates the list.
 * - Blocking hides the conversation. State lives in sessionStorage for this tab, validated on read;
 *   photos and recordings never leave the browser (only the caption / duration is stored).
 */
const STORAGE_KEY = "48date.mock.chats";
const SEND_MS = 800;
const SUGGEST_MS = 1500;
const FAIL_EVERY = 3;
const MAX_TEXT = 1000;
const KINDS: MessageKind[] = ["text", "photo", "voice"];

const SUGGESTIONS = [
  "What’s your favorite place to take photos?",
  "Coffee and a photo walk sounds like a perfect afternoon.",
  "Film or digital — which one feels more like you?",
  "What’s the best coffee you’ve had in the city?",
];

type Stored = { messages: Partial<Record<MemberId, ChatMessage[]>>; blocked: MemberId[]; intro: MemberId[]; aiCalls: number };

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null && !Array.isArray(value);
const isMember = (value: unknown): value is MemberId => typeof value === "string" && isSampleMember(value);

function partnerOf(member: MemberId): MemberSummary {
  const sample = getMember(member);
  return sample
    ? { id: member, name: sample.name, age: sample.age, photo: sample.photo, verified: sample.verified }
    : { id: member, name: member, age: null, photo: getMemberCopy().placeholder, verified: false };
}

function validMessage(value: unknown): ChatMessage | null {
  if (!isRecord(value)) return null;
  const { id, kind, text, sentAt, status } = value;
  if (typeof id !== "string" || typeof text !== "string" || typeof sentAt !== "number") return null;
  if (!KINDS.some((option) => option === kind) || (status !== "sent" && status !== "failed" && status !== "sending")) return null;
  // A send left "sending" by a reload never finished.
  return { id, kind: kind as MessageKind, mine: true, text: text.slice(0, MAX_TEXT), sentAt, status: status === "sending" && !inFlight.has(id) ? "failed" : status };
}

function read(): Stored {
  const empty: Stored = { messages: {}, blocked: [], intro: [], aiCalls: 0 };
  try {
    const value: unknown = JSON.parse(sessionStorage.getItem(STORAGE_KEY) ?? "null");
    if (!isRecord(value)) return empty;
    const messages: Stored["messages"] = {};
    if (isRecord(value.messages)) {
      for (const [member, list] of Object.entries(value.messages)) {
        if (isMember(member) && Array.isArray(list)) messages[member] = list.map(validMessage).filter((message): message is ChatMessage => message !== null);
      }
    }
    const members = (list: unknown) => (Array.isArray(list) ? list.filter(isMember) : []);
    const aiCalls = Number.isInteger(value.aiCalls) && (value.aiCalls as number) >= 0 ? (value.aiCalls as number) : 0;
    return { messages, blocked: members(value.blocked), intro: members(value.intro), aiCalls };
  } catch {
    return empty;
  }
}

function write(state: Stored) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Blocked storage: the conversation then lasts only for this page.
  }
}

/** Sends in this tab still waiting for "delivery". */
const inFlight = new Set<string>();
const listeners = new Map<MemberId, Set<ConversationWatcher>>();

function update(member: MemberId, change: (messages: ChatMessage[]) => ChatMessage[]) {
  const state = read();
  write({ ...state, messages: { ...state.messages, [member]: change(state.messages[member] ?? []) } });
  const set = listeners.get(member);
  if (set?.size) void mockChatService.getConversation(member).then((conversation) => set.forEach((watcher) => watcher.onChange(conversation)));
}

/** "Delivers" one message after a moment: the bubble shows "Sending…" until then. */
async function deliverLater(member: MemberId, id: string): Promise<ChatMessage | null> {
  inFlight.add(id);
  update(member, (messages) => messages.map((message) => (message.id === id ? { ...message, status: "sending" } : message)));
  await wait(SEND_MS);
  inFlight.delete(id);
  const status = delivered() ? "sent" : "failed";
  let result: ChatMessage | null = null;
  update(member, (messages) =>
    messages.map((message) => {
      if (message.id !== id) return message;
      result = { ...message, status, sentAt: Date.now() };
      return result;
    }),
  );
  return result;
}

const wait = (ms: number, signal?: AbortSignal) =>
  new Promise<void>((resolve, reject) => {
    const timer = setTimeout(resolve, ms);
    signal?.addEventListener("abort", () => {
      clearTimeout(timer);
      reject(new DOMException("Stopped", "AbortError"));
    });
  });

const delivered = () => navigator.onLine;

export const mockChatService: ChatService = {
  async getConversations() {
    const { blocked, messages } = read();
    return getInboxPage().conversations.map((sample) => ({
      member: sample.member,
      partner: partnerOf(sample.member),
      preview: sample.preview,
      unread: 0,
      blocked: blocked.includes(sample.member),
      // Sample previews have no time; one the member sent in this tab has.
      at: messages[sample.member]?.at(-1)?.sentAt ?? null,
    }));
  },
  async getConversation(member): Promise<Conversation> {
    const state = read();
    const opening = getInboxPage().conversations.find((sample) => sample.member === member)?.opening ?? "firstHello";
    return {
      member,
      partner: partnerOf(member),
      messages: state.messages[member] ?? [],
      opening,
      hasOlder: false,
      blocked: state.blocked.includes(member),
      readOnly: false,
      introSeen: state.intro.includes(member),
    };
  },
  async loadOlder(member) {
    return mockChatService.getConversation(member);
  },
  async send(member, { kind, text }) {
    const message: ChatMessage = { id: crypto.randomUUID(), kind, mine: true, text: text.slice(0, MAX_TEXT), sentAt: Date.now(), status: "sending" };
    update(member, (messages) => [...messages, message]);
    return (await deliverLater(member, message.id)) ?? { ...message, status: "failed" };
  },
  async retry(member, id) {
    return deliverLater(member, id);
  },
  async discard(member, id) {
    update(member, (messages) => messages.filter((message) => message.id !== id));
  },
  async getSuggestions(_member, signal) {
    const state = read();
    const call = state.aiCalls + 1;
    write({ ...state, aiCalls: call });
    await wait(SUGGEST_MS, signal);
    if (call % FAIL_EVERY === 0 || !navigator.onLine) return { status: "unavailable" };
    const offset = ((call - 1) * 2) % SUGGESTIONS.length;
    return { status: "ready", suggestions: [SUGGESTIONS[offset], SUGGESTIONS[(offset + 1) % SUGGESTIONS.length]] };
  },
  async markSeen() {},
  watch(member, watcher) {
    const set = listeners.get(member) ?? new Set();
    set.add(watcher);
    listeners.set(member, set);
    return () => set.delete(watcher);
  },
  watchInbox() {
    return () => undefined;
  },
  setTyping() {},
  async markIntroSeen(member) {
    const state = read();
    if (!state.intro.includes(member)) write({ ...state, intro: [...state.intro, member] });
  },
  async block(member) {
    const state = read();
    if (!state.blocked.includes(member)) write({ ...state, blocked: [...state.blocked, member] });
  },
  async getBlocked() {
    return read().blocked;
  },
  async unblock(member) {
    await wait(SEND_MS);
    const state = read();
    write({ ...state, blocked: state.blocked.filter((id) => id !== member) });
  },
};
