import { Section } from "@/components/pieces/layout/section";
import { SectionIntro } from "@/components/pieces/layout/section-intro";
import { StepCard } from "@/components/pieces/cards/step-card";
import { getAnchors, getHowItWorks } from "@/stores/landing-store";

const TITLE_ID = "how-it-works-title";

/** 02 / How it works / Three steps */
export function HowItWorks() {
  const { intro, steps } = getHowItWorks();
  return (
    <Section id={getAnchors().howItWorks} labelledBy={TITLE_ID} surface="blush" spacing="xl">
      <SectionIntro
        intro={intro}
        titleId={TITLE_ID}
        titleVariant="display64"
        spacing="steps"
        align="center"
        titleClassName="max-w-225"
        descriptionClassName="max-w-162.5"
        revealDelay={0}
      />
      <div className="mx-auto grid max-w-140 gap-12 pt-12 md:pt-16 lg:max-w-none lg:grid-cols-3 lg:gap-7">
        {steps.map((step, index) => (
          <StepCard key={step.number} step={step} revealDelay={index * 120} />
        ))}
      </div>
    </Section>
  );
}
