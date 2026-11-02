"use client";

import { useState, type FormEvent } from "react";
import { ActionButton } from "@/components/pieces/actions/action-button";
import { ActionRow } from "@/components/pieces/actions/action-row";
import { DetailRow } from "@/components/pieces/cards/detail-row";
import { FormHeader } from "@/components/pieces/forms/form-header";
import { PortalBack } from "@/components/pieces/actions/portal-back";
import { TextField } from "@/components/pieces/forms/text-field";
import { Button } from "@/components/ui/button";
import { StatusNote } from "@/components/pieces/feedback/status-note";
import { useServiceAction } from "@/hooks/use-service-action";
import { fill } from "@/lib/format";
import { storyService } from "@/lib/portal/story-service";
import { useLoaded } from "@/hooks/use-loaded";
import { toItem } from "@/lib/routes";
import { getStoriesPage } from "@/stores/portal-store";
import { StoryBody } from "@/components/sections/portal/stories/story-body";
import { StoryContext } from "@/components/sections/portal/stories/story-context";
import { Workspace } from "@/components/sections/portal/shared/workspace";
import { screenKeys } from "@/lib/screen-keys";

/** W08 / STORY-DETAIL, then COMMENT-SENT once a comment is posted (rule 32). */
export function StoryView({ id }: { id: string }) {
  const copy = getStoriesPage();
  const { value: story, reload } = useLoaded(screenKeys.story(id), () => storyService.getStory(id));
  const [comment, setComment] = useState("");
  const [posted, setPosted] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState(false);
  const [likes, setLikes] = useState<{ count: number; liked: boolean } | null>(null);
  const [answered, setAnswered] = useState<boolean | null>(null);
  const answer = useServiceAction(copy.detail.consent.declined);
  if (!story) return null;
  const shownLikes = likes ?? story.likes;

  const like = async () => {
    if (busy) return;
    setBusy(true);
    try {
      setLikes(await storyService.toggleLike(id));
    } catch {
      // The count stays as it was.
    }
    setBusy(false);
  };

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
    if (busy) return;
    const text = comment.trim();
    if (!text) return setError(true);
    setBusy(true);
    await storyService.addComment(id, text);
    setPosted(text);
    setComment("");
    setBusy(false);
    reload();
  };

  return (
    <Workspace aside={<StoryContext />}>
      <PortalBack action={copy.back} />
      <form onSubmit={submit} noValidate aria-busy={busy || undefined} className="flex w-full flex-col gap-5">
        <FormHeader
          variant={posted ? "portal" : "portalStatus"}
          title={posted ? copy.detail.posted.title : story.detailTitle}
          description={posted ? fill(copy.detail.posted.description, { comment: posted }) : fill(copy.feed.meta, { couple: story.couple, met: story.met })}
        />
        <StoryBody photo={story.photo} title={story.couple} meta={story.met} body={story.body} />
        {shownLikes && (
          <Button type="button" variant="roseOutline" size="pillCompact" width="auto" aria-pressed={shownLikes.liked} disabled={busy} onClick={() => void like()}>
            {fill(shownLikes.liked ? copy.detail.liked : copy.detail.like, { count: shownLikes.count })}
          </Button>
        )}
        {story.comments.length > 0 && (
          <dl aria-label={copy.detail.commentsLabel} className="flex w-full flex-col">
            {story.comments.map((item, index) => (
              <DetailRow key={`${item.author}-${index}`} label={item.author} value={item.text} divided />
            ))}
          </dl>
        )}
        <TextField
          label={copy.detail.comment}
          value={comment}
          onChange={(value) => {
            setComment(value);
            setError(false);
          }}
          placeholder={copy.detail.commentPlaceholder}
          maxLength={copy.detail.commentMax}
          state={error ? "error" : busy ? "disabled" : "default"}
          message={copy.detail.commentRequired}
        />
        <ActionRow>
          {posted ? (
            <ActionButton action={copy.detail.posted.back} variant="confirm" size="portalPill" width="actionSlot" />
          ) : (
            <>
              <Button type="submit" variant="confirm" size="portalPill" width="actionSlot" disabled={busy} aria-busy={busy || undefined}>
                {busy ? copy.detail.adding : copy.detail.add}
              </Button>
              <ActionButton action={{ label: copy.detail.report, to: toItem("REPORT-DETAIL", id) }} variant="roseOutline" size="portalPill" width="actionSlot" />
            </>
          )}
        </ActionRow>
      </form>
    </Workspace>
  );
}
