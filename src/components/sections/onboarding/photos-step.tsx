"use client";

import { useEffect, useId, useRef, useState, type ChangeEvent } from "react";
import { AddPhotoTile } from "@/components/pieces/media/add-photo-tile";
import { ChoiceCard } from "@/components/pieces/forms/choice-card";
import { ChoiceGroup } from "@/components/pieces/forms/choice-group";
import { PhotoTile } from "@/components/pieces/media/photo-tile";
import { SelfieFrame } from "@/components/pieces/media/selfie-frame";
import { SetupStep } from "@/components/pieces/shells/setup-step";
import { StatusNote } from "@/components/pieces/feedback/status-note";
import { Text } from "@/components/pieces/content/text";
import { UploadStatus } from "@/components/pieces/feedback/upload-status";
import { Button } from "@/components/ui/button";
import { fill } from "@/lib/format";
import { onboardingService } from "@/lib/onboarding/onboarding-service";
import { photoStore, usePhotos } from "@/lib/onboarding/photo-store";
import { getOnboardingShared, getPhotosStep, getStepFlow } from "@/stores/onboarding-store";
import { SetupBack, SetupError, SetupPrimary, SetupTextAction, useSaveStep } from "./step-actions";

type Phase = "grid" | "source" | "camera" | "preview" | "upload" | "error";
type Pending = { file: File; url: string };

/** JPEG quality of a photo taken with the camera. */
const PHOTO_QUALITY = 0.9;

/**
 * PHOTOS → PHOTO-SOURCE (→ camera) → PHOTO-PREVIEW → PHOTO-UPLOAD → PHOTO-ERROR / PHOTO-READY.
 * Two valid uploads are required (up to `max`); the chosen file is checked before upload. Every
 * added photo shows in one grid where the member picks the main photo (sent first) or removes one.
 * "Take a photo" opens the camera only from that click and releases it whenever the view is left.
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
  const [cameraFailed, setCameraFailed] = useState(false);
  const [opening, setOpening] = useState(false);
  const [pending, setPending] = useState<Pending | null>(null);
  const [percent, setPercent] = useState(0);
  const fileInput = useRef<HTMLInputElement>(null);
  const upload = useRef<AbortController | null>(null);
  const pendingUrl = useRef<string | null>(null);
  const video = useRef<HTMLVideoElement>(null);
  const stream = useRef<MediaStream | null>(null);

  const stopCamera = () => {
    stream.current?.getTracks().forEach((track) => track.stop());
    stream.current = null;
  };

  // Leaving the step stops an upload, the camera and frees a photo that was never added.
  useEffect(
    () => () => {
      upload.current?.abort();
      stream.current?.getTracks().forEach((track) => track.stop());
      if (pendingUrl.current) URL.revokeObjectURL(pendingUrl.current);
    },
    [],
  );

  useEffect(() => {
    if (phase === "camera" && video.current && stream.current) video.current.srcObject = stream.current;
  }, [phase]);

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
    if (file) take(file);
  }

  function take(file: File) {
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

  /** The camera opens from the member's click; where it can't, the device's own capture picker is used. */
  async function openCamera() {
    if (!navigator.mediaDevices?.getUserMedia) {
      fileInput.current?.click();
      return;
    }
    setOpening(true);
    setCameraFailed(false);
    try {
      stream.current = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" }, audio: false });
      setPhase("camera");
    } catch {
      setCameraFailed(true);
    } finally {
      setOpening(false);
    }
  }

  function leaveCamera() {
    stopCamera();
    setPhase("source");
  }

  function takePhoto() {
    const frame = video.current;
    if (!frame || !frame.videoWidth) return;
    const canvas = document.createElement("canvas");
    canvas.width = frame.videoWidth;
    canvas.height = frame.videoHeight;
    const context = canvas.getContext("2d");
    if (!context) return;
    // Saved the way the member saw it (mirrored preview).
    context.translate(canvas.width, 0);
    context.scale(-1, 1);
    context.drawImage(frame, 0, 0);
    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        stopCamera();
        take(new File([blob], copy.camera.fileName, { type: "image/jpeg" }));
      },
      "image/jpeg",
      PHOTO_QUALITY,
    );
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
          if (source === "camera") void openCamera();
          else fileInput.current?.click();
        }}
        busy={opening}
        back={<SetupBack onClick={() => discardPending("grid")} />}
        primary={<SetupPrimary label={source === "camera" ? copy.source.cameraPrimary : copy.source.primary} busy={opening} />}
      >
        <ChoiceGroup legend={copy.source.label}>
          {copy.source.choices.map((choice) => (
            <ChoiceCard
              key={choice.value}
              choice={choice}
              type="radio"
              name={name}
              checked={source === choice.value}
              onChange={() => {
                setSource(choice.value);
                setCameraFailed(false);
              }}
            />
          ))}
        </ChoiceGroup>
        {invalid && <StatusNote variant="error" message={copy.source.invalid} />}
        {cameraFailed && <StatusNote variant="error" message={copy.camera.failed} />}
        {fileField}
      </SetupStep>
    );
  }

  if (phase === "camera") {
    return (
      <SetupStep
        intro={copy.camera.intro}
        placement="fill"
        onSubmit={(event) => {
          event.preventDefault();
          takePhoto();
        }}
        back={<SetupBack onClick={leaveCamera} />}
        primary={<SetupPrimary label={copy.camera.primary} />}
      >
        <SelfieFrame>
          <video ref={video} autoPlay muted playsInline aria-label={copy.camera.videoLabel} className="size-full -scale-x-100 object-cover" />
        </SelfieFrame>
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
  const ready = missing <= 0;
  const intro = ready ? { ...copy.ready.intro, description: fill(copy.ready.intro.description, { count: photos.length }) } : copy.intro;

  return (
    <SetupStep
      intro={intro}
      back={<SetupBack link={flow.back} />}
      primary={
        ready ? (
          <SetupPrimary label={getOnboardingShared().continueLabel} busy={saving} onClick={() => void save({ photos })} />
        ) : (
          <SetupPrimary label={missing === 1 ? copy.missing.one : copy.missing.other.replace("{count}", String(missing))} disabled />
        )
      }
      busy={saving}
      revealDelay={0}
    >
      <ul aria-label={copy.grid.label} className="grid gap-4 sm:grid-cols-2">
        {photos.map((photo, index) => (
          <li key={photo.id} className="flex min-w-0 flex-col gap-2">
            <PhotoTile src={photo.url} alt={index === 0 ? copy.photoAlt.main : fill(copy.photoAlt.other, { number: index + 1 })} />
            <div className="flex flex-wrap items-center gap-2">
              {index === 0 ? (
                <Text as="span" variant="text14Medium" tone="rose">
                  {copy.grid.main}
                </Text>
              ) : (
                <Button type="button" variant="neutral" size="compact" disabled={saving} onClick={() => photoStore.makeMain(photo.id)}>
                  {copy.grid.makeMain}
                </Button>
              )}
              <Button type="button" variant="neutral" size="compact" disabled={saving} onClick={() => photoStore.remove(photo.id)}>
                {copy.grid.remove}
              </Button>
            </div>
          </li>
        ))}
        {photos.length < copy.max && (
          <li className="flex">
            <AddPhotoTile title={copy.addTile.title} description={copy.addTile.description} onClick={() => setPhase("source")} className="w-full" />
          </li>
        )}
      </ul>
      <Text variant="text12Relaxed" tone="gray900">
        {ready ? copy.ready.note : copy.note}
      </Text>
      <SetupError message={error} />
    </SetupStep>
  );
}
