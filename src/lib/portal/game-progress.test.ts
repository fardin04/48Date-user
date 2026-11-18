import { describe, expect, it } from "vitest";
import type { GameState } from "./game-service";
import { answersInCommon, partnerAnswered, resumePoint } from "./game-progress";

/** Phase 19: resuming a game, counting the result, gating Next on the match's answer. */
const questions = Array.from({ length: 10 }, (_, index) => ({ prompt: `Q${index}`, choices: [] })) as unknown as GameState["questions"];
const state = (answers: string[], partner: string[]): GameState => ({ questions, answers, partner });

describe("resumePoint", () => {
  it("opens the first question the member hasn't answered", () => {
    expect(resumePoint(state([], []))).toEqual({ phase: "question", round: 0 });
    expect(resumePoint(state(["A", "B", "A"], ["A", "A", "B"]))).toEqual({ phase: "question", round: 3 });
  });

  it("waits on a round the member answered and the match hasn't", () => {
    expect(resumePoint(state(["A", "B"], ["A"]))).toEqual({ phase: "wait", round: 1 });
  });

  it("shows the result once both answered all ten", () => {
    const all = Array.from({ length: 10 }, () => "A");
    expect(resumePoint(state(all, all))).toEqual({ phase: "result", round: 9 });
  });
});

describe("result and gating", () => {
  it("counts the rounds answered the same", () => {
    expect(answersInCommon(["A", "B", "A", "B"], ["A", "A", "A", "A"])).toBe(2);
    expect(answersInCommon(["A", "B"], ["A"])).toBe(1);
  });

  it("enables Next only after the match answered this round", () => {
    expect(partnerAnswered(["A"], 1)).toBe(false);
    expect(partnerAnswered(["A", "B"], 1)).toBe(true);
  });
});
