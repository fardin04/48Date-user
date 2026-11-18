"use client";

import { useState } from "react";
import type { ImageAsset } from "@/data/types";
import { cn } from "@/lib/cn";
import { chatBubble } from "@/lib/control-sizes";
import { bubbleSide, type BubbleVariant } from "@/lib/portal/chat-bubble-layout";
import type { TextTone } from "@/lib/tones";
import { MediaFrame } from "@/components/pieces/media/media-frame";
import { Reveal } from "@/components/pieces/layout/reveal";
import { Text } from "@/components/pieces/content/text";

const surfaces: Record<BubbleVariant, string> = {
  /** "Incoming message": white, on the left. */
  incoming: `bg-white ${chatBubble.incoming}`,
  /** "Your message": rose-light, on the right. */
  own: `bg-rose-light ${chatBubble.own}`,
};

type ChatBubbleProps = {
  variant: BubbleVariant;
  text: string;
  /** "Sent · 2:41 PM", "Not sent · Tap Retry". */
  meta?: string;
  metaTone?: TextTone;
  /** Keeps the status line visible (the last own message, a failed one); otherwise it shows on hover, focus or tap. */
  metaVisible?: boolean;
  /** A sent photo, shown at its own ratio above the text. */
  image?: ImageAsset;
  /** A voice note: its URL and accessible name. */
  audio?: { src: string; label: string };
  /** Placement only (rule 17). */
  className?: string;
  revealDelay?: number;
};

/**
 * One message: a capsule as wide as its text (up to 80 % of the pane), own messages on the right and
 * the other member's on the left. The time stays in the accessible name and shows on hover, focus or
 * a tap on the text; the last own status and a failed one always show.
 */
export function ChatBubble({ variant, text, meta, metaTone = "sub", metaVisible = false, image, audio, className, revealDelay }: ChatBubbleProps) {
  const [open, setOpen] = useState(false);
  const shown = metaVisible || open;
  const own = bubbleSide(variant) === "end";
  return (
    <Reveal as="li" delay={revealDelay} className={cn("flex w-full", own ? "justify-end" : "justify-start", className)}>
      <div className={cn("group inline-flex min-w-0 flex-col gap-1 px-4 py-3", chatBubble.width, surfaces[variant], own && "items-end")}>
        {image && <MediaFrame src={image.src} alt={image.alt} width={image.width} height={image.height} maxHeight="attachment" sizes="(max-width: 640px) 80vw, 320px" rounded={12} />}
        {audio && <audio controls preload="none" src={audio.src} aria-label={audio.label} className="w-80 max-w-full" />}
        {text &&
          (meta && !metaVisible ? (
            <button type="button" aria-expanded={open} onClick={() => setOpen(!open)} className="focus-ring max-w-full cursor-pointer rounded-6 text-left">
              <Text as="span" variant="text16" tone="strong" className="block break-anywhere whitespace-pre-wrap">
                {text}
              </Text>
            </button>
          ) : (
            <Text variant="text16" tone="strong" className="max-w-full break-anywhere whitespace-pre-wrap">
              {text}
            </Text>
          ))}
        {meta && (
          <Text variant="text14Relaxed" tone={metaTone} className={cn(!shown && "sr-only group-focus-within:not-sr-only group-hover:not-sr-only")}>
            {meta}
          </Text>
        )}
      </div>
    </Reveal>
  );
}
