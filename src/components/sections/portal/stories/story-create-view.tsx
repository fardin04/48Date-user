"use client";

import Image from "next/image";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { ActionRow } from "@/components/pieces/actions/action-row";
import { CheckboxField } from "@/components/pieces/forms/checkbox-field";
import { FormHeader } from "@/components/pieces/forms/form-header";
import { PortalBack } from "@/components/pieces/actions/portal-back";
import { SelectField } from "@/components/pieces/forms/select-field";
import { StatusBadge } from "@/components/pieces/feedback/status-badge";
import { StatusNote } from "@/components/pieces/feedback/status-note";
import { StatusSummary } from "@/components/pieces/feedback/status-summary";
import { TextAreaField } from "@/components/pieces/forms/text-area-field";
import { TextField } from "@/components/pieces/forms/text-field";
import { ActionButton } from "@/components/pieces/actions/action-button";
import { Button } from "@/components/ui/button";
import { PhotoTile } from "@/components/pieces/media/photo-tile";
import { failureReason } from "@/lib/portal/failure";
import { isRawImage } from "@/lib/image";
import { storyService, type StoryDraft } from "@/lib/portal/story-service";
import { screenKeys } from "@/lib/screen-keys";
import { useLoaded } from "@/hooks/use-loaded";
import { getLiveStoryCopy, getStoriesPage } from "@/stores/portal-store";
import { StoryContext } from "@/components/sections/portal/stories/story-context";
import { Workspace } from "@/components/sections/portal/shared/workspace";

type Errors = Partial<Record<keyof StoryDraft | "photo", string>>;
const EMPTY: StoryDraft = { title: "", met: "", body: "", consent: false };

/** W08 / STORY-CREATE with STORY-ERROR and STORY-PENDING on the same URL (rule 32). */
export function StoryCreateView() {
  const queryClient = useQueryClient();
  const [initial, setInitial] = useState<StoryDraft | null>(null);
  const [editing, setEditing] = useState(false);

  // Start from the kept draft, else the submission being edited, else empty.
  useEffect(() => {
    let active = true;
    // The draft lives in this tab; the submission is shared with STORY-MINE through the query cache.
    void Promise.all([storyService.getDraft(), queryClient.fetchQuery({ queryKey: screenKeys.storySubmission, queryFn: storyService.getSubmission })]).then(([draft, submission]) => {
      if (!active) return;
      setInitial(draft ?? (submission ? { title: submission.title, met: submission.met, body: submission.body, consent: submission.consent } : EMPTY));
      setEditing(submission !== null);
    }).catch(() => {
      // Signed out or offline: start from an empty story (the guard handles a lost session).
      if (active) setInitial(EMPTY);
    });
    return () => {
      active = false;
    };
  }, [queryClient]);

  if (!initial) return null;
  return <StoryForm initial={initial} editing={editing} />;
}

function StoryForm({ initial, editing }: { initial: StoryDraft; editing: boolean }) {
  const copy = getStoriesPage();
  const form = copy.create;
  const [draft, setDraft] = useState(initial);
  const [errors, setErrors] = useState<Errors>({});
  const [phase, setPhase] = useState<"form" | "error" | "pending">("form");
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);
  const months = useLoaded(screenKeys.storyMeetOptions, storyService.getMeetOptions).value ?? [];
  const live = getLiveStoryCopy().photo;
  const [photo, setPhoto] = useState<{ file: File; url: string } | null>(null);
  const photoUrl = useRef<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  // The chosen photo stays in memory only; its URL is freed when replaced or when leaving.
  useEffect(
    () => () => {
      if (photoUrl.current) URL.revokeObjectURL(photoUrl.current);
    },
    [],
  );

  const choosePhoto = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!live.accept.includes(file.type) || file.size > live.maxBytes) return setErrors({ photo: live.invalid });
    if (photoUrl.current) URL.revokeObjectURL(photoUrl.current);
    const url = URL.createObjectURL(file);
    photoUrl.current = url;
    setPhoto({ file, url });
    setErrors({});
  };

  const change = (patch: Partial<StoryDraft>) => {
    const next = { ...draft, ...patch };
    setDraft(next);
    setErrors({});
    void storyService.saveDraft(next);
  };

  const validate = (): Errors => {
    const found: Errors = {};
    if (!draft.title.trim()) found.title = form.errors.title;
    if (!draft.met) found.met = form.errors.met;
    if (draft.body.trim().length < form.limits.bodyMin) found.body = form.errors.body;
    if (!draft.consent) found.consent = form.errors.consent;
    // A new story needs a photo (API); editing a submission keeps its photo unless another is chosen.
    if (storyService.photoRequired && !photo && !editing) found.photo = live.required;
    return found;
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (busy) return;
    const found = validate();
    setErrors(found);
    if (Object.keys(found).length > 0) return;
    setBusy(true);
    setFailure(null);
    try {
      await storyService.submit({ ...draft, title: draft.title.trim(), body: draft.body.trim() }, photo?.file ?? null);
      setPhase("pending");
    } catch (error) {
      setFailure(failureReason(error));
      setPhase("error");
    }
    setBusy(false);
  };

  if (phase === "pending") {
    const { pending } = copy;
    return (
      <Workspace aside={<StoryContext />}>
        <PortalBack action={copy.back} />
        <FormHeader variant="portalStatus" title={pending.title} description={pending.description} />
        <StatusBadge variant="urgent" label={pending.badge} />
        <StatusSummary summary={pending.summary} />
        <ActionRow>
          <ActionButton action={pending.primary} variant="confirm" size="portalPill" width="actionSlot" />
          <ActionButton action={pending.secondary} variant="roseOutline" size="portalPill" width="actionSlot" />
        </ActionRow>
      </Workspace>
    );
  }

  const failed = phase === "error";
  return (
    <Workspace aside={<StoryContext />}>
      <PortalBack action={copy.back} />
      <form onSubmit={submit} noValidate aria-busy={busy || undefined} className="flex w-full flex-col gap-5">
        <FormHeader variant={failed ? "portal" : "portalStatus"} title={failed ? form.error.title : form.title} description={failed ? form.error.description : form.description} />
        {failed ? (
          <StatusNote variant="alert" message={failure ?? form.error.note} />
        ) : storyService.photoRequired ? (
          <div className="flex w-full flex-col items-start gap-3">
            {photo && (
              <div className="relative h-45 w-full overflow-hidden rounded-16">
                <PhotoTile src={photo.url} alt={live.alt} frame="preview" />
              </div>
            )}
            <Button type="button" variant="roseOutline" size="pillCompact" width="auto" onClick={() => fileInput.current?.click()}>
              {photo ? live.change : live.choose}
            </Button>
            {errors.photo && <StatusNote variant="alert" message={errors.photo} />}
            <input ref={fileInput} type="file" accept={live.accept.join(",")} onChange={choosePhoto} className="sr-only" tabIndex={-1} aria-label={live.label} />
          </div>
        ) : (
          <div className="relative h-45 w-full overflow-hidden rounded-16">
            <Image src={form.photo.src} unoptimized={isRawImage(form.photo.src)} alt={form.photo.alt} fill sizes="(min-width: 1280px) 860px, 100vw" className="object-cover" />
          </div>
        )}
        <TextField
          label={form.fields.title}
          value={draft.title}
          onChange={(title) => change({ title })}
          placeholder={form.placeholders.title}
          maxLength={form.limits.title}
          state={errors.title ? "error" : "default"}
          message={errors.title}
        />
        {!failed && (
          <SelectField
            label={form.fields.met}
            value={draft.met}
            onChange={(met) => change({ met })}
            options={months}
            placeholder={form.placeholders.met}
            state={errors.met ? "error" : "default"}
            message={errors.met}
          />
        )}
        <TextAreaField label={form.fields.body} value={draft.body} onChange={(body) => change({ body })} placeholder={form.placeholders.body} maxLength={form.limits.body} message={errors.body} />
        {!failed && (
          <div className="flex flex-col gap-2">
            <CheckboxField label={form.consent} checked={draft.consent} onChange={(consent) => change({ consent })} />
            {errors.consent && <StatusNote variant="alert" message={errors.consent} />}
          </div>
        )}
        <ActionRow>
          <Button type="submit" variant="confirm" size="portalPill" width="actionSlot" disabled={busy} aria-busy={busy || undefined}>
            {busy ? form.submitting : failed ? form.error.retry : form.submit}
          </Button>
        </ActionRow>
      </form>
    </Workspace>
  );
}
