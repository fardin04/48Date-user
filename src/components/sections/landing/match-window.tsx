import { Countdown } from "@/components/pieces/feedback/countdown";
import { Reveal } from "@/components/pieces/layout/reveal";
import { Section } from "@/components/pieces/layout/section";
import { SectionIntro } from "@/components/pieces/layout/section-intro";
import { Text } from "@/components/pieces/content/text";
import { getMatchWindow } from "@/stores/landing-store";

const TITLE_ID = "match-window-title";

/** 04 / Match window / 48 hours */
export function MatchWindow() {
  const matchWindow = getMatchWindow();
  return (
    <Section labelledBy={TITLE_ID} surface="rose">
      <div className="flex flex-col items-start gap-10 lg:flex-row lg:flex-wrap lg:items-center xl:flex-nowrap xl:justify-center xl:gap-16">
        <Reveal as="p" delay={0} className="flex flex-col items-center p-2.5 text-center">
          <Text as="span" variant="display240" tone="white" className="-mb-5">
            {matchWindow.hours.value}
          </Text>
          <Text as="span" variant="text13Bold" tone="white">
            {matchWindow.hours.caption}
          </Text>
        </Reveal>
        <SectionIntro
          intro={matchWindow}
          titleId={TITLE_ID}
          titleVariant="display56"
          descriptionVariant="text18"
          spacing="window"
          tone="dark"
          descriptionClassName="max-w-162.5"
          className="min-w-0 flex-1"
          revealDelay={120}
        />
        <Countdown countdown={matchWindow.countdown} revealDelay={240} />
      </div>
    </Section>
  );
}
