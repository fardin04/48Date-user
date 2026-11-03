/** User / 10 - AI Suggestions. Enums are case-sensitive. */

export type SuggestionTone = "FLIRTY" | "CASUAL" | "WITTY";

export type SuggestionStatus = "QUEUED" | "GENERATING" | "COMPLETED" | "FAILED";

export type SuggestionRequest = {
  requestId: string;
  conversationId: string;
  status: SuggestionStatus;
  suggestions: { id: string; text: string }[];
  tone: SuggestionTone | null;
  isMatchOpener: boolean;
  remainingToday: number;
  remainingRegenerates?: number;
  isCached: boolean;
  createdAt: string;
};

export type SuggestionQuota = {
  available: boolean;
  limitPerDay: number;
  usedToday: number;
  remainingToday: number;
  resetsAt: string;
  regeneratesPerTap: number;
  toneSelectEnabled: boolean;
  matchOpenerEnabled: boolean;
};
