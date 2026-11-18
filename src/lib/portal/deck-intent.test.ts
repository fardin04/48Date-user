import { describe, expect, it } from "vitest";
import { deckIntent, dragDecision, LOW_WATER, matchToShow, needsNextPage, SWIPE_PX, swipeAction } from "./deck-intent";

describe("deck decisions", () => {
  it("maps each decision to the API's swipe action", () => {
    expect(swipeAction("pass")).toBe("PASS");
    expect(swipeAction("like")).toBe("LIKE");
    expect(swipeAction("super")).toBe("SUPER_LIKE");
  });

  it("decides a drag only past 96 px: left passes, right likes", () => {
    expect(SWIPE_PX).toBe(96);
    expect(dragDecision(0)).toBeNull();
    expect(dragDecision(95)).toBeNull();
    expect(dragDecision(-95)).toBeNull();
    expect(dragDecision(96)).toBe("like");
    expect(dragDecision(-96)).toBe("pass");
    expect(dragDecision(400)).toBe("like");
  });

  it("asks for the next page only below 3 unreviewed cards, and only while there is more", () => {
    expect(LOW_WATER).toBe(3);
    expect(needsNextPage(3, true)).toBe(false);
    expect(needsNextPage(2, true)).toBe(true);
    expect(needsNextPage(0, true)).toBe(true);
    expect(needsNextPage(0, false)).toBe(false);
  });

  it("hands a profile decision to the deck once", () => {
    deckIntent.set({ member: "Wildflower", decision: "like" });
    expect(deckIntent.take()).toEqual({ member: "Wildflower", decision: "like" });
    expect(deckIntent.take()).toBeNull();
  });
});

describe("MATCH-NEW", () => {
  it("shows the swipe's own match first, even when a background match waits", () => {
    expect(matchToShow("GoldenHour", "RiverStone", false)).toBe("GoldenHour");
    expect(matchToShow("GoldenHour", "RiverStone", true)).toBe("GoldenHour");
  });

  it("shows a background match from /matches/unseen until it is dismissed", () => {
    expect(matchToShow(null, "RiverStone", false)).toBe("RiverStone");
    expect(matchToShow(null, "RiverStone", true)).toBeNull();
    expect(matchToShow(null, null, false)).toBeNull();
  });
});
