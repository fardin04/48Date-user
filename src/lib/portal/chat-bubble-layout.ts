import type { ChatMessage } from "@/lib/portal/chat-service";

export type BubbleVariant = "own" | "incoming";

/** Own messages sit on the right, the other member's on the left (on both accounts). */
export const bubbleSide = (variant: BubbleVariant) => (variant === "own" ? "end" : "start");

/** The member's own kinds and the other member's: cards the service posts (date, game, system) aren't bubbles. */
export const isBubble = (message: ChatMessage) => message.kind === "text" || message.kind === "photo" || message.kind === "voice";

/**
 * Messages whose status line stays visible: the last own message ("Sending…", "Sent", "Seen") and
 * every failed one ("Not sent · Tap Retry"). Every other time line shows on hover, focus or tap.
 */
export function persistentStatus(messages: ChatMessage[]): Set<string> {
  const ids = new Set(messages.filter((message) => message.mine && message.status === "failed").map((message) => message.id));
  const last = messages.findLast((message) => message.mine && isBubble(message));
  if (last) ids.add(last.id);
  return ids;
}

/** A bubble right after one from the same side sits closer to it. */
export const groupsWithPrevious = (messages: ChatMessage[], index: number) => {
  const previous = messages[index - 1];
  const message = messages[index];
  return Boolean(previous && message && isBubble(previous) && isBubble(message) && previous.mine === message.mine);
};
