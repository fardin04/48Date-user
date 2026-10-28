import Image from "next/image";
import { Chip } from "@/components/pieces/content/chip";
import { Icon } from "@/components/pieces/content/icon";
import { SoftPanel } from "@/components/pieces/layout/soft-panel";
import { Text } from "@/components/pieces/content/text";

type ReadyCardProps = {
  name: string;
  line: string;
  footer: string;
  interests: string[];
  interestsLabel: string;
  /** Object URL of the main photo; a placeholder shows when none is in this tab. */
  photo?: { src: string; alt: string };
  /** Placement only (rule 17). */
  className?: string;
  revealDelay?: number;
};

/** "Visual / READY": the member's own profile preview before discovery opens. */
export function ReadyCard({ name, line, footer, interests, interestsLabel, photo, className, revealDelay }: ReadyCardProps) {
  return (
    <SoftPanel className={className} revealDelay={revealDelay}>
      <div className="flex min-h-30 items-center gap-5">
        <div className="relative flex h-30 w-24 shrink-0 items-center justify-center overflow-hidden rounded-12 bg-rose-light">
          {photo ? (
            // Local object URL: nothing for the image optimizer to fetch.
            <Image src={photo.src} alt={photo.alt} fill unoptimized sizes="96px" className="object-cover" />
          ) : (
            <Icon name="user-circle" size={40} tone="rose" />
          )}
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <Text variant="text20SemiboldTight" tone="strong" className="truncate">
            {name}
          </Text>
          <Text variant="text14Relaxed" tone="sub">
            {line}
          </Text>
          {interests.length > 0 && (
            <ul aria-label={interestsLabel} className="flex gap-2">
              {interests.map((interest) => (
                <li key={interest} className="flex min-w-0 flex-1">
                  <Chip variant="setup">{interest}</Chip>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
      <Text variant="text14Relaxed" tone="sub">
        {footer}
      </Text>
    </SoftPanel>
  );
}
