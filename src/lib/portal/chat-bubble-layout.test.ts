import { describe, expect, it } from "vitest";
import { chatPage } from "@/data/portal/chats";
import type { ChatMessage } from "@/lib/portal/chat-service";
import { bubbleSide, groupsWithPrevious, persistentStatus } from "@/lib/portal/chat-bubble-layout";

const message = (id: string, mine: boolean, status: ChatMessage["status"] = "sent", kind: ChatMessage["kind"] = "text"): ChatMessage => ({
  id,
  kind,
  mine,
  text: id,
  sentAt: 1,
  status,
});

describe("chat bubble layout", () => {
  it("puts own messages on the right and the other member's on the left", () => {
    expect(bubbleSide("own")).toBe("end");
    expect(bubbleSide("incoming")).toBe("start");
  });

  it("keeps the status of the last own message and of every failed one", () => {
    const list = [message("a", true, "failed"), message("b", false), message("c", true, "seen"), message("d", false), message("sys", true, "sent", "system")];
    expect([...persistentStatus(list)].sort()).toEqual(["a", "c"]);
    expect(persistentStatus([message("x", false)]).size).toBe(0);
  });

  it("groups consecutive bubbles from the same side", () => {
    const list = [message("a", true), message("b", true), message("c", false), message("d", false, "sent", "date"), message("e", false)];
    expect(list.map((_, index) => groupsWithPrevious(list, index))).toEqual([false, true, false, false, false]);
  });
});

describe("the composer's + menu", () => {
  it("holds exactly the six actions in order, each with an icon and a label", () => {
    const { items } = chatPage.menu;
    expect(items.map((item) => item.id)).toEqual(["ai", "safety", "voice", "photo", "plan", "game"]);
    expect(items.map((item) => item.label)).toEqual(["AI help", "Safety", "Voice", "Photo", "Plan date", "Play game"]);
    for (const item of items) expect(item.icon).toMatch(/^[a-z0-9-]+$/);
    expect(chatPage.menu.plan.step).toBe("VENUES");
    expect(chatPage.menu.game.step).toBe("GAMES");
  });
});
