"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ActionButton } from "@/components/pieces/actions/action-button";
import { ActionRow } from "@/components/pieces/actions/action-row";
import { FormHeader } from "@/components/pieces/forms/form-header";
import { PortalBack } from "@/components/pieces/actions/portal-back";
import { PortalDialog } from "@/components/pieces/overlays/portal-dialog";
import { Button } from "@/components/ui/button";
import { formatMonth } from "@/lib/portal/date-format";
import { storyService } from "@/lib/portal/story-service";
import { useLoaded } from "@/hooks/use-loaded";
import { hrefFor } from "@/lib/routes";
import { getStoriesPage } from "@/stores/portal-store";
import { StatusScreen } from "@/components/sections/portal/shared/status-screen";
import { StoryBody } from "@/components/sections/portal/stories/story-body";
import { StoryContext } from "@/components/sections/portal/stories/story-context";
import { Workspace } from "@/components/sections/portal/shared/workspace";

/** W08 / STORY-MINE (pending), STORY-REJECT when moderation sends it back, and the STORY-DELETE dialog. */
export function StoryMineView() {
  const copy = getStoriesPage();
  const router = useRouter();
  const submission = useLoaded(storyService.getSubmission).value;
  const [removing, setRemoving] = useState(false);
  const [busy, setBusy] = useState(false);
  const none = submission === null;

  // Nothing submitted yet: write one.
  useEffect(() => {
    if (none) router.replace(hrefFor("STORY-CREATE"));
  }, [none, router]);

  if (!submission) return null;

  if (submission.status === "rejected") {
    const { reject } = copy;
    return (
      <StatusScreen
        back={<PortalBack action={copy.back} />}
        title={reject.title}
        description={reject.description}
        summary={reject.summary}
        primary={reject.primary}
        aside={<StoryContext />}
        actionWidth="actionSlot"
      />
    );
  }

  const remove = async () => {
    if (busy) return;
    setBusy(true);
    await storyService.removeSubmission();
    router.push(hrefFor("STORIES"));
  };

  return (
    <Workspace aside={<StoryContext />}>
      <PortalBack action={copy.back} />
      <FormHeader variant="portalStatus" title={copy.mine.title} description={copy.mine.description} />
      <StoryBody photo={copy.create.photo} title={submission.title} meta={formatMonth(`${submission.met}-01`)} body={submission.body} />
      <ActionRow>
        <ActionButton action={copy.mine.edit} variant="confirm" size="portalPill" width="actionSlot" />
        <Button type="button" variant="roseOutline" size="portalPill" width="actionSlot" onClick={() => setRemoving(true)}>
          {copy.mine.remove}
        </Button>
      </ActionRow>
      <PortalDialog
        open={removing}
        onOpenChange={setRemoving}
        header="fit"
        title={copy.remove.title}
        description={copy.remove.description}
        closeLabel={copy.remove.close}
        actions={
          <>
            <Button type="button" variant="confirm" size="portalPill" width="full" disabled={busy} aria-busy={busy || undefined} onClick={() => void remove()}>
              {busy ? copy.remove.removing : copy.remove.confirm}
            </Button>
            <Button type="button" variant="roseOutline" size="portalPill" width="full" disabled={busy} onClick={() => setRemoving(false)}>
              {copy.remove.keep}
            </Button>
          </>
        }
      />
    </Workspace>
  );
}
