import type { ReactNode } from "react";
import type { Intro } from "@/data/types";
import { cn } from "@/lib/cn";
import { introSpacing, type IntroSpacing } from "@/lib/control-sizes";
import type { TextTone } from "@/lib/tones";
import type { TypeVariant } from "@/lib/type-scale";
import { Reveal } from "./reveal";
import { RichText } from "./rich-text";
import { Text } from "./text";

const tones = {
  light: { eyebrow: "rose", title: "ink", description: "muted" },
  dark: { eyebrow: "roseSoft", title: "white", description: "white" },
  /** Legal heading and download intro use the Align UI text colours. */
  neutral: { eyebrow: "rose", title: "strong", description: "sub" },
} satisfies Record<string, Record<"eyebrow" | "title" | "description", TextTone>>;

type SectionIntroProps = {
  intro: Intro;
  /** Heading id, used by the parent Section's aria-labelledby. */
  titleId?: string;
  level?: "h1" | "h2";
  titleVariant: Extract<TypeVariant, `display${string}`>;
  descriptionVariant?: Extract<TypeVariant, "text20" | "text18">;
  eyebrowVariant?: Extract<TypeVariant, "text13Bold" | "label14">;
  spacing: IntroSpacing;
  tone?: keyof typeof tones;
  /** Override for the one title that uses a different tone than its section (FAQ). */
  titleTone?: TextTone;
  align?: "start" | "center";
  /** Max-width classes for the title / description measure (placement). */
  titleClassName?: string;
  descriptionClassName?: string;
  /** Hide the description (rendered elsewhere, e.g. the split Features intro). */
  omitDescription?: boolean;
  /** Placement only (rule 17). */
  className?: string;
  revealDelay?: number;
  children?: ReactNode;
};

/** Eyebrow, heading and supporting copy that opens a section. */
export function SectionIntro({
  intro,
  titleId,
  level = "h2",
  titleVariant,
  descriptionVariant = "text20",
  eyebrowVariant = "text13Bold",
  spacing,
  tone = "light",
  titleTone,
  align = "start",
  titleClassName,
  descriptionClassName,
  omitDescription,
  className,
  revealDelay,
  children,
}: SectionIntroProps) {
  const colors = tones[tone];
  const gaps = introSpacing[spacing];
  return (
    <Reveal
      delay={revealDelay}
      className={cn("flex flex-col", align === "center" ? "items-center text-center" : "items-start", className)}
    >
      <Text variant={eyebrowVariant} tone={colors.eyebrow}>
        {intro.eyebrow}
      </Text>
      <div className={gaps.title}>
        <Text as={level} id={titleId} variant={titleVariant} tone={titleTone ?? colors.title} className={titleClassName}>
          <RichText copy={intro.title} />
        </Text>
      </div>
      {intro.description && !omitDescription && (
        <div className={gaps.description}>
          <Text variant={descriptionVariant} tone={colors.description} className={descriptionClassName}>
            {intro.description}
          </Text>
        </div>
      )}
      {children}
    </Reveal>
  );
}
