import type { MemberId } from "@/data/portal/types";
import { getGamePage } from "@/stores/portal-store";
import type { GameService } from "@/lib/portal/game-service";

/**
 * MOCK — stands in for the real games API so every W07 state can be reviewed.
 * Not for production: replace `gameService` in ./game-service.ts.
 *
 * - The match answers ~2.5s after you do; their picks follow a fixed pattern (first choice on odd rounds).
 * - In WildRose's game the match leaves after the first question (GAME-LEFT).
 * - Nothing is stored: a reload starts the game again.
 */
const ANSWER_MS = 2500;
const LEAVES: MemberId[] = ["wildrose"];

const wait = (ms: number, signal: AbortSignal) =>
  new Promise<void>((resolve, reject) => {
    const timer = setTimeout(resolve, ms);
    signal.addEventListener("abort", () => {
      clearTimeout(timer);
      reject(new DOMException("Stopped", "AbortError"));
    });
  });

export const mockGameService: GameService = {
  async start() {
    return { questions: getGamePage().questions, answers: [], partner: [] };
  },
  async answer(member, round, _choice, signal) {
    await wait(ANSWER_MS, signal);
    if (LEAVES.includes(member) && round > 0) return { status: "left" };
    const { choices } = getGamePage().questions[round];
    return { status: "answered", choice: choices[round % 2].value };
  },
};
