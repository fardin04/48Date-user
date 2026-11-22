import { describe, expect, it } from "vitest";
import type { ApiMessage } from "@/lib/api/types/chat";
import type { ChatMessage } from "@/lib/portal/chat-service";
import { claimFor, ledgerMessages, mergeMessages, type Ledger } from "@/lib/portal/chat-optimistic";

const conversationId = "c1";
const fresh = (): Ledger => ({ conversationId, messages: new Map(), outbox: new Map(), keys: new Map(), newestSeq: 0, oldestSeq: null });
const optimistic = (id: string, text: string): ChatMessage => ({ id, kind: "text", mine: true, text, sentAt: 1, status: "sending" });
const server = (id: string, seq: number, text: string, isMine = true): ApiMessage => ({
  id,
  conversationId,
  seq,
  senderNickname: null,
  isMine,
  type: "TEXT",
  text,
  file: null,
  payload: null,
  status: "SENT",
  createdAt: "2026-11-18T10:00:00.000Z",
});
const toMessage = (message: ApiMessage): ChatMessage => ({ id: message.id, kind: "text", mine: message.isMine, text: message.text ?? "", sentAt: 1, status: "sent" });
const view = (ledger: Ledger) => ledgerMessages(ledger, toMessage).map(({ key, status }) => `${key}:${status}`);

describe("one bubble per sent message (owner report 2026-11-16)", () => {
  it("send → POST response → socket echo", () => {
    const ledger = fresh();
    ledger.outbox.set("tmp", { message: optimistic("tmp", "Hi") });
    expect(view(ledger)).toEqual(["tmp:sending"]);
    mergeMessages(ledger, [server("m1", 1, "Hi")], "tmp");
    expect(view(ledger)).toEqual(["tmp:sent"]);
    mergeMessages(ledger, [server("m1", 1, "Hi")]);
    expect(view(ledger)).toEqual(["tmp:sent"]);
  });

  it("send → socket echo → POST response", () => {
    const ledger = fresh();
    ledger.outbox.set("tmp", { message: optimistic("tmp", "Hi") });
    mergeMessages(ledger, [server("m1", 1, "Hi")]);
    expect(view(ledger)).toEqual(["tmp:sent"]);
    mergeMessages(ledger, [server("m1", 1, "Hi")], "tmp");
    expect(view(ledger)).toEqual(["tmp:sent"]);
  });

  it("an incoming message never claims an optimistic one", () => {
    const ledger = fresh();
    ledger.outbox.set("tmp", { message: optimistic("tmp", "Hi") });
    expect(claimFor(ledger, server("m9", 1, "Hi", false))).toBeUndefined();
    mergeMessages(ledger, [server("m9", 1, "Hi", false)]);
    expect(view(ledger)).toEqual(["m9:sent", "tmp:sending"]);
  });

  it("a failed message is not claimed by an echo of another text, and two equal texts claim one each", () => {
    const ledger = fresh();
    ledger.outbox.set("bad", { message: { ...optimistic("bad", "Hi"), status: "failed" } });
    ledger.outbox.set("a", { message: optimistic("a", "Hi") });
    ledger.outbox.set("b", { message: optimistic("b", "Hi") });
    mergeMessages(ledger, [server("m1", 1, "Hi")]);
    mergeMessages(ledger, [server("m2", 2, "Hi")]);
    expect(view(ledger)).toEqual(["a:sent", "b:sent", "bad:failed"]);
  });

  it("a reconnect re-reading the page adds nothing twice", () => {
    const ledger = fresh();
    mergeMessages(ledger, [server("m1", 1, "Hi"), server("m2", 2, "Yo", false)]);
    mergeMessages(ledger, [server("m1", 1, "Hi"), server("m2", 2, "Yo", false)]);
    expect(view(ledger)).toEqual(["m1:sent", "m2:sent"]);
    expect(ledger.newestSeq).toBe(2);
  });
});
