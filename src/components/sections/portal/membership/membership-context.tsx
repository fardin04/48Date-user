import Image from "next/image";
import { ActionButton } from "@/components/pieces/actions/action-button";
import { FactList } from "@/components/pieces/cards/fact-list";
import { PortalCard } from "@/components/pieces/layout/portal-card";
import { Text } from "@/components/pieces/content/text";
import { getMembershipPage } from "@/stores/portal-store";

/** "Flow support / Membership": what Premium includes, with "Compare plans". */
export function MembershipContext() {
  const { context } = getMembershipPage();
  return (
    <PortalCard as="aside" surface="outline" padding="lg" revealDelay={80} aria-labelledby="membership-context-title" className="flex w-full flex-col gap-5">
      <div className="flex flex-col gap-2 border-b border-divider pb-2">
        <Text as="h2" id="membership-context-title" variant="text20SemiboldSnug" tone="strong">
          {context.title}
        </Text>
        <Text variant="text12Medium" tone="sub">
          {context.description}
        </Text>
      </div>
      <div className="relative h-50 w-full overflow-hidden rounded-12">
        <Image src={context.photo.src} alt={context.photo.alt} fill sizes="304px" className="object-cover" />
      </div>
      <FactList layout="divided" facts={context.facts} />
      <ActionButton action={context.action} variant="roseOutline" size="pillCompact" width="full" />
    </PortalCard>
  );
}
