import { FeatureCopy } from "@/components/pieces/cards/feature-copy";
import { MessageSuggestion } from "@/components/pieces/illustrations/message-suggestion";
import { Panel } from "@/components/pieces/layout/panel";
import { ProfilePreview } from "@/components/pieces/illustrations/profile-preview";
import { Section } from "@/components/pieces/layout/section";
import { SectionIntro } from "@/components/pieces/layout/section-intro";
import { Text } from "@/components/pieces/content/text";
import { VenueCard } from "@/components/pieces/illustrations/venue-card";
import { getAnchors, getFeatures } from "@/stores/landing-store";

const TITLE_ID = "features-title";

/** 03 / Features / Matching, conversation and planning */
export function Features() {
  const { intro, matching, conversation, planner } = getFeatures();
  return (
    <Section id={getAnchors().features} labelledBy={TITLE_ID} spacing="xl">
      <div className="grid gap-6 lg:grid-cols-[976fr_460fr] lg:items-end lg:gap-16 2xl:gap-25">
        <SectionIntro
          intro={intro}
          titleId={TITLE_ID}
          titleVariant="display64"
          spacing="split"
          omitDescription
          titleClassName="max-w-225"
          revealDelay={0}
        />
        <Text variant="text20" tone="muted" className="max-w-115" revealDelay={120}>
          {intro.description}
        </Text>
      </div>

      <Panel
        as="article"
        surface="mist"
        padding="lg"
        revealDelay={0}
        className="mt-12 grid gap-10 md:mt-16 lg:grid-cols-[468fr_878fr] lg:items-center xl:gap-17.5"
      >
        <FeatureCopy copy={matching.copy} />
        <ProfilePreview profile={matching.profile} revealDelay={120} />
      </Panel>

      <div className="grid gap-7 pt-7 lg:grid-cols-[792fr_716fr]">
        <Panel as="article" surface="roseLight" padding="md" revealDelay={0} className="flex flex-col">
          <FeatureCopy copy={conversation.copy} tone="neutral" />
          <MessageSuggestion suggestion={conversation.suggestion} className="mt-10.5" revealDelay={120} />
        </Panel>
        <Panel as="article" surface="night" revealDelay={120} className="flex flex-col">
          <div className="px-3 pt-3 md:px-6 md:pt-6">
            <VenueCard venue={planner.venue} />
          </div>
          <FeatureCopy copy={planner.copy} tone="dark" className="px-6 pt-10.5 pb-8 md:px-10 xl:px-12 xl:pb-12.5" />
        </Panel>
      </div>
    </Section>
  );
}
