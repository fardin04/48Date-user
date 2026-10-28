import Image from "next/image";
import { ActionButton } from "@/components/pieces/actions/action-button";
import { FormHeader } from "@/components/pieces/forms/form-header";
import { TypingDots } from "@/components/pieces/content/typing-dots";
import type { Action, ImageAsset, Intro } from "@/data/types";

type MessageStepProps = {
  intro: Intro;
  /** PHONE-VERIFIED / SIGNIN-VERIFIED show the success artwork; Google handoff shows activity dots. */
  visual?: { kind: "success"; image: ImageAsset } | { kind: "activity"; label: string };
  primary: Action;
  secondary?: Action;
};

/** Message screens: verified, Google handoff/recovery and session ended. */
export function MessageStep({ intro, visual, primary, secondary }: MessageStepProps) {
  return (
    <div className="flex flex-col items-center gap-6">
      <FormHeader eyebrow={intro.eyebrow} title={intro.title} description={intro.description ?? ""} revealDelay={0} />
      {visual?.kind === "success" && (
        <Image src={visual.image.src} alt={visual.image.alt} width={visual.image.width} height={visual.image.height} />
      )}
      {visual?.kind === "activity" && <TypingDots variant="activity" label={visual.label} />}
      <ActionButton action={primary} variant="solid" size="pill" width="full" revealDelay={80} className="w-full" />
      {secondary && <ActionButton action={secondary} variant="outline" size="pill" width="full" revealDelay={120} className="w-full" />}
    </div>
  );
}
