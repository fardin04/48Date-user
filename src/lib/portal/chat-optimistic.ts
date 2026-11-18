import type { ApiMessage } from "@/lib/api/types/chat";
import type { ChatMessage } from "@/lib/portal/chat-service";

/**
 * One conversation's messages as the API service holds them: the server copies (by API id), the
 * optimistic sends still in flight or failed (by client id), and which client id each server copy
 * replaced. A sent message is one entry for its whole life: "Sending…" → "Sent" → "Seen", never a
 * second copy, whichever arrives first of the POST response and the socket's `message:new`.
 */
export type Ledger<Entry extends { message: ChatMessage } = { message: ChatMessage }> = {
  conversationId: string;
  messages: Map<string, { seq: number; message: ApiMessage }>;
  outbox: Map<string, Entry>;
  /** Server id → the client id its optimistic copy had (keeps the React key stable). */
  keys: Map<string, string>;
  newestSeq: number;
  oldestSeq: number | null;
};

const ownKinds: Partial<Record<ApiMessage["type"], ChatMessage["kind"]>> = { TEXT: "text", IMAGE: "photo", VOICE: "voice" };

/**
 * The in-flight optimistic message a server copy of one's own message answers. The API doesn't echo
 * `clientMessageId`, so it is matched by kind and text (voice notes by kind), oldest first.
 */
export function claimFor(ledger: Ledger, message: ApiMessage): string | undefined {
  const kind = ownKinds[message.type];
  if (!message.isMine || !kind) return undefined;
  for (const [id, { message: sent }] of ledger.outbox) {
    if (sent.status === "sending" && sent.kind === kind && (kind === "voice" || sent.text === (message.text ?? ""))) return id;
  }
  return undefined;
}

/** Adds server copies; `clientId` names the optimistic message they answer (the POST response), otherwise it is matched. */
export function mergeMessages(ledger: Ledger, list: ApiMessage[], clientId?: string) {
  for (const message of list) {
    if (message.conversationId !== ledger.conversationId) continue;
    const claimed = ledger.keys.has(message.id) ? undefined : (clientId ?? (ledger.messages.has(message.id) ? undefined : claimFor(ledger, message)));
    if (claimed) {
      ledger.keys.set(message.id, claimed);
      ledger.outbox.delete(claimed);
    }
    ledger.messages.set(message.id, { seq: message.seq, message });
    ledger.newestSeq = Math.max(ledger.newestSeq, message.seq);
    ledger.oldestSeq = ledger.oldestSeq === null ? message.seq : Math.min(ledger.oldestSeq, message.seq);
  }
}

/** What the screen shows: server copies by `seq`, then the optimistic ones, each with its stable key. */
export function ledgerMessages(ledger: Ledger, toMessage: (message: ApiMessage) => ChatMessage): ChatMessage[] {
  const ordered = [...ledger.messages.values()]
    .sort((a, b) => a.seq - b.seq)
    .map(({ message }) => ({ ...toMessage(message), key: ledger.keys.get(message.id) ?? message.id }));
  return [...ordered, ...[...ledger.outbox.values()].map(({ message }) => ({ ...message, key: message.id }))];
}
