import Image from "next/image";
import { ActionButton } from "@/components/pieces/actions/action-button";
import { ActionLink } from "@/components/pieces/actions/action-link";
import { Container } from "@/components/pieces/layout/container";
import { PhotoCard } from "@/components/pieces/media/photo-card";
import { QuoteCard } from "@/components/pieces/illustrations/quote-card";
import { Reveal } from "@/components/pieces/layout/reveal";
import { RichText } from "@/components/pieces/content/rich-text";
import { SiteNav } from "@/components/pieces/shells/site-nav";
import { Text } from "@/components/pieces/content/text";
import { getHero } from "@/stores/landing-store";

const TITLE_ID = "hero-title";

/** Collage geometry from Figma (765×760 box); below xl the cards stack in a grid. */
const collageSlots = [
  "aspect-[350/540] xl:absolute xl:top-[17.1%] xl:left-0 xl:aspect-auto xl:h-[71.05%] xl:w-[45.75%]",
  "aspect-[350/540] xl:absolute xl:top-[7.89%] xl:left-[38.56%] xl:aspect-auto xl:h-[46.05%] xl:w-[61.44%]",
];

/** 01 / Hero / Editorial connection */
export function Hero() {
  const hero = getHero();
  return (
    <section aria-labelledby={TITLE_ID} className="relative isolate overflow-hidden bg-hero">
      <Image
        src={hero.background.src}
        alt={hero.background.alt}
        fill
        preload
        sizes="100vw"
        className="-z-20 object-cover object-[center_45%]"
      />
      <span aria-hidden="true" className="hero-scrim absolute inset-0 -z-10" />
      <SiteNav variant="glass" revealDelay={0} />
      <Container className="pt-36 pb-28 xl:pt-50.5 xl:pb-29.5">
        <div className="grid gap-14 xl:grid-cols-[minmax(560px,683fr)_minmax(0,765fr)] xl:gap-16 2xl:gap-22">
          <div className="flex flex-col items-start xl:self-end xl:pb-23.5">
            <Text variant="text13Bold" tone="roseSoft" revealDelay={80}>
              {hero.eyebrow}
            </Text>
            <Text as="h1" id={TITLE_ID} variant="display96" tone="white" className="pt-6.25" revealDelay={160}>
              <RichText copy={hero.title} />
            </Text>
            <Text variant="text20" tone="white" className="max-w-165 pt-8.5" revealDelay={240}>
              {hero.description}
            </Text>
            <Reveal delay={320} className="flex flex-wrap gap-3.5 pt-9.5">
              <ActionButton action={hero.primary} variant="primary" size="lg" />
              <ActionButton action={hero.secondary} variant="glass" size="lg" />
            </Reveal>
          </div>
          <div role="group" aria-label={hero.collage.label} className="grid grid-cols-2 gap-3 xl:relative xl:block xl:aspect-[765/760] xl:self-end">
            {hero.collage.photos.map((photo, index) => (
              <PhotoCard
                key={photo.title}
                photo={photo}
                sizes="(min-width: 1280px) 470px, 50vw"
                eager
                className={collageSlots[index]}
                revealDelay={200 + index * 120}
              />
            ))}
            <QuoteCard
              quote={hero.collage.quote}
              className="col-span-2 xl:absolute xl:top-[57.4%] xl:left-[48.13%] xl:w-[47.06%] xl:min-w-75"
              revealDelay={440}
            />
          </div>
        </div>
      </Container>
      <ActionLink
        action={hero.scrollCue}
        variant="cue"
        revealDelay={560}
        className="absolute bottom-7 left-1/2 -translate-x-1/2 max-xl:hidden"
      />
    </section>
  );
}
