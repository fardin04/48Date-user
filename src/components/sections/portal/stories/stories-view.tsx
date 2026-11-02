"use client";

import Image from "next/image";
import { ActionButton } from "@/components/pieces/actions/action-button";
import { ActionRow } from "@/components/pieces/actions/action-row";
import { FormHeader } from "@/components/pieces/forms/form-header";
import { PortalCard } from "@/components/pieces/layout/portal-card";
import { Text } from "@/components/pieces/content/text";
import { fill } from "@/lib/format";
import { storyService } from "@/lib/portal/story-service";
import { useLoaded } from "@/hooks/use-loaded";
import { toItem } from "@/lib/routes";
import { getStoriesPage } from "@/stores/portal-store";
import { StoryContext } from "@/components/sections/portal/stories/story-context";
import { Workspace } from "@/components/sections/portal/shared/workspace";
import { screenKeys } from "@/lib/screen-keys";
import { isRawImage } from "@/lib/image";

/** W08 / STORIES: published community stories and the way to share yours. */
export function StoriesView() {
  const copy = getStoriesPage();
  const stories = useLoaded(screenKeys.stories, storyService.getStories).value;
  return (
    <Workspace aside={<StoryContext withPrompt />}>
      <FormHeader variant="portal" title={copy.feed.title} description={copy.feed.description} />
      <ul className="flex w-full flex-col gap-6">
        {(stories ?? []).map((story) => (
          <li key={story.id} className="flex">
            <PortalCard as="article" surface="outline" radius={20} padding="lg" aria-labelledby={`story-${story.id}`} className="flex w-full flex-col gap-4">
              <div className="relative h-75 w-full overflow-hidden rounded-16 max-md:h-56">
                <Image src={story.photo.src} unoptimized={isRawImage(story.photo.src)} alt={story.photo.alt} fill sizes="(min-width: 1280px) 810px, 100vw" className="object-cover" />
              </div>
              <Text as="h2" id={`story-${story.id}`} variant="text20SemiboldSnug" tone="strong">
                {story.title}
              </Text>
              <Text variant="text14Relaxed" tone="sub">
                {fill(copy.feed.meta, { couple: story.couple, met: story.met })}
              </Text>
              <Text variant="text16" tone="sub">
                {story.excerpt}
              </Text>
              <ActionButton action={{ label: copy.feed.read, to: toItem("STORY-DETAIL", story.id) }} variant="roseOutline" size="portalPill" width="full" />
            </PortalCard>
          </li>
        ))}
      </ul>
      <ActionRow>
        <ActionButton action={copy.feed.share} variant="confirm" size="portalPill" width="actionSlot" />
      </ActionRow>
    </Workspace>
  );
}
