import Image from "next/image";
import type { ImageAsset } from "@/data/types";
import { cn } from "@/lib/cn";
import { isRawImage } from "@/lib/image";
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
  /** A sent photo, shown above the text. */
  image?: ImageAsset;
  /** A voice note: its URL and accessible name. */
  audio?: { src: string; label: string };
  /** Placement only (rule 17). */
  className?: string;
  revealDelay?: number;
};

/** One message in the conversation: 16px-radius bubble, 16/24 text, optional photo or voice note and a 14/22 status line. */
export function ChatBubble({ variant, text, meta, metaTone = "sub", image, audio, className, revealDelay }: ChatBubbleProps) {
  return (
    <Reveal as="li" delay={revealDelay} className={cn("flex w-full flex-col gap-2 rounded-16 p-4", variants[variant], className)}>
      {image && (
        <span className="relative block aspect-[4/5] w-full max-w-60 overflow-hidden rounded-12">
          <Image src={image.src} alt={image.alt} fill unoptimized={isRawImage(image.src)} sizes="240px" className="object-cover" />
        </span>
      )}
      {audio && <audio controls preload="none" src={audio.src} aria-label={audio.label} className="w-full max-w-80" />}
      {text && (
        <Text variant="text16" tone="strong" className="break-words whitespace-pre-wrap">
          {text}
        </Text>
      )}
      {meta && (
        <Text variant="text14Relaxed" tone={metaTone}>
          {meta}
        </Text>
      )}
    </Reveal>
  );
}
