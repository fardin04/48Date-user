import { FaqList } from "@/components/pieces/cards/faq-list";
import { Section } from "@/components/pieces/layout/section";
import { SectionIntro } from "@/components/pieces/layout/section-intro";
import { getAnchors, getFaq } from "@/stores/landing-store";

const TITLE_ID = "faq-title";

/** 08 / FAQ / Before your first hello */
export function Faq() {
  const faq = getFaq();
  return (
    <Section id={getAnchors().faq} labelledBy={TITLE_ID}>
      <div className="grid gap-10 lg:grid-cols-[506fr_900fr] lg:items-start lg:gap-16 2xl:gap-32.5">
        <SectionIntro
          intro={faq.intro}
          titleId={TITLE_ID}
          titleVariant="display80"
          titleTone="strong"
          descriptionVariant="text18"
          spacing="faq"
          revealDelay={0}
        />
        <FaqList entries={faq.entries} defaultOpen={faq.defaultOpen} revealDelay={120} className="-my-3.5" />
      </div>
    </Section>
  );
}
