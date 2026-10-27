import Image from "next/image";
import type { features } from "@/data/landing/features";
import { cn } from "@/lib/cn";
import { Reveal } from "./reveal";
import { Text } from "./text";

type MessageSuggestionProps = {
  suggestion: (typeof features)["conversation"]["suggestion"];
  /** Placement only (rule 17). */
  className?: string;
  revealDelay?: number;
};

/** Illustrative AI opener: shared context, suggested message and (non-interactive) follow-ups. */
export function MessageSuggestion({ suggestion, className, revealDelay }: MessageSuggestionProps) {
  return (
    <Reveal delay={revealDelay} className={cn("flex flex-col rounded-20 bg-white p-5 drop-shadow-xs md:p-7", className)}>
      <div className="flex items-center gap-3">
        <Image
          src={suggestion.avatar.src}
          alt={suggestion.avatar.alt}
          width={38}
          height={38}
          className="size-9.5 rounded-full object-cover"
        />
        <Text variant="text14" tone="muted">
          {suggestion.context}
        </Text>
      </div>
      <Text as="blockquote" variant="title24Medium" className="pt-6.5">
        {suggestion.message}
      </Text>
      <div className="mt-6.5 flex items-center justify-between gap-4 border-t border-line pt-4.5">
        <Text as="span" variant="text14" tone="muted">
          {suggestion.alternative}
        </Text>
        <Text as="span" variant="text13Bold" tone="rose">
          {suggestion.accept}
        </Text>
      </div>
    </Reveal>
  );
}
