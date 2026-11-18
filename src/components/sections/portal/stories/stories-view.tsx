"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { ActionButton } from "@/components/pieces/actions/action-button";
import { FormHeader } from "@/components/pieces/forms/form-header";
import { MediaFrame } from "@/components/pieces/media/media-frame";
import { PortalCard } from "@/components/pieces/layout/portal-card";
import { StatusNote } from "@/components/pieces/feedback/status-note";
import { Text } from "@/components/pieces/content/text";
import { Button } from "@/components/ui/button";
import { layout } from "@/lib/control-sizes";
import { fill } from "@/lib/format";
import { storyService } from "@/lib/portal/story-service";
import { toItem } from "@/lib/routes";
import { getStoriesPage } from "@/stores/portal-store";
import { LoadFailed } from "@/components/sections/portal/shared/load-failed";
import { StoryContext } from "@/components/sections/portal/stories/story-context";
import { Workspace } from "@/components/sections/portal/shared/workspace";
import { screenKeys } from "@/lib/screen-keys";

/**
 * W08 / STORIES: published community stories, a page at a time ("Show more", cursor), each photo at its
 * own ratio. Below 1280px the flow support with "Share your story" is hidden or below the feed, so the
 * header carries "Share your story" and "My shared story" there (bug N7); from 1280 the aside has them.
 */
export function StoriesView() {
  const copy = getStoriesPage();
  const pages = useInfiniteQuery({
    queryKey: screenKeys.stories,
    queryFn: ({ pageParam }) => storyService.getStoryPage(pageParam),
    initialPageParam: null as string | null,
    getNextPageParam: (page) => page.next,
  });
  const stories = pages.data?.pages.flatMap((page) => page.stories);

  return (
    <Workspace aside={<StoryContext withPrompt />}>
      <div className="flex w-full flex-wrap items-end justify-between gap-4">
        <FormHeader variant="portal" title={copy.feed.title} description={copy.feed.description} className="min-w-0 flex-1" />
        <div className="flex flex-wrap gap-3 xl:hidden">
          <ActionButton action={copy.feed.share} variant="confirm" size="pillCompact" width="auto" />
          <ActionButton action={copy.context.mine} variant="roseOutline" size="pillCompact" width="auto" />
        </div>
      </div>
      {pages.error && !stories ? (
        <LoadFailed onRetry={() => void pages.refetch()} error={pages.error} />
      ) : stories?.length === 0 ? (
        <StatusNote variant="notice" message={copy.feed.empty} />
      ) : (
        <ul className={layout.storiesGrid}>
          {(stories ?? []).map((story, index) => (
            <li key={story.id} className="flex min-w-0">
              <PortalCard as="article" surface="outline" radius={20} padding="lg" revealDelay={(index % 6) * 60} aria-labelledby={`story-${story.id}`} className="flex w-full min-w-0 flex-col gap-4">
                <MediaFrame src={story.photo.src} alt={story.photo.alt} maxHeight="card" sizes="(min-width: 1280px) 420px, (min-width: 768px) 50vw, 100vw" />
                <Text as="h2" id={`story-${story.id}`} variant="text20SemiboldSnug" tone="strong" className="break-anywhere">
                  {story.title}
                </Text>
                <Text variant="text14Relaxed" tone="sub" className="break-anywhere">
                  {fill(copy.feed.meta, { couple: story.couple, met: story.met })}
                </Text>
                <Text variant="text16" tone="sub" className="break-anywhere">
                  {story.excerpt}
                </Text>
                <ActionButton action={{ label: copy.feed.read, to: toItem("STORY-DETAIL", story.id) }} variant="roseOutline" size="portalPill" width="full" className="mt-auto" />
              </PortalCard>
            </li>
          ))}
        </ul>
      )}
      {pages.hasNextPage && (
        <Button type="button" variant="roseOutline" size="portalPill" width="actionSlot" disabled={pages.isFetchingNextPage} aria-busy={pages.isFetchingNextPage || undefined} onClick={() => void pages.fetchNextPage()}>
          {pages.isFetchingNextPage ? copy.feed.loadingMore : copy.feed.more}
        </Button>
      )}
    </Workspace>
  );
}
