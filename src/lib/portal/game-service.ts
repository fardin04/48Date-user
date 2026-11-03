import type { GameQuestion } from "@/data/portal/games";
import type { MemberId } from "@/data/portal/types";
import { apiEnabled } from "@/lib/api/config";
import { apiGameService } from "@/lib/portal/api-game-service";
import { mockGameService } from "@/lib/portal/mocks/mock-game-service";

/** The match's answer to one question, or that they left the game (GAME-LEFT). */
export type PartnerAnswer = { status: "answered"; choice: string } | { status: "left" };

/** A game in progress: its questions, the member's answers so far and the match's revealed ones. */
export type GameState = {
  questions: GameQuestion[];
  /** The member's choice per round, in order. */
  answers: string[];
  /** The match's choice per round, revealed only for rounds the member has answered. */
  partner: string[];
};

/**
 * Contract the This or That game talks to (rule 37). Each choice is sent on its own; the partner's
 * answer arrives from the service and stays hidden until both have chosen (handoff).
 */
export type GameService = {
  /** Starts the game with this match, or resumes the one already played (one game per conversation). */
  start: (member: MemberId) => Promise<GameState>;
  /** Sends the member's choice and resolves once the match has answered (or left). */
  answer: (member: MemberId, round: number, choice: string, signal: AbortSignal) => Promise<PartnerAnswer>;
};

/** The API (`NEXT_PUBLIC_API_BASE_URL` set) or the marked mock. */
export const gameService: GameService = apiEnabled ? apiGameService : mockGameService;
