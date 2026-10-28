import Image from "next/image";
import { IconRow } from "@/components/pieces/cards/icon-row";
import { Reveal } from "@/components/pieces/layout/reveal";
import { Section } from "@/components/pieces/layout/section";
import { SectionIntro } from "@/components/pieces/layout/section-intro";
import { SettingsCard } from "@/components/pieces/illustrations/settings-card";
import { getAnchors, getSafety } from "@/stores/landing-store";

const TITLE_ID = "safety-title";

/** 05 / Safety / Verification and control */
export function Safety() {
  const safety = getSafety();
  return (
    <Section id={getAnchors().safety} labelledBy={TITLE_ID}>
      <div className="grid gap-12 lg:grid-cols-[740fr_666fr] lg:items-center lg:gap-16 2xl:gap-32.5">
        <Reveal delay={0} className="relative aspect-[740/680] overflow-hidden rounded-32 bg-rose-light">
          <Image
            src={safety.image.src}
            alt={safety.image.alt}
            fill
            sizes="(min-width: 1024px) 50vw, 100vw"
            className="object-cover"
          />
          <span aria-hidden="true" className="absolute inset-0 bg-linear-to-b from-scrim-warm/0 from-60% to-scrim-warm/38" />
          <IconRow item={safety.verified} variant="glass" className="absolute top-4 left-4 md:top-7 md:left-7" />
          <SettingsCard card={safety.controls} className="absolute right-4 bottom-4 md:right-7 md:bottom-7.5" />
        </Reveal>
        <div>
          <SectionIntro
            intro={safety.intro}
            titleId={TITLE_ID}
            titleVariant="display64"
            spacing="aside"
            descriptionClassName="max-w-166.5"
            revealDelay={120}
          />
          <ul className="flex flex-col gap-3 pt-9.5">
            {safety.items.map((item, index) => (
              <IconRow key={item.title} as="li" item={item} variant="outline" revealDelay={200 + index * 80} />
            ))}
          </ul>
        </div>
      </div>
    </Section>
  );
}
