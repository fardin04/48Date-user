"use client";

import { useQueryClient } from "@tanstack/react-query";
import { screenKeys } from "@/lib/screen-keys";
import Image from "next/image";
import { useEffect, useEffectEvent, useRef, useState } from "react";
import { SelfieFrame } from "@/components/pieces/media/selfie-frame";
import { SetupStep } from "@/components/pieces/shells/setup-step";
import { StatusBadge } from "@/components/pieces/feedback/status-badge";
import { StatusNote } from "@/components/pieces/feedback/status-note";
import { SummaryRow } from "@/components/pieces/cards/summary-row";
import { TrustPanel } from "@/components/pieces/cards/trust-panel";
import { onboardingService, type Verification, type VerificationStatus } from "@/lib/onboarding/onboarding-service";
import { createSelfieCheck, type SelfieCheck } from "@/lib/onboarding/selfie-check";
import { getStepFlow, getVerifyStep } from "@/stores/onboarding-store";
import { SetupBack, SetupPrimary, SetupTextAction, useAdvance } from "./step-actions";

type Phase = "intro" | "camera" | "denied" | "capture" | "review" | "pending" | "retry" | "done" | "status";
type Selfie = { blob: Blob; url: string };
/** VERIFY-CAPTURE guidance from the on-device check; `manual` when it can't run here. */
type Guide = "loading" | "face" | "gesture" | "hold" | "manual";

const SELFIE_QUALITY = 0.9;
/** The check reads about eight frames a second and captures once face and V sign hold this long. */
const READ_EVERY_MS = 120;
const HOLD_MS = 700;
const GRACE_MS = 400;

/** Screen that a stored review result reopens on. */
const phaseFor: Record<VerificationStatus, Phase> = { none: "intro", pending: "pending", retry: "retry", verified: "done" };

/** The retry note: the reviewer's own words, or the copy for the backend's reason code. */
function retryReason(reason: string | undefined) {
  const copy = getVerifyStep().retry;
  if (!reason) return copy.fallback;
  const known = copy.reasons[reason.toUpperCase()];
  if (known) return known;
  // A written note has spaces or lower case; an unknown CODE_NAME gets the general line.
  return /^[A-Z0-9_]+$/.test(reason) ? copy.fallback : copy.note.replace("{reason}", reason);
}

/**
 * W03 / Identity Verification on one URL (rule 32): intro → camera permission → live capture →
 * review → private service review (pending → done / retry), plus the status summary.
 * The capture is automatic: an on-device check takes the selfie once one face and a V sign stay in
 * view (by hand where the check can't run). The camera stream and the selfie stay in this tab; the
 * selfie is released once submitted.
 */
export function VerifyStep() {
  const queryClient = useQueryClient();
  const copy = getVerifyStep();
  const flow = getStepFlow("verify");
  const advance = useAdvance("verify");
  const [phase, setPhase] = useState<Phase>("intro");
  const [status, setStatus] = useState<VerificationStatus>("none");
  const [reason, setReason] = useState<string | undefined>();
  const [guide, setGuide] = useState<Guide>("loading");
  const [busy, setBusy] = useState(false);
  const [selfie, setSelfie] = useState<Selfie | null>(null);
  const video = useRef<HTMLVideoElement>(null);
  const stream = useRef<MediaStream | null>(null);
  const selfieUrl = useRef<string | null>(null);

  const stopCamera = () => {
    stream.current?.getTracks().forEach((track) => track.stop());
    stream.current = null;
  };

  const dropSelfie = () => {
    if (selfieUrl.current) URL.revokeObjectURL(selfieUrl.current);
    selfieUrl.current = null;
    setSelfie(null);
  };

  const show = (result: Verification) => {
    setStatus(result.status);
    setReason(result.reason);
    setPhase(phaseFor[result.status]);
  };

  // Reopen on the stored review result; release the camera and the selfie when leaving.
  useEffect(() => {
    let active = true;
    void queryClient.fetchQuery({ queryKey: screenKeys.verification, queryFn: onboardingService.getVerification, staleTime: 0 }).then((current) => {
      if (!active) return;
      setStatus(current.status);
      setReason(current.reason);
      setPhase(phaseFor[current.status]);
    }).catch(() => undefined);
    return () => {
      active = false;
      stream.current?.getTracks().forEach((track) => track.stop());
      if (selfieUrl.current) URL.revokeObjectURL(selfieUrl.current);
    };
  }, [queryClient]);

  // While in review, wait for the result (the service's live updates); setup can continue meanwhile (handoff).
  useEffect(() => {
    if (phase !== "pending") return;
    const controller = new AbortController();
    onboardingService.waitForVerification(controller.signal).then(
      (current) => {
        queryClient.setQueryData(screenKeys.verification, current);
        setStatus(current.status);
        setReason(current.reason);
        setPhase(phaseFor[current.status]);
      },
      () => undefined,
    );
    return () => controller.abort();
  }, [phase, queryClient]);

  // Attach the live stream once the capture frame is on screen.
  useEffect(() => {
    if (phase === "capture" && video.current && stream.current) video.current.srcObject = stream.current;
  }, [phase]);

  const captureNow = useEffectEvent(() => takeSelfie());

  // While capturing, watch the preview for one face and a V sign, then take the selfie by itself.
  useEffect(() => {
    if (phase !== "capture") return;
    let active = true;
    let check: SelfieCheck | null = null;
    let frame = 0;
    let lastRead = 0;
    let heldSince = 0;
    let lastSeen = 0;

    const tick = (now: number) => {
      const preview = video.current;
      if (!active || !check) return;
      if (preview && preview.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA && now - lastRead >= READ_EVERY_MS) {
        lastRead = now;
        const seen = check.read(preview, now);
        const both = seen.face && seen.victory;
        if (both) lastSeen = now;
        // Hand tracking flickers frame to frame: a short miss keeps the hold going.
        const holding = both || (heldSince > 0 && now - lastSeen <= GRACE_MS);
        heldSince = holding ? heldSince || now : 0;
        setGuide(holding ? "hold" : !seen.face ? "face" : "gesture");
        if (both && heldSince && now - heldSince >= HOLD_MS) {
          captureNow();
          return;
        }
      }
      frame = requestAnimationFrame(tick);
    };

    createSelfieCheck().then(
      (loaded) => {
        if (!active) return loaded.close();
        check = loaded;
        setGuide("face");
        frame = requestAnimationFrame(tick);
      },
      () => {
        if (active) setGuide("manual");
      },
    );
    return () => {
      active = false;
      cancelAnimationFrame(frame);
      check?.close();
    };
  }, [phase]);

  async function startCamera() {
    dropSelfie();
    if (!navigator.mediaDevices?.getUserMedia) {
      setPhase("denied");
      return;
    }
    setBusy(true);
    try {
      stream.current = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" }, audio: false });
      setGuide("loading");
      setPhase("capture");
    } catch {
      // Refused, blocked or no camera: all recover through the same screen.
      setPhase("denied");
    } finally {
      setBusy(false);
    }
  }

  function takeSelfie() {
    const frame = video.current;
    if (!frame || !frame.videoWidth) return;
    const canvas = document.createElement("canvas");
    canvas.width = frame.videoWidth;
    canvas.height = frame.videoHeight;
    const context = canvas.getContext("2d");
    if (!context) return;
    // Save the frame the way the member saw it (mirrored preview).
    context.translate(canvas.width, 0);
    context.scale(-1, 1);
    context.drawImage(frame, 0, 0);
    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        stopCamera();
        const url = URL.createObjectURL(blob);
        selfieUrl.current = url;
        setSelfie({ blob, url });
        setPhase("review");
      },
      "image/jpeg",
      SELFIE_QUALITY,
    );
  }

  async function submit() {
    if (!selfie) return;
    setBusy(true);
    const result = await onboardingService.submitSelfie(selfie.blob);
    setBusy(false);
    // The private selfie is no longer needed in the page once the service has it.
    dropSelfie();
    show(result);
  }

  const leaveCapture = (next: Phase) => {
    stopCamera();
    setPhase(next);
  };

  switch (phase) {
    case "camera":
      return (
        <SetupStep
          intro={copy.camera.intro}
          busy={busy}
          back={<SetupBack onClick={() => setPhase("intro")} />}
          primary={<SetupPrimary label={busy ? copy.camera.starting : copy.camera.primary} busy={busy} onClick={() => void startCamera()} />}
          secondary={<SetupTextAction label={copy.camera.secondary} onClick={advance} />}
        >
          <TrustPanel trust={copy.camera.trust} />
        </SetupStep>
      );
    case "denied":
      return (
        <SetupStep
          intro={copy.denied.intro}
          back={<SetupBack onClick={() => setPhase("camera")} />}
          primary={<SetupPrimary label={copy.denied.primary} onClick={() => setPhase("camera")} />}
          secondary={<SetupTextAction label={copy.denied.secondary} onClick={() => setPhase("intro")} />}
        >
          <TrustPanel trust={copy.denied.trust} />
        </SetupStep>
      );
    case "capture":
      return (
        <SetupStep
          intro={copy.capture.intro}
          back={<SetupBack onClick={() => leaveCapture("camera")} />}
          primary={
            guide === "manual" ? <SetupPrimary label={copy.capture.primary} onClick={takeSelfie} /> : <SetupPrimary label={copy.capture.auto} busy />
          }
          secondary={<SetupTextAction label={copy.capture.secondary} onClick={() => leaveCapture("intro")} />}
        >
          <SelfieFrame>
            <video ref={video} autoPlay muted playsInline aria-label={copy.capture.videoLabel} className="size-full -scale-x-100 object-cover" />
          </SelfieFrame>
          <StatusNote variant={guide === "hold" ? "reassure" : "pending"} message={guide === "manual" ? copy.capture.manual : copy.capture.guide[guide]} />
        </SetupStep>
      );
    case "review":
      return (
        <SetupStep
          intro={copy.review.intro}
          busy={busy}
          back={<SetupBack onClick={() => void startCamera()} />}
          primary={<SetupPrimary label={busy ? copy.review.submitting : copy.review.primary} busy={busy} onClick={() => void submit()} />}
          secondary={
            <SetupTextAction
              label={copy.review.secondary}
              onClick={() => {
                dropSelfie();
                setPhase("camera");
              }}
            />
          }
        >
          {selfie && (
            <SelfieFrame>
              {/* Local object URL: nothing for the image optimizer to fetch. */}
              <Image src={selfie.url} alt={copy.review.alt} fill unoptimized sizes="181px" className="object-cover" />
            </SelfieFrame>
          )}
        </SetupStep>
      );
    case "pending":
      return (
        <SetupStep
          intro={copy.pending.intro}
          back={<SetupBack onClick={() => setPhase("intro")} />}
          primary={<SetupPrimary label={copy.pending.primary} onClick={advance} />}
        >
          <StatusBadge variant="warning" label={copy.pending.badge} className="w-full" />
          <TrustPanel trust={copy.pending.trust} />
        </SetupStep>
      );
    case "retry":
      return (
        <SetupStep
          intro={copy.retry.intro}
          back={<SetupBack onClick={() => setPhase("intro")} />}
          primary={<SetupPrimary label={copy.retry.primary} onClick={() => setPhase("camera")} />}
          secondary={<SetupTextAction label={copy.retry.secondary} onClick={() => setPhase("intro")} />}
        >
          <StatusNote variant="error" message={retryReason(reason)} />
          <TrustPanel trust={copy.retry.trust} />
        </SetupStep>
      );
    case "done":
      return (
        <SetupStep
          intro={copy.done.intro}
          back={<SetupBack onClick={() => setPhase("status")} />}
          primary={<SetupPrimary label={copy.done.primary} onClick={advance} />}
        >
          <TrustPanel trust={copy.done.trust} />
        </SetupStep>
      );
    case "status":
      return (
        <SetupStep
          intro={copy.status.intro}
          back={<SetupBack onClick={() => setPhase("intro")} />}
          primary={<SetupPrimary label={copy.status.primary} onClick={() => setPhase("intro")} />}
        >
          <dl aria-label={copy.status.label} className="flex flex-col gap-4">
            <SummaryRow label={copy.status.phone.label} value={copy.status.phone.value} />
            <SummaryRow label={copy.status.selfie.label} value={copy.status.selfie.values[status]} />
          </dl>
        </SetupStep>
      );
    case "intro":
      return (
        <SetupStep
          intro={copy.intro.intro}
          back={<SetupBack link={flow.back} />}
          primary={<SetupPrimary label={copy.intro.primary} onClick={() => setPhase("camera")} />}
          secondary={<SetupTextAction label={copy.intro.secondary} onClick={advance} />}
          revealDelay={0}
        >
          <TrustPanel trust={copy.intro.trust} />
        </SetupStep>
      );
  }
}
