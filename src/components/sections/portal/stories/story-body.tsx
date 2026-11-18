import { CardHeading } from "@/components/pieces/content/card-heading";
import { MediaFrame } from "@/components/pieces/media/media-frame";
import { PortalCard } from "@/components/pieces/layout/portal-card";
import { Text } from "@/components/pieces/content/text";
import type { ImageAsset } from "@/data/types";

/**
 * STORY-DETAIL / STORY-MINE: the story photo at its own ratio (rule 50, bug N6: never cropped; the API
 * gives no dimensions, so it is measured on load) and the story card (who, when, the story itself).
 */
export function StoryBody({ photo, title, meta, body }: { photo: ImageAsset; title: string; meta: string; body: string }) {
  return (
    <>
      <MediaFrame src={photo.src} alt={photo.alt} maxHeight="story" sizes="(min-width: 1280px) 860px, 100vw" />
      <PortalCard surface="outline" padding="sm" className="flex w-full flex-col gap-4">
        <CardHeading as="h2" size={14} title={title} description={meta} />
        <Text variant="text16" tone="sub" className="break-anywhere whitespace-pre-wrap">
          {body}
        </Text>
      </PortalCard>
    </>
  );
}
