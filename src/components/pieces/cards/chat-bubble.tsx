import { cn } from "@/lib/cn";
import type { TextTone } from "@/lib/tones";
import { Reveal } from "@/components/pieces/layout/reveal";
import { Text } from "@/components/pieces/content/text";

const variants = {
  /** "Incoming message": white. */
  incoming: "bg-white",
  /** "Your message": rose-light with the delivery line. */
  own: "bg-rose-light",
} as const;

type ChatBubbleProps = {
  variant: keyof typeof variants;
  text: string;
  /** "Sent · 2:41 PM", "Not sent · Tap Retry". */
  meta?: string;
  metaTone?: TextTone;
  /** Placement only (rule 17). */
  className?: string;
  revealDelay?: number;
};

/** One message in the conversation: 16px-radius bubble, 16/24 text and an optional 14/22 status line. */
export function ChatBubble({ variant, text, meta, metaTone = "sub", className, revealDelay }: ChatBubbleProps) {
  return (
    <Reveal as="li" delay={revealDelay} className={cn("flex w-full flex-col gap-2 rounded-16 p-4", variants[variant], className)}>
      <Text variant="text16" tone="strong" className="break-words whitespace-pre-wrap">
        {text}
      </Text>
      {meta && (
        <Text variant="text14Relaxed" tone={metaTone}>
          {meta}
        </Text>
      )}
    </Reveal>
  );
}
