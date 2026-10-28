"use client";

import { useEffect, useId, useRef, useState, type ChangeEvent } from "react";
import { AddPhotoTile } from "@/components/pieces/media/add-photo-tile";
import { ChoiceCard } from "@/components/pieces/forms/choice-card";
import { ChoiceGroup } from "@/components/pieces/forms/choice-group";
import { PhotoTile } from "@/components/pieces/media/photo-tile";
import { SetupStep } from "@/components/pieces/shells/setup-step";
import { StatusNote } from "@/components/pieces/feedback/status-note";
import { Text } from "@/components/pieces/content/text";
import { UploadStatus } from "@/components/pieces/feedback/upload-status";
import { onboardingService } from "@/lib/onboarding/onboarding-service";
import { photoStore, usePhotos } from "@/lib/onboarding/photo-store";
import { getOnboardingShared, getPhotosStep, getStepFlow } from "@/stores/onboarding-store";
import { SetupBack, SetupError, SetupPrimary, SetupTextAction, useSaveStep } from "./step-actions";

type Phase = "grid" | "source" | "preview" | "upload" | "error";
type Pending = { file: File; url: string };

/**
 * PHOTOS → PHOTO-SOURCE → PHOTO-PREVIEW → PHOTO-UPLOAD → PHOTO-ERROR / PHOTO-READY.
 * Two valid uploads are required; the chosen file is checked before upload.
 */
export function PhotosStep() {
  const copy = getPhotosStep();
  const flow = getStepFlow("photos");
  const photos = usePhotos();
  const { save, saving, error } = useSaveStep("photos");
  const name = useId();
  const [phase, setPhase] = useState<Phase>("grid");
  const [source, setSource] = useState(copy.source.choices[0].value);
  const [invalid, setInvalid] = useState(false);
  const [pending, setPending] = useState<Pending | null>(null);
  const [percent, setPercent] = useState(0);
  const fileInput = useRef<HTMLInputElement>(null);
  const upload = useRef<AbortController | null>(null);
  const pendingUrl = useRef<string | null>(null);

  // Leaving the step stops an upload and frees a photo that was never added.
  useEffect(
    () => () => {
      upload.current?.abort();
      if (pendingUrl.current) URL.revokeObjectURL(pendingUrl.current);
    },
    [],
  );

  function discardPending(next: Phase) {
    upload.current?.abort();
    if (pendingUrl.current) URL.revokeObjectURL(pendingUrl.current);
    pendingUrl.current = null;
    setPending(null);
    setPhase(next);
  }

  function cancelUpload() {
    upload.current?.abort();
    setPhase("preview");
  }

  function choose(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!copy.accept.includes(file.type) || file.size > copy.maxBytes) {
      setInvalid(true);
      return;
    }
    if (pendingUrl.current) URL.revokeObjectURL(pendingUrl.current);
    const url = URL.createObjectURL(file);
    pendingUrl.current = url;
    setInvalid(false);
    setPending({ file, url });
    setPhase("preview");
  }

  async function start() {
    if (!pending) return;
    upload.current?.abort();
    const controller = new AbortController();
    upload.current = controller;
    setPercent(0);
    setPhase("upload");
    const result = await onboardingService.uploadPhoto(pending.file, setPercent, controller.signal);
    if (controller.signal.aborted) return;
    if (result.status === "failed") {
      setPhase("error");
      return;
    }
    // The store now owns the object URL.
    photoStore.add(pending.url, result.fileId);
    pendingUrl.current = null;
    setPending(null);
    setPhase("grid");
  }

  const fileField = (
    <input
      ref={fileInput}
      type="file"
      accept={copy.accept.join(",")}
      capture={source === "camera" ? "user" : undefined}
      onChange={choose}
      className="sr-only"
      tabIndex={-1}
      aria-hidden="true"
    />
  );

  if (phase === "source") {
    return (
      <SetupStep
        intro={copy.source.intro}
        onSubmit={(event) => {
          event.preventDefault();
          fileInput.current?.click();
        }}
        back={<SetupBack onClick={() => discardPending("grid")} />}
        primary={<SetupPrimary label={copy.source.primary} />}
      >
        <ChoiceGroup legend={copy.source.label}>
          {copy.source.choices.map((choice) => (
            <ChoiceCard
              key={choice.value}
              choice={choice}
              type="radio"
              name={name}
              checked={source === choice.value}
              onChange={() => setSource(choice.value)}
            />
          ))}
        </ChoiceGroup>
        {invalid && <StatusNote variant="error" message={copy.source.invalid} />}
        {fileField}
      </SetupStep>
    );
  }

  if (phase === "preview" && pending) {
    return (
      <SetupStep
        intro={copy.preview.intro}
        placement="fill"
        back={<SetupBack onClick={() => discardPending("source")} />}
        primary={<SetupPrimary label={copy.preview.primary} onClick={() => void start()} />}
        secondary={<SetupTextAction label={copy.preview.secondary} onClick={() => discardPending("source")} />}
      >
        <PhotoTile src={pending.url} alt={copy.preview.alt} frame="preview" />
      </SetupStep>
    );
  }

  if ((phase === "upload" || phase === "error") && pending) {
    const failed = phase === "error";
    return (
      <SetupStep
        intro={failed ? copy.error.intro : copy.upload.intro}
        busy={!failed}
        back={<SetupBack onClick={failed ? () => discardPending("grid") : cancelUpload} />}
        primary={failed ? <SetupPrimary label={copy.error.primary} onClick={() => void start()} /> : <SetupPrimary label={copy.upload.primary} busy />}
        secondary={failed ? <SetupTextAction label={copy.error.secondary} onClick={() => discardPending("source")} /> : undefined}
      >
        {!failed && photos.length > 0 && <StatusNote variant="reassure" message={copy.upload.saved} />}
        <UploadStatus
          thumbnail={pending.url}
          title={copy.upload.fileTitle}
          status={failed ? copy.error.status : copy.upload.progress.replace("{percent}", String(percent))}
          percent={percent}
          progressLabel={copy.upload.progressLabel}
        />
      </SetupStep>
    );
  }

  const missing = copy.required - photos.length;
  if (missing <= 0) {
    return (
      <SetupStep
        intro={copy.ready.intro}
        back={<SetupBack link={flow.back} />}
        primary={<SetupPrimary label={getOnboardingShared().continueLabel} busy={saving} onClick={() => void save({ photos })} />}
        busy={saving}
        revealDelay={0}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <PhotoTile src={photos[0].url} alt={copy.photoAlt[0]} />
          <div className="flex flex-col justify-center gap-4 sm:h-58">
            <Text variant="text18SemiboldTight" tone="gray900">
              {copy.ready.title}
            </Text>
            <ul>
              {copy.ready.lines.map((line) => (
                <Text as="li" key={line} variant="text14Relaxed" tone="muted">
                  {line}
                </Text>
              ))}
            </ul>
            <Text variant="text12Relaxed" tone="muted">
              {copy.ready.note}
            </Text>
          </div>
        </div>
        <SetupError message={error} />
      </SetupStep>
    );
  }

  return (
    <SetupStep
      intro={copy.intro}
      back={<SetupBack link={flow.back} />}
      primary={<SetupPrimary label={missing === 1 ? copy.missing.one : copy.missing.other.replace("{count}", String(missing))} disabled />}
      revealDelay={0}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        {photos.map((photo, index) => (
          <PhotoTile key={photo.id} src={photo.url} alt={copy.photoAlt[index]} />
        ))}
        <AddPhotoTile title={copy.addTile.title} description={copy.addTile.description} onClick={() => setPhase("source")} />
      </div>
      <Text variant="text12Relaxed" tone="gray900">
        {copy.note}
      </Text>
    </SetupStep>
  );
}
