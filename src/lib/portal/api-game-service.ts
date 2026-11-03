import type { GameQuestion } from "@/data/portal/games";
import type { MemberId } from "@/data/portal/types";
import { onCacheClear } from "@/lib/api/cache";
import { clientErrorCodes, ApiError, isApiError } from "@/lib/api/errors";
import { chatApi } from "@/lib/api/modules/chat-api";
import { gamesApi } from "@/lib/api/modules/games-api";
import { acquireSocket } from "@/lib/api/socket";
import type { GameAnswerEvent, GameChoiceKey, GameData } from "@/lib/api/types/games";
import { findMatch } from "@/lib/portal/api-match-lookup";
import type { GameService, GameState, PartnerAnswer } from "@/lib/portal/game-service";

/** The game is read again this often as a fallback (chained, never overlapping): rarely while the socket is up. */
const FALLBACK_POLL_MS = 4000;
const CONNECTED_POLL_MS = 15_000;

const same = (a: string, b: string) => a.toLowerCase() === b.toLowerCase();

/** The game with each match, kept from `start` so answers know the game and question ids. */
const games = new Map<string, GameData>();
onCacheClear(() => games.clear());

function toQuestion(question: GameData["questions"][number]): GameQuestion {
  return {
    prompt: question.prompt,
    choices: [
      { value: "A", label: question.optionA.title },
      { value: "B", label: question.optionB.title },
    ],
  };
}

function toState(game: GameData): GameState {
  const ordered = [...game.questions].sort((a, b) => a.index - b.index);
  const answers = ordered.flatMap((question) => (question.myChoice ? [question.myChoice] : []));
  const partner = ordered.slice(0, answers.length).flatMap((question) => (question.partnerChoice ? [question.partnerChoice] : []));
  return { questions: ordered.map(toQuestion), answers, partner };
}

async function conversationOf(member: MemberId) {
  const { data } = await chatApi.list();
  const conversation = data.find((item) => same(item.partner.nickname, member));
  return conversation?.id ?? (await findMatch(member))?.conversationId ?? null;
}

const stopped = () => new ApiError(0, clientErrorCodes.aborted, "Request cancelled.");

/** Waits for the match's choice on one question: the socket's `game:answer`, with a slow read as a fallback. */
function partnerChoice(game: GameData, questionId: string, signal: AbortSignal): Promise<PartnerAnswer> {
  return new Promise((resolve, reject) => {
    const { socket, release } = acquireSocket();
    let timer: ReturnType<typeof setTimeout> | null = null;
    const finish = (result: PartnerAnswer | null, error?: unknown) => {
      if (timer) clearTimeout(timer);
      socket.off("game:answer", onAnswer);
      signal.removeEventListener("abort", onAbort);
      release();
      if (result) resolve(result);
      else reject(error);
    };
    const onAnswer = (event: GameAnswerEvent) => {
      if (event.gameId === game.id && event.questionId === questionId && event.partnerRevealed && event.partnerChoice) {
        finish({ status: "answered", choice: event.partnerChoice });
      }
    };
    const onAbort = () => finish(null, stopped());
    const poll = () => {
      timer = setTimeout(async () => {
        try {
          const { data } = await gamesApi.get(game.id, signal);
          const question = data.questions.find((item) => item.id === questionId);
          if (data.partner.availability === "UNAVAILABLE") return finish({ status: "left" });
          if (question?.partnerChoice) return finish({ status: "answered", choice: question.partnerChoice });
        } catch (error) {
          if (signal.aborted) return;
          if (isApiError(error) && error.status === 404) return finish({ status: "left" });
        }
        poll();
      }, socket.connected ? CONNECTED_POLL_MS : FALLBACK_POLL_MS);
    };
    socket.on("game:answer", onAnswer);
    signal.addEventListener("abort", onAbort, { once: true });
    poll();
  });
}

/** User / 08 - Games, with the `game:answer` socket event for the match's choices. */
export const apiGameService: GameService = {
  async start(member) {
    const conversationId = await conversationOf(member);
    if (!conversationId) throw new Error("This conversation is closed.");
    const { data } = await gamesApi.start(conversationId);
    games.set(member.toLowerCase(), data);
    return toState(data);
  },
  async answer(member, round, choice, signal) {
    const game = games.get(member.toLowerCase());
    const question = game ? [...game.questions].sort((a, b) => a.index - b.index)[round] : undefined;
    if (!game || !question) throw new Error("The game isn't loaded.");
    const key = choice as GameChoiceKey;
    try {
      const { data } = await gamesApi.answer(game.id, question.id, key);
      if (!data.waitingForPartner && data.partnerChoice) return { status: "answered", choice: data.partnerChoice };
    } catch (error) {
      // Answered already (another tab): wait for the match like after a fresh answer.
      if (!(isApiError(error) && error.code === "GAME_ALREADY_ANSWERED")) {
        if (isApiError(error) && error.code === "CONVERSATION_CLOSED") return { status: "left" };
        throw error;
      }
    }
    return partnerChoice(game, question.id, signal);
  },
};
