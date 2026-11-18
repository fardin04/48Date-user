import type { GameState } from "@/lib/portal/game-service";

/**
 * Where a started or resumed game opens: the result once both answered every round; the wait when
 * the member answered a round the match hasn't yet; otherwise the first question the member hasn't answered.
 */
export function resumePoint({ questions, answers, partner }: GameState): { phase: "result" | "wait" | "question"; round: number } {
  const total = questions.length;
  if (answers.length >= total && partner.length >= total) return { phase: "result", round: total - 1 };
  if (answers.length > partner.length) return { phase: "wait", round: answers.length - 1 };
  return { phase: "question", round: answers.length };
}

/** Rounds where both chose the same answer (GAME-RESULT). */
export const answersInCommon = (answers: string[], partner: string[]) => answers.filter((answer, index) => answer === partner[index]).length;

/** GAME-WAIT's Next enables only once the match has answered this round (nothing is revealed before). */
export const partnerAnswered = (partner: string[], round: number) => partner.length > round;
