"use client";

import { useEffect, useRef, useState } from "react";
import { ActionRow } from "@/components/pieces/actions/action-row";
import { FormHeader } from "@/components/pieces/forms/form-header";
import { PortalBack } from "@/components/pieces/actions/portal-back";
import { StatusArtwork } from "@/components/pieces/feedback/status-artwork";
import { StatusNote } from "@/components/pieces/feedback/status-note";
import { Button } from "@/components/ui/button";
import type { Member } from "@/data/portal/types";
import { fill } from "@/lib/format";
import { getChatPage, getPortalShell } from "@/stores/portal-store";
import { ConversationContext } from "@/components/sections/portal/chats/conversation-context";
import { Workspace } from "@/components/sections/portal/shared/workspace";

type Phase = "idle" | "recording" | "review" | "denied";

const SECOND_MS = 1000;

/** "00:18" from whole seconds. */
const clock = (seconds: number) => `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;

type ChatVoiceProps = {
  member: Member;
  onSend: (duration: string) => Promise<void>;
  onDiscard: () => void;
};

/**
 * W05 / CHAT-VOICE: the microphone opens only from "Start recording", stops at the time limit or
 * on "Stop recording", and is released whenever the screen is left. The recording stays in memory
 * as an object URL for the preview and is revoked when sent or discarded.
 */
export function ChatVoice({ member, onSend, onDiscard }: ChatVoiceProps) {
  const copy = getChatPage().voice;
  const [phase, setPhase] = useState<Phase>("idle");
  const [seconds, setSeconds] = useState(0);
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const stream = useRef<MediaStream | null>(null);
  const recorder = useRef<MediaRecorder | null>(null);
  const previewUrl = useRef<string | null>(null);

  const release = () => {
    const active = recorder.current;
    recorder.current = null;
    if (active?.state === "recording") active.stop();
    stream.current?.getTracks().forEach((track) => track.stop());
    stream.current = null;
  };

  const dropPreview = () => {
    if (previewUrl.current) URL.revokeObjectURL(previewUrl.current);
    previewUrl.current = null;
    setPreview(null);
  };

  // Leaving the screen releases the microphone and the recording.
  useEffect(
    () => () => {
      const active = recorder.current;
      recorder.current = null;
      if (active?.state === "recording") active.stop();
      stream.current?.getTracks().forEach((track) => track.stop());
      if (previewUrl.current) URL.revokeObjectURL(previewUrl.current);
    },
    [],
  );

  // Count while recording.
  useEffect(() => {
    if (phase !== "recording") return;
    const timer = setInterval(() => setSeconds((current) => current + 1), SECOND_MS);
    return () => clearInterval(timer);
  }, [phase]);

  const stop = () => {
    if (recorder.current?.state === "recording") recorder.current.stop();
  };

  // Stop at the time limit.
  useEffect(() => {
    if (phase === "recording" && seconds >= copy.maxSeconds && recorder.current?.state === "recording") recorder.current.stop();
  }, [phase, seconds, copy.maxSeconds]);

  const start = async () => {
    dropPreview();
    setSeconds(0);
    try {
      const media = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.current = media;
      const chunks: Blob[] = [];
      const next = new MediaRecorder(media);
      next.ondataavailable = (event) => chunks.push(event.data);
      next.onstop = () => {
        stream.current?.getTracks().forEach((track) => track.stop());
        stream.current = null;
        // Discarded or left before the recording finished: keep nothing.
        if (recorder.current !== next) return;
        const url = URL.createObjectURL(new Blob(chunks, { type: next.mimeType }));
        previewUrl.current = url;
        setPreview(url);
        setPhase("review");
      };
      recorder.current = next;
      next.start();
      setPhase("recording");
    } catch {
      release();
      setPhase("denied");
    }
  };

  const send = async () => {
    if (busy) return;
    setBusy(true);
    await onSend(clock(seconds));
    dropPreview();
  };

  const discard = () => {
    release();
    dropPreview();
    onDiscard();
  };

  const note = { idle: copy.idle, recording: copy.recording, review: copy.paused, denied: copy.denied }[phase];

  return (
    <Workspace aside={<ConversationContext member={member.id} withAction />}>
      <PortalBack action={getPortalShell().back} onClick={discard} />
      <FormHeader variant="portalStatus" title={copy.title} description={fill(copy.description, { name: member.name })} />
      <StatusNote variant={phase === "denied" ? "alert" : "highlight"} message={note} />
      <StatusArtwork icon={copy.icon} timer={clock(seconds)} timerLabel={fill(copy.timerLabel, { seconds })} />
      {preview && <audio controls src={preview} aria-label={copy.previewLabel} className="w-full" />}
      <ActionRow>
        {phase === "recording" ? (
          <Button type="button" variant="confirm" size="portalPill" width="actionSlot" onClick={stop}>
            {copy.stop}
          </Button>
        ) : phase === "review" ? (
          <Button type="button" variant="confirm" size="portalPill" width="actionSlot" disabled={busy} aria-busy={busy || undefined} onClick={() => void send()}>
            {copy.send}
          </Button>
        ) : (
          <Button type="button" variant="confirm" size="portalPill" width="actionSlot" onClick={() => void start()}>
            {copy.start}
          </Button>
        )}
        <Button type="button" variant="roseOutline" size="portalPill" width="actionSlot" disabled={busy} onClick={discard}>
          {copy.discard}
        </Button>
      </ActionRow>
    </Workspace>
  );
}
