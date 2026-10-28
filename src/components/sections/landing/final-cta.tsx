import { ActionButton } from "@/components/pieces/actions/action-button";
import { Logo } from "@/components/pieces/brand/logo";
import { Section } from "@/components/pieces/layout/section";
import { SectionIntro } from "@/components/pieces/layout/section-intro";
import { getFinalCta } from "@/stores/landing-store";

const TITLE_ID = "final-cta-title";

/** 09 / Final invitation / Create your profile */
export function FinalCta() {
  const { intro, cta } = getFinalCta();
  return (
    <Section labelledBy={TITLE_ID} surface="night" className="isolate overflow-hidden">
      <span
        aria-hidden="true"
        className="cta-glow absolute top-[-52%] left-[-26.4%] -z-10 h-[178.9%] w-[175.9%]"
      />
      <div className="flex items-center justify-between gap-10">
        <SectionIntro
          intro={intro}
          titleId={TITLE_ID}
          titleVariant="display80"
          descriptionVariant="text18"
          spacing="closing"
          tone="dark"
          className="max-w-250"
          revealDelay={0}
        >
          <div className="pt-8.5">
            <ActionButton action={cta} variant="primary" size="lg" />
          </div>
        </SectionIntro>
        <Logo size="lg" tone="light" revealDelay={160} className="max-lg:hidden" />
      </div>
    </Section>
  );
}
