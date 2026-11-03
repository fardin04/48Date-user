import { invalidate } from "../cache";
import { api } from "../client";
import { endpoints } from "../endpoints";
import type { AnswerData, GameChoiceKey, GameData } from "../types/games";
import { cacheKeys } from "./cache-keys";

/** User / 08 - Games: one This or That game per conversation. */
export const gamesApi = {
  /** Starts the conversation's game (posting the invitation into the chat) or returns the existing one. */
  async start(conversationId: string) {
    const result = await api.post<GameData>(endpoints.conversations.games(conversationId), { body: { gameType: "THIS_OR_THAT" } });
    invalidate(cacheKeys.conversations);
    return result;
  },
  get: (gameId: string, signal?: AbortSignal) => api.get<GameData>(endpoints.games.detail(gameId), { signal }),
  answer: (gameId: string, questionId: string, choice: GameChoiceKey) =>
    api.post<AnswerData>(endpoints.games.answers(gameId), { body: { questionId, choice } }),
};
