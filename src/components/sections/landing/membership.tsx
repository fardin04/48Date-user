import { ActionButton } from "@/components/pieces/actions/action-button";
import { Chip } from "@/components/pieces/content/chip";
import { IconRow } from "@/components/pieces/cards/icon-row";
import { Logo } from "@/components/pieces/brand/logo";
import { Panel } from "@/components/pieces/layout/panel";
import { Section } from "@/components/pieces/layout/section";
import { SectionIntro } from "@/components/pieces/layout/section-intro";
import { Text } from "@/components/pieces/content/text";
import { getAnchors, getMembership } from "@/stores/landing-store";

const TITLE_ID = "membership-title";

/** 06 / Membership / Premium benefits */
export function Membership() {
  const { intro, cta, card } = getMembership();
  return (
    <Section id={getAnchors().membership} labelledBy={TITLE_ID} surface="mist">
      <div className="grid gap-12 lg:grid-cols-[593fr_803fr] lg:items-center lg:gap-16 2xl:gap-35">
        <SectionIntro
          intro={intro}
          titleId={TITLE_ID}
          titleVariant="display64"
          spacing="aside"
          descriptionClassName="max-w-140"
          revealDelay={0}
        >
          <div className="pt-9.5">
            <ActionButton action={cta} variant="primary" size="lg" />
          </div>
        </SectionIntro>
        <Panel as="article" surface="premium" padding="md" revealDelay={120}>
          <div className="flex items-center justify-between">
            <Logo />
            <Chip variant="badge">{card.badge}</Chip>
          </div>
          <Text as="h3" variant="heading36" className="max-w-150 pt-8.5">
            {card.title}
          </Text>
          <ul className="flex flex-col gap-3 pt-8.5">
            {card.benefits.map((benefit, index) => (
              <IconRow key={benefit.title} as="li" item={benefit} variant="card" revealDelay={200 + index * 80} />
            ))}
          </ul>
          <Text variant="text12" tone="muted" className="pt-5.5">
            {card.note}
          </Text>
        </Panel>
      </div>
    </Section>
  );
}
