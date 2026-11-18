"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { ActionButton } from "@/components/pieces/actions/action-button";
import { ActionRow } from "@/components/pieces/actions/action-row";
import { Button } from "@/components/ui/button";
import { CheckboxField } from "@/components/pieces/forms/checkbox-field";
import { FormHeader } from "@/components/pieces/forms/form-header";
import { MediaFrame } from "@/components/pieces/media/media-frame";
import { PortalBack } from "@/components/pieces/actions/portal-back";
import { SelectField } from "@/components/pieces/forms/select-field";
import { StatusBadge } from "@/components/pieces/feedback/status-badge";
import { StatusNote } from "@/components/pieces/feedback/status-note";
import { StatusSummary } from "@/components/pieces/feedback/status-summary";
import { TextAreaField } from "@/components/pieces/forms/text-area-field";
import { TextField } from "@/components/pieces/forms/text-field";
import { UploadStatus } from "@/components/pieces/feedback/upload-status";
import type { ImageAsset } from "@/data/types";
import { useLoaded } from "@/hooks/use-loaded";
import { layout } from "@/lib/control-sizes";
import { markReplace } from "@/lib/navigation/nav-trail";
import { replaceRoute } from "@/lib/navigation/replace-route";
import { failureReason } from "@/lib/portal/failure";
import { storyService, type StoryDraft } from "@/lib/portal/story-service";
import { hrefFor } from "@/lib/routes";
import { screenKeys } from "@/lib/screen-keys";
import { getLiveStoryCopy, getStoriesPage } from "@/stores/portal-store";
import { StoryContext } from "@/components/sections/portal/stories/story-context";
import { Workspace } from "@/components/sections/portal/shared/workspace";

type Errors = Partial<Record<keyof StoryDraft | "photo", string>>;
const EMPTY: StoryDraft = { title: "", met: "", body: "", consent: false };

async function measurePhoto(file: File, url: string): Promise<{ width: number; height: number }> {
  if (typeof createImageBitmap === "function") {
    try {
      const bitmap = await createImageBitmap(file);
      const dims = { width: bitmap.width, height: bitmap.height };
      bitmap.close();
      return dims;
    } catch {
      // Fall through to Image
    }
  }
  return new Promise((resolve) => {
    const img = new window.Image();
    img.onload = () => resolve({ width: img.naturalWidth || 4, height: img.naturalHeight || 3 });
    img.onerror = () => resolve({ width: 4, height: 3 });
    img.src = url;
  });
}

/** W08 / STORY-CREATE with STORY-ERROR and STORY-PENDING on the same URL (rule 32). */
export function StoryCreateView() {
  const queryClient = useQueryClient();
  const [initial, setInitial] = useState<StoryDraft | null>(null);
  const [initialPhoto, setInitialPhoto] = useState<ImageAsset | null>(null);
  const [editing, setEditing] = useState(false);

  // Start from the kept draft, else the submission being edited, else empty.
  useEffect(() => {
    let active = true;
    void Promise.all([
      storyService.getDraft(),
      queryClient.fetchQuery({ queryKey: screenKeys.storySubmission, queryFn: storyService.getSubmission }),
    ])
      .then(([draft, submission]) => {
        if (!active) return;
        setInitial(draft ?? (submission ? { title: submission.title, met: submission.met, body: submission.body, consent: submission.consent } : EMPTY));
        setInitialPhoto(submission?.photo ?? null);
        setEditing(submission !== null);
      })
      .catch(() => {
        if (active) setInitial(EMPTY);
      });
    return () => {
      active = false;
    };
  }, [queryClient]);

  if (!initial) return null;
  return <StoryForm initial={initial} initialPhoto={initialPhoto} editing={editing} />;
}

function StoryForm({ initial, initialPhoto, editing }: { initial: StoryDraft; initialPhoto: ImageAsset | null; editing: boolean }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const copy = getStoriesPage();
  const form = copy.create;
  const [draft, setDraft] = useState(initial);
  const [errors, setErrors] = useState<Errors>({});
  const [phase, setPhase] = useState<"form" | "error" | "pending">("form");
  const [busy, setBusy] = useState(false);
  const [uploadPercent, setUploadPercent] = useState<number | null>(null);
  const [failure, setFailure] = useState<string | null>(null);
  const months = useLoaded(screenKeys.storyMeetOptions, storyService.getMeetOptions).value ?? [];
  const live = getLiveStoryCopy().photo;
  const [photo, setPhoto] = useState<{ file: File; url: string; width: number; height: number } | null>(null);
  const photoUrl = useRef<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  // The chosen photo stays in memory only; its URL is freed when replaced or when leaving.
  useEffect(
    () => () => {
      if (photoUrl.current) URL.revokeObjectURL(photoUrl.current);
    },
    [],
  );

  const choosePhoto = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!live.accept.includes(file.type) || file.size > live.maxBytes) return setErrors({ photo: live.invalid });
    if (photoUrl.current) URL.revokeObjectURL(photoUrl.current);
    const url = URL.createObjectURL(file);
    photoUrl.current = url;
    const dims = await measurePhoto(file, url);
    setPhoto({ file, url, width: dims.width, height: dims.height });
    setErrors((prev) => ({ ...prev, photo: undefined }));
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
    if (storyService.photoRequired && !photo && !initialPhoto && !editing) found.photo = live.required;
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
    setUploadPercent(photo ? 10 : null);
    try {
      await storyService.submit(
        { ...draft, title: draft.title.trim(), body: draft.body.trim() },
        photo?.file ?? null,
        (percent) => setUploadPercent(percent),
      );
      void queryClient.invalidateQueries({ queryKey: screenKeys.storySubmission });
      if (editing) {
        replaceRoute(router, hrefFor("STORY-MINE"));
      } else {
        markReplace();
        setPhase("pending");
      }
    } catch (error) {
      setFailure(failureReason(error));
      setPhase("error");
    } finally {
      setBusy(false);
      setUploadPercent(null);
    }
  };

  if (phase === "pending") {
    const { pending } = copy;
    return (
      <Workspace aside={<StoryContext />}>
        <PortalBack action={copy.back} />
        <FormHeader variant="portalStatus" title={pending.title} description={pending.description} />
        <StatusBadge variant="urgent" label={pending.badge} />
        <StatusSummary summary={pending.summary} />
        <ActionRow className={layout.stickyActions}>
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
        <FormHeader
          variant={failed ? "portal" : "portalStatus"}
          title={failed ? form.error.title : editing ? (form.editTitle ?? form.title) : form.title}
          description={failed ? form.error.description : editing ? (form.editDescription ?? form.description) : form.description}
        />
        {editing && !failed && <StatusNote variant="notice" message={form.editWarning} />}
        {failed ? (
          <StatusNote variant="alert" message={failure ?? form.error.note} />
        ) : storyService.photoRequired ? (
          <div className="flex w-full flex-col items-start gap-3">
            {photo ? (
              <MediaFrame
                src={photo.url}
                alt={live.alt}
                width={photo.width}
                height={photo.height}
                maxHeight="card"
                sizes="(min-width: 1280px) 860px, 100vw"
                rounded={16}
              />
            ) : initialPhoto ? (
              <MediaFrame
                src={initialPhoto.src}
                alt={initialPhoto.alt}
                maxHeight="card"
                sizes="(min-width: 1280px) 860px, 100vw"
                rounded={16}
              />
            ) : null}
            {busy && uploadPercent !== null && photo && (
              <UploadStatus
                thumbnail={photo.url}
                title={photo.file.name}
                status={uploadPercent < 100 ? form.uploading : form.uploaded}
                percent={uploadPercent}
                progressLabel={form.uploadProgress}
                className="w-full"
              />
            )}
            <Button type="button" variant="roseOutline" size="pillCompact" width="auto" onClick={() => fileInput.current?.click()} disabled={busy}>
              {photo || initialPhoto ? live.change : live.choose}
            </Button>
            {errors.photo && <StatusNote variant="alert" message={errors.photo} />}
            <input ref={fileInput} type="file" accept={live.accept.join(",")} onChange={choosePhoto} className="sr-only" tabIndex={-1} aria-label={live.label} />
          </div>
        ) : (
          <MediaFrame
            src={form.photo.src}
            alt={form.photo.alt}
            maxHeight="card"
            sizes="(min-width: 1280px) 860px, 100vw"
            rounded={16}
          />
        )}
        <TextField
          label={form.fields.title}
          value={draft.title}
          onChange={(title) => change({ title })}
          placeholder={form.placeholders.title}
          maxLength={form.limits.title}
          state={busy ? "disabled" : errors.title ? "error" : "default"}
          message={errors.title}
        />
        {!failed && (
          <SelectField
            label={form.fields.met}
            value={draft.met}
            onChange={(met) => change({ met })}
            options={months}
            placeholder={form.placeholders.met}
            state={busy ? "disabled" : errors.met ? "error" : "default"}
            message={errors.met}
          />
        )}
        <TextAreaField
          label={form.fields.body}
          value={draft.body}
          onChange={(body) => change({ body })}
          placeholder={form.placeholders.body}
          maxLength={form.limits.body}
          message={errors.body}
          disabled={busy}
        />
        {!failed && (
          <div className="flex flex-col gap-2">
            <CheckboxField
              label={form.consent}
              checked={draft.consent}
              onChange={(consent) => {
                if (!busy) change({ consent });
              }}
            />
            {errors.consent && <StatusNote variant="alert" message={errors.consent} />}
          </div>
        )}
        <ActionRow className={layout.stickyActions}>
          <Button type="submit" variant="confirm" size="portalPill" width="actionSlot" disabled={busy} aria-busy={busy || undefined}>
            {busy ? (editing ? form.editingSubmit : form.submitting) : failed ? form.error.retry : editing ? form.editSubmit : form.submit}
          </Button>
        </ActionRow>
      </form>
    </Workspace>
  );
}
