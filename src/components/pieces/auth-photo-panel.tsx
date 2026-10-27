import Image from "next/image";
import { cn } from "@/lib/cn";
import { getAuthShared } from "@/stores/auth-store";
import { Logo } from "./logo";
import { Reveal } from "./reveal";
import { RichText } from "./rich-text";
import { Text } from "./text";

type AuthPhotoPanelProps = {
  /** Placement and size only (rule 17). */
  className?: string;
  revealDelay?: number;
};

/** Shared authentication photo panel: approved couple photograph, logo card and brand promise. */
export function AuthPhotoPanel({ className, revealDelay }: AuthPhotoPanelProps) {
  const { photoPanel } = getAuthShared();
  return (
    <Reveal
      as="aside"
      delay={revealDelay}
      className={cn("relative isolate flex flex-col justify-between overflow-hidden rounded-32 px-10 py-12", className)}
    >
      {/* Own positioned layer: the panel itself may be `sticky`, which next/image's `fill` doesn't accept. */}
      <span aria-hidden="true" className="absolute inset-0 -z-20">
        <Image
          src={photoPanel.image.src}
          alt={photoPanel.image.alt}
          fill
          loading="eager"
          sizes="(min-width: 1024px) 648px, 1px"
          className="object-cover"
        />
      </span>
      <span
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-linear-to-b from-black/5 via-black/12 via-40% to-scrim-night/90"
      />
      <div className="self-start rounded-20 bg-white/94 p-4">
        <Logo size="xl" />
      </div>
      <div className="flex flex-col gap-6 text-white">
        <Text variant="authDisplay48" tone="white">
          <RichText copy={photoPanel.title} />
        </Text>
        <Text variant="text18" tone="white">
          {photoPanel.description}
        </Text>
        <Text variant="text14SemiboldRelaxed" tone="white" className="whitespace-pre-wrap">
          {photoPanel.highlights}
        </Text>
      </div>
    </Reveal>
  );
}
