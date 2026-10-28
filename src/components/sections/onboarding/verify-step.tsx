"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { SelfieFrame } from "@/components/pieces/media/selfie-frame";
import { SetupStep } from "@/components/pieces/shells/setup-step";
import { StatusBadge } from "@/components/pieces/feedback/status-badge";
import { SummaryRow } from "@/components/pieces/cards/summary-row";
import { TrustPanel } from "@/components/pieces/cards/trust-panel";
import { onboardingService, type VerificationStatus } from "@/lib/onboarding/onboarding-service";
import { getStepFlow, getVerifyStep } from "@/stores/onboarding-store";
import { SetupBack, SetupPrimary, SetupTextAction, useAdvance } from "./step-actions";

type Phase = "intro" | "camera" | "denied" | "capture" | "review" | "pending" | "retry" | "done" | "status";
type Selfie = { blob: Blob; url: string };

/** Review polling (`GET /verification/:id`, the documented fallback to its SSE stream). */
const POLL_MS = 3000;
const SELFIE_QUALITY = 0.9;

/** Screen that a stored review result reopens on. */
const phaseFor: Record<VerificationStatus, Phase> = { none: "intro", pending: "pending", retry: "retry", verified: "done" };

/**
 * W03 / Identity Verification on one URL (rule 32): intro → camera permission → live capture →
 * review → private service review (pending → done / retry), plus the status summary.
 * The camera stream and the selfie stay in this tab; the selfie is released once submitted.
 */
export function VerifyStep() {
  const copy = getVerifyStep();
  const flow = getStepFlow("verify");
  const advance = useAdvance("verify");
  const [phase, setPhase] = useState<Phase>("intro");
  const [status, setStatus] = useState<VerificationStatus>("none");
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

  // Reopen on the stored review result; release the camera and the selfie when leaving.
  useEffect(() => {
    let active = true;
    void onboardingService.getVerification().then((current) => {
      if (!active) return;
      setStatus(current);
      setPhase(phaseFor[current]);
    });
    return () => {
      active = false;
      stream.current?.getTracks().forEach((track) => track.stop());
      if (selfieUrl.current) URL.revokeObjectURL(selfieUrl.current);
    };
  }, []);

  // While in review, check for the result; setup can continue meanwhile (handoff).
  useEffect(() => {
    if (phase !== "pending") return;
    let active = true;
    let timer: ReturnType<typeof setTimeout>;
    // Each check waits for the previous one, so slow responses never pile up.
    const poll = () => {
      timer = setTimeout(async () => {
        const current = await onboardingService.getVerification();
        if (!active) return;
        if (current === "pending") return poll();
        setStatus(current);
        setPhase(phaseFor[current]);
      }, POLL_MS);
    };
    poll();
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [phase]);

  // Attach the live stream once the capture frame is on screen.
  useEffect(() => {
    if (phase === "capture" && video.current && stream.current) video.current.srcObject = stream.current;
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
    setStatus(result);
    setPhase(phaseFor[result]);
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
          primary={<SetupPrimary label={copy.capture.primary} onClick={takeSelfie} />}
          secondary={<SetupTextAction label={copy.capture.secondary} onClick={() => leaveCapture("intro")} />}
        >
          <SelfieFrame>
            <video ref={video} autoPlay muted playsInline aria-label={copy.capture.videoLabel} className="size-full -scale-x-100 object-cover" />
          </SelfieFrame>
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
