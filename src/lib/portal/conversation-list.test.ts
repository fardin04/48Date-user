import { describe, expect, it } from "vitest";
import type { ConversationSummary } from "@/lib/portal/chat-service";
import { conversationRowStatus, openConversations } from "./conversation-list";

/** Phase 12: the conversation list orders by the last message, shows unread counts and drops closed conversations. */
const row = (member: string, at: number | null, unread = 0, blocked = false) =>
  ({ member, partner: { id: member, name: member }, preview: "", unread, blocked, at }) as unknown as ConversationSummary;

describe("openConversations", () => {
  it("puts the newest last message first, whatever order the API used", () => {
    const list = [row("a", 1_000), row("b", 3_000), row("c", null), row("d", 2_000)];
    expect(openConversations(list).map((conversation) => conversation.member)).toEqual(["b", "d", "a", "c"]);
  });

  it("moves a conversation to the top when a refetch after a new message brings a newer time", () => {
    const before = [row("a", 3_000), row("b", 2_000)];
    const after = [row("a", 3_000), row("b", 4_000, 1)];
    expect(openConversations(before)[0].member).toBe("a");
    expect(openConversations(after)[0]).toMatchObject({ member: "b", unread: 1 });
  });

  it("drops blocked or closed conversations (CHAT-EMPTY once none are left)", () => {
    expect(openConversations([row("a", 1, 0, true), row("b", 2)]).map((conversation) => conversation.member)).toEqual(["b"]);
    expect(openConversations([row("a", 1, 0, true)])).toEqual([]);
  });

  it("does not reorder the cached array in place", () => {
    const list = [row("a", 1), row("b", 2)];
    openConversations(list);
    expect(list.map((conversation) => conversation.member)).toEqual(["a", "b"]);
  });
});

describe("conversationRowStatus", () => {
  it("shows the unread count with a screen-reader label, capped at 99+", () => {
    expect(conversationRowStatus(row("a", null, 3), "{count} unread").badge).toEqual({ text: "3", label: "3 unread" });
    expect(conversationRowStatus(row("a", null, 120), "{count} unread").badge?.text).toBe("99+");
  });

  it("has no badge once the count is cleared, and no time without a message", () => {
    const status = conversationRowStatus(row("a", null, 0), "{count} unread");
    expect(status.badge).toBeUndefined();
    expect(status.meta).toBeUndefined();
  });
});
