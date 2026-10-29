import Image from "next/image";
import { ActionButton } from "@/components/pieces/actions/action-button";
import { FactList } from "@/components/pieces/cards/fact-list";
import { PortalCard } from "@/components/pieces/layout/portal-card";
import { Text } from "@/components/pieces/content/text";
import type { MemberId } from "@/data/portal/types";
import { fill } from "@/lib/format";
import { forMember } from "@/lib/portal/member-link";
import { getGamePage, getMember } from "@/stores/portal-store";

/** "48Date / Web / Flow context" (Flow=Game): who you're playing with, the game and the round. */
export function GameContext({ member, round }: { member: MemberId; round: number }) {
  const copy = getGamePage();
  const { context } = copy;
  return (
    <PortalCard as="aside" surface="outline" padding="lg" revealDelay={80} aria-labelledby="game-context-title" className="flex w-full flex-col gap-5">
      <div className="flex flex-col gap-2 border-b border-divider pb-2">
        <Text as="h2" id="game-context-title" variant="text20SemiboldSnug" tone="strong">
          {context.title}
        </Text>
        <Text variant="text12Medium" tone="sub">
          {context.description}
        </Text>
      </div>
      <div className="relative h-34 w-full overflow-hidden rounded-12">
        <Image src={context.art.src} alt={context.art.alt} fill sizes="304px" className="object-cover" />
      </div>
      <FactList
        layout="divided"
        facts={[
          { label: context.playing, value: getMember(member).name },
          { label: context.game, value: copy.name },
          { label: context.round, value: fill(context.roundValue, { round, total: copy.questions.length }) },
        ]}
      />
      <ActionButton action={forMember(context.chat, member)} variant="roseOutline" size="pillCompact" width="full" />
    </PortalCard>
  );
}
