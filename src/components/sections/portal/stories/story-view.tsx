"use client";

import { useInfiniteQuery, useQueryClient, type InfiniteData } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { ActionButton } from "@/components/pieces/actions/action-button";
import { ActionRow } from "@/components/pieces/actions/action-row";
import { FormHeader } from "@/components/pieces/forms/form-header";
import { PortalBack } from "@/components/pieces/actions/portal-back";
import { PortalDialog } from "@/components/pieces/overlays/portal-dialog";
import { Text } from "@/components/pieces/content/text";
import { TextField } from "@/components/pieces/forms/text-field";
import { Button } from "@/components/ui/button";
import { StatusNote } from "@/components/pieces/feedback/status-note";
import { useServiceAction } from "@/hooks/use-service-action";
import { fill } from "@/lib/format";
import { failureReason } from "@/lib/portal/failure";
import { mergeComments, withoutComment, type CommentItem } from "@/lib/portal/story-comments";
import { storyService } from "@/lib/portal/story-service";
import { useLoaded } from "@/hooks/use-loaded";
import { toItem } from "@/lib/routes";
import { getStoriesPage } from "@/stores/portal-store";
import { LoadFailed } from "@/components/sections/portal/shared/load-failed";
import { StatusScreen } from "@/components/sections/portal/shared/status-screen";
import { StoryBody } from "@/components/sections/portal/stories/story-body";
import { StoryContext } from "@/components/sections/portal/stories/story-context";
import { Workspace } from "@/components/sections/portal/shared/workspace";
import { screenKeys } from "@/lib/screen-keys";

type CommentPage = { comments: CommentItem[]; next: string | null };

/** W08 / STORY-DETAIL, then COMMENT-SENT once a comment is posted (rule 32). An unknown or unpublished id shows "not available". */
export function StoryView({ id }: { id: string }) {
  const copy = getStoriesPage();
  const queryClient = useQueryClient();
  const { value: story, error: loadError, reload } = useLoaded(screenKeys.story(id), () => storyService.getStory(id));
  const commentsKey = [...screenKeys.story(id), "comments"];
  const pages = useInfiniteQuery({
    queryKey: commentsKey,
    queryFn: ({ pageParam }) => storyService.getComments(id, pageParam),
    initialPageParam: null as string | null,
    getNextPageParam: (page) => page.next,
    enabled: Boolean(story && !story.consent),
  });
  const [comment, setComment] = useState("");
  const [posted, setPosted] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const [likes, setLikes] = useState<{ count: number; liked: boolean } | null>(null);
  const [answered, setAnswered] = useState<boolean | null>(null);
  const [removing, setRemoving] = useState<CommentItem | null>(null);
  const answer = useServiceAction(copy.detail.consent.declined);
  const posting = useServiceAction(copy.detail.commentFailed);
  const liking = useServiceAction(copy.detail.actionFailed);
  const deleting = useServiceAction(copy.detail.actionFailed);

  if (story === undefined) return loadError ? <LoadFailed onRetry={() => void reload()} error={loadError} /> : null;
  if (story === null) {
    const { unavailable } = copy.detail;
    return <StatusScreen back={<PortalBack action={copy.back} />} title={unavailable.title} description={unavailable.description} summary={unavailable.summary} primary={unavailable.primary} aside={<StoryContext />} actionWidth="actionSlot" />;
  }
  const shownLikes = likes ?? story.likes;
  const comments = mergeComments(pages.data?.pages.map((page) => page.comments) ?? []);

  // The count shown is the server's answer, never a guess.
  const like = () => shownLikes && void liking.run(async () => setLikes(await storyService.toggleLike(id, shownLikes.liked)));

  if (story.consent) {
    const { consent } = copy.detail;
    const respond = (accept: boolean) =>
      void answer.run(() => storyService.respond(id, accept)).then((ok) => {
        if (ok) setAnswered(accept);
      });
    return (
      <Workspace aside={<StoryContext />}>
        <PortalBack action={copy.back} />
        <FormHeader variant="portalStatus" title={story.detailTitle} description={fill(consent.note, { name: story.consent.author })} />
        <StoryBody photo={story.photo} title={story.couple} meta={story.met} body={story.body} />
        {answered !== null ? (
          <StatusNote variant={answered ? "success" : "notice"} message={answered ? consent.approved : consent.declined} />
        ) : (
          <ActionRow>
            <Button type="button" variant="confirm" size="portalPill" width="actionSlot" disabled={answer.busy} aria-busy={answer.busy || undefined} onClick={() => respond(true)}>
              {consent.approve}
            </Button>
            <Button type="button" variant="roseOutline" size="portalPill" width="actionSlot" disabled={answer.busy} onClick={() => respond(false)}>
              {consent.decline}
            </Button>
          </ActionRow>
        )}
        {answer.failure && <StatusNote variant="alert" message={answer.failure} />}
      </Workspace>
    );
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (posting.busy) return;
    const text = comment.trim();
    if (!text) return setError(true);
    // A failure keeps the text in the field and shows why.
    const ok = await posting.run(() => storyService.addComment(id, text));
    if (!ok) return;
    setPosted(text);
    setComment("");
    void pages.refetch();
  };

  const remove = async () => {
    if (!removing) return;
    const target = removing.id;
    const ok = await deleting.run(() => storyService.deleteComment(id, target));
    if (!ok) return;
    queryClient.setQueryData<InfiniteData<CommentPage>>(commentsKey, (data) =>
      data ? { ...data, pages: withoutComment(data.pages.map((page) => page.comments), target).map((list, index) => ({ ...data.pages[index], comments: list })) } : data,
    );
    setRemoving(null);
  };

  return (
    <Workspace aside={<StoryContext />}>
      <PortalBack action={copy.back} />
      <form onSubmit={submit} noValidate aria-busy={posting.busy || undefined} className="flex w-full flex-col gap-5">
        <FormHeader
          variant={posted ? "portal" : "portalStatus"}
          title={posted ? copy.detail.posted.title : story.detailTitle}
          description={posted ? fill(copy.detail.posted.description, { comment: posted }) : fill(copy.feed.meta, { couple: story.couple, met: story.met })}
        />
        <StoryBody photo={story.photo} title={story.couple} meta={story.met} body={story.body} />
        {shownLikes && (
          <Button type="button" variant="roseOutline" size="pillCompact" width="auto" className="self-start" aria-pressed={shownLikes.liked} disabled={liking.busy} onClick={like}>
            {fill(shownLikes.liked ? copy.detail.liked : copy.detail.like, { count: shownLikes.count })}
          </Button>
        )}
        {liking.failure && <StatusNote variant="alert" message={liking.failure} />}
        {comments.length > 0 && (
          <ul aria-label={copy.detail.commentsLabel} className="flex w-full flex-col">
            {comments.map((item) => (
              <li key={item.id} className="flex w-full items-start gap-3 border-b border-divider py-3">
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <Text as="span" variant="text14Semibold" tone="strong" className="break-anywhere">
                    {item.mine ? copy.detail.you : item.author}
                  </Text>
                  <Text as="span" variant="text14Relaxed" tone="sub" className="break-anywhere whitespace-pre-wrap">
                    {item.text}
                  </Text>
                </div>
                {item.mine && (
                  <Button type="button" variant="ghost" size="back" width="auto" aria-label={copy.detail.deleteLabel} aria-haspopup="dialog" onClick={() => setRemoving(item)}>
                    {copy.detail.deleteComment}
                  </Button>
                )}
              </li>
            ))}
          </ul>
        )}
        {pages.hasNextPage && (
          <Button type="button" variant="roseOutline" size="pillCompact" width="auto" className="self-start" disabled={pages.isFetchingNextPage} onClick={() => void pages.fetchNextPage()}>
            {copy.detail.earlier}
          </Button>
        )}
        {pages.error && <StatusNote variant="alert" message={failureReason(pages.error) ?? copy.detail.commentFailed} />}
        <TextField
          label={copy.detail.comment}
          value={comment}
          onChange={(value) => {
            setComment(value);
            setError(false);
          }}
          placeholder={copy.detail.commentPlaceholder}
          maxLength={copy.detail.commentMax}
          state={error ? "error" : posting.busy ? "disabled" : "default"}
          message={copy.detail.commentRequired}
        />
        {posting.failure && <StatusNote variant="alert" message={posting.failure} />}
        <ActionRow>
          {posted ? (
            <ActionButton action={copy.detail.posted.back} variant="confirm" size="portalPill" width="actionSlot" />
          ) : (
            <>
              <Button type="submit" variant="confirm" size="portalPill" width="actionSlot" disabled={posting.busy} aria-busy={posting.busy || undefined}>
                {posting.busy ? copy.detail.adding : copy.detail.add}
              </Button>
              <ActionButton action={{ label: copy.detail.report, to: toItem("REPORT-DETAIL", id) }} variant="roseOutline" size="portalPill" width="actionSlot" />
            </>
          )}
        </ActionRow>
      </form>
      <PortalDialog
        open={removing !== null}
        onOpenChange={(open) => !open && setRemoving(null)}
        header="fit"
        title={copy.detail.deleteDialog.title}
        description={copy.detail.deleteDialog.description}
        closeLabel={copy.detail.deleteDialog.close}
        actions={
          <>
            <Button type="button" variant="confirm" size="portalPill" width="full" disabled={deleting.busy} aria-busy={deleting.busy || undefined} onClick={() => void remove()}>
              {deleting.busy ? copy.detail.deleteDialog.deleting : copy.detail.deleteDialog.confirm}
            </Button>
            <Button type="button" variant="roseOutline" size="portalPill" width="full" disabled={deleting.busy} onClick={() => setRemoving(null)}>
              {copy.detail.deleteDialog.keep}
            </Button>
          </>
        }
      >
        {deleting.failure && <StatusNote variant="alert" message={deleting.failure} />}
      </PortalDialog>
    </Workspace>
  );
}
