import { cn } from "@/lib/cn";
import { Icon } from "@/components/pieces/content/icon";
import { Reveal } from "@/components/pieces/layout/reveal";
import { Text } from "@/components/pieces/content/text";

type AddPhotoTileProps = {
  title: string;
  description: string;
  onClick: () => void;
  /** Placement only (rule 17). */
  className?: string;
  revealDelay?: number;
};

/** "Photos / Add another photo": dashed 232px tile that starts the photo flow. */
export function AddPhotoTile({ title, description, onClick, className, revealDelay }: AddPhotoTileProps) {
  return (
    <Reveal delay={revealDelay} className={cn("flex", className)}>
      <button
        type="button"
        onClick={onClick}
        className="focus-ring flex h-58 w-full cursor-pointer flex-col items-center justify-center gap-3 rounded-16 border border-dashed border-input-line bg-notice-bg px-6 text-center transition-colors hover:bg-rose-light"
      >
        <Icon name="image-add-01" size={28} tone="rose" />
        <Text as="span" variant="text16SemiboldTight" tone="gray900">
          {title}
        </Text>
        <Text as="span" variant="text14Relaxed" tone="gray900">
          {description}
        </Text>
      </button>
    </Reveal>
  );
}
