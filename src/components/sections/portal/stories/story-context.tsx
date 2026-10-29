import Image from "next/image";
import { ActionButton } from "@/components/pieces/actions/action-button";
import { FactList } from "@/components/pieces/cards/fact-list";
import { PortalCard } from "@/components/pieces/layout/portal-card";
import { Text } from "@/components/pieces/content/text";
import { getStoriesPage } from "@/stores/portal-store";

/**
 * "48Date / Web / Flow context" (Flow=Story): consent and review reminders with "My shared story".
 * On STORIES it sits above the rose "Have a story to tell?" card (`withPrompt`).
 */
export function StoryContext({ withPrompt }: { withPrompt?: boolean }) {
  const { context, prompt } = getStoriesPage();
  return (
    <div className="flex w-full flex-col gap-4">
      <PortalCard as="aside" surface="outline" padding="lg" revealDelay={80} aria-labelledby="story-context-title" className="flex w-full flex-col gap-5">
        <div className="flex flex-col gap-2 border-b border-divider pb-2">
          <Text as="h2" id="story-context-title" variant="text20SemiboldSnug" tone="strong">
            {context.title}
          </Text>
          <Text variant="text12Medium" tone="sub">
            {context.description}
          </Text>
        </div>
        <div className="relative h-34 w-full overflow-hidden rounded-12">
          <Image src={context.photo.src} alt={context.photo.alt} fill sizes="304px" className="object-cover" />
        </div>
        <FactList layout="divided" facts={context.facts} />
        <ActionButton action={context.mine} variant="roseOutline" size="pillCompact" width="full" />
      </PortalCard>
      {withPrompt && (
        <PortalCard as="section" surface="rose" padding="lg" revealDelay={120} aria-labelledby="story-prompt-title" className="flex w-full flex-col gap-4">
          <Text as="h2" id="story-prompt-title" variant="text20SemiboldSnug" tone="strong">
            {prompt.title}
          </Text>
          <Text variant="text16" tone="sub">
            {prompt.description}
          </Text>
          <ActionButton action={prompt.action} variant="confirm" size="pillCompact" width="full" />
        </PortalCard>
      )}
    </div>
  );
}
