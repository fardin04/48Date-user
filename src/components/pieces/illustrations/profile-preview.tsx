import Image from "next/image";
import type { features } from "@/data/landing/features";
import { cn } from "@/lib/cn";
import { Chip } from "@/components/pieces/content/chip";
import { Reveal } from "@/components/pieces/layout/reveal";
import { Text } from "@/components/pieces/content/text";

type ProfilePreviewProps = {
  profile: (typeof features)["matching"]["profile"];
  /** Placement only (rule 17). */
  className?: string;
  revealDelay?: number;
};

/** Illustrative match card: portrait with fit summary, name, reason and shared interests. */
export function ProfilePreview({ profile, className, revealDelay }: ProfilePreviewProps) {
  return (
    <Reveal
      delay={revealDelay}
      className={cn(
        "grid overflow-hidden rounded-22 border border-line bg-white shadow-float md:grid-cols-[320fr_556fr]",
        className,
      )}
    >
      <div className="relative min-h-105 xl:min-h-120">
        <Image
          src={profile.image.src}
          alt={profile.image.alt}
          fill
          sizes="(min-width: 768px) 320px, 100vw"
          className="object-cover"
        />
        <div className="absolute inset-x-4 bottom-4 flex flex-col gap-1 rounded-11 bg-ink-glass/78 px-3.75 py-3.25 backdrop-blur-[12px]">
          <Text variant="text14Bold" tone="white">
            {profile.fit.title}
          </Text>
          <Text variant="text12" tone="white">
            {profile.fit.detail}
          </Text>
        </div>
      </div>
      <div className="flex flex-col justify-center p-6 md:p-8 xl:p-12">
        <Text variant="text11Bold" tone="rose" className="pt-1.25 pb-0.5">
          {profile.eyebrow}
        </Text>
        <Text as="h4" variant="heading36" className="pt-3.75">
          {profile.name}
        </Text>
        <Text variant="text16" tone="muted" className="pt-3.75">
          {profile.reason}
        </Text>
        <ul className="flex flex-wrap gap-2 pt-7">
          {profile.interests.map((interest) => (
            <li key={interest}>
              <Chip variant="interest">{interest}</Chip>
            </li>
          ))}
        </ul>
      </div>
    </Reveal>
  );
}
