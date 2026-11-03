import { api, type StreamEvent } from "../client";
import { endpoints } from "../endpoints";
import type { SuggestionRequest } from "../types/ai";

/** A finished request's lines; a request still generating is followed on its event stream. */
async function settle(request: SuggestionRequest, signal: AbortSignal): Promise<SuggestionRequest> {
  if (request.status === "COMPLETED" || request.status === "FAILED") return request;
  let done: SuggestionRequest | null = null;
  await api.stream(
    endpoints.ai.events(request.requestId),
    ({ event, data }: StreamEvent) => {
      if (event !== "completed" && event !== "failed") return false;
      const body = (typeof data === "object" && data !== null ? data : {}) as { status?: string; suggestions?: (string | { id: string; text: string })[] };
      const suggestions = (body.suggestions ?? []).map((item, index) => (typeof item === "string" ? { id: `s${index + 1}`, text: item } : item));
      done = { ...request, status: event === "completed" ? "COMPLETED" : "FAILED", suggestions };
      return true;
    },
    signal,
  );
  return done ?? (await api.get<SuggestionRequest>(endpoints.ai.request(request.requestId), { signal })).data;
}

/** User / 10 - AI Suggestions: three lines per tap; a repeated tap with no new message is served from the server's cache. */
export const aiApi = {
  async reply(conversationId: string, signal: AbortSignal) {
    const { data } = await api.post<SuggestionRequest>(endpoints.conversations.replySuggestions(conversationId), { body: {}, signal });
    return settle(data, signal);
  },
  /** Icebreakers for a match with no messages yet. */
  async opener(conversationId: string, signal: AbortSignal) {
    const { data } = await api.post<SuggestionRequest>(endpoints.conversations.openerSuggestion(conversationId), { body: {}, signal });
    return settle(data, signal);
  },
  /** "Try another": re-rolls within the tap's allowance without using a daily tap. */
  async regenerate(requestId: string, signal: AbortSignal) {
    const { data } = await api.post<SuggestionRequest>(endpoints.ai.regenerate(requestId), { signal });
    return settle(data, signal);
  },
};
