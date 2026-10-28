import Image from "next/image";
import { ActionLink } from "@/components/pieces/actions/action-link";
import { Reveal } from "@/components/pieces/layout/reveal";
import { Section } from "@/components/pieces/layout/section";
import { SectionIntro } from "@/components/pieces/layout/section-intro";
import { StoreBadges } from "@/components/pieces/actions/store-badges";
import { getAnchors, getDownload } from "@/stores/landing-store";

const TITLE_ID = "download-title";

/** Phone widths in the Figma gallery (276 / 300 / 276 px, 32px gaps) as shares of its 916px row. */
const phoneSlots = ["w-[30.13%]", "w-[32.75%]", "w-[30.13%]"];

/** 07 / Download / Native app preview */
export function Download() {
  const download = getDownload();
  return (
    <Section id={getAnchors().download} labelledBy={TITLE_ID} surface="roseLight">
      <SectionIntro
        intro={download.intro}
        titleId={TITLE_ID}
        titleVariant="display56"
        spacing="stack"
        tone="neutral"
        titleTone="ink"
        align="center"
        revealDelay={0}
      >
        <StoreBadges badges={download.badges} className="pt-6" />
        <ActionLink action={download.browser} variant="rose" className="pt-6" />
      </SectionIntro>
      <Reveal delay={120} className="mx-auto mt-6 flex max-w-229 items-center justify-between xl:h-170">
        {download.phones.map((phone, index) => (
          <Image
            key={phone.src}
            src={phone.src}
            alt={phone.alt}
            width={phone.width}
            height={phone.height}
            sizes="(min-width: 960px) 300px, 32vw"
            className={phoneSlots[index]}
          />
        ))}
      </Reveal>
    </Section>
  );
}
