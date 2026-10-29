import Image from "next/image";
import { CardHeading } from "@/components/pieces/content/card-heading";
import { PortalCard } from "@/components/pieces/layout/portal-card";
import { Text } from "@/components/pieces/content/text";
import type { ImageAsset } from "@/data/types";

/** STORY-DETAIL / STORY-MINE: the 350px photo and the story card (who, when, the story itself). */
export function StoryBody({ photo, title, meta, body }: { photo: ImageAsset; title: string; meta: string; body: string }) {
  return (
    <>
      <div className="relative h-87.5 w-full overflow-hidden rounded-16 max-md:h-60">
        <Image src={photo.src} alt={photo.alt} fill sizes="(min-width: 1280px) 860px, 100vw" className="object-cover" />
      </div>
      <PortalCard surface="outline" padding="sm" className="flex w-full flex-col gap-4">
        <CardHeading as="h2" size={14} title={title} description={meta} />
        <Text variant="text16" tone="sub" className="break-words whitespace-pre-wrap">
          {body}
        </Text>
      </PortalCard>
    </>
  );
}
