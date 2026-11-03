/** User / 08 - Games (This or That) and the `game:answer` / `game:completed` socket events. Enums are case-sensitive. */

export type GameChoiceKey = "A" | "B";

export type GameOption = { title: string; description: string | null; imageFileId: string | null };

export type GameQuestionData = {
  id: string;
  index: number;
  prompt: string;
  optionA: GameOption;
  optionB: GameOption;
  myChoice: GameChoiceKey | null;
  /** Hidden until this member has answered the same question (no peeking, D-113). */
  partnerChoice: GameChoiceKey | null;
  partnerAnswered: boolean;
  isMatch: boolean | null;
};

export type GameData = {
  id: string;
  conversationId: string;
  gameType: "THIS_OR_THAT";
  status: "IN_PROGRESS" | "COMPLETED" | string;
  startedAt: string;
  completedAt: string | null;
  partner: { nickname: string; availability: "ACTIVE" | "UNAVAILABLE" };
  questions: GameQuestionData[];
  progress: { myAnsweredCount: number; partnerAnsweredCount: number; totalQuestions: number };
  result: unknown;
  isNew?: boolean;
};

export type AnswerData = {
  questionId: string;
  questionIndex: number;
  choice: GameChoiceKey;
  waitingForPartner: boolean;
  partnerChoice: GameChoiceKey | null;
  isMatch: boolean | null;
  completed: boolean;
};

/** `game:answer`: the partner answered; their choice is revealed once both have. */
export type GameAnswerEvent = {
  gameId: string;
  questionId: string;
  questionIndex: number;
  partnerAnswered: boolean;
  partnerRevealed: boolean;
  partnerChoice?: GameChoiceKey;
  isMatch?: boolean;
};
