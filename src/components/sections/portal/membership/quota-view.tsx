"use client";

import { PortalBack } from "@/components/pieces/actions/portal-back";
import { membershipService } from "@/lib/portal/membership-service";
import { useLoaded } from "@/hooks/use-loaded";
import { to, toItem } from "@/lib/routes";
import { getMembershipPage } from "@/stores/portal-store";
import { MembershipContext } from "@/components/sections/portal/membership/membership-context";
import { StatusScreen } from "@/components/sections/portal/shared/status-screen";
import { screenKeys } from "@/lib/screen-keys";

/** W10 / QUOTA: the free plan's new conversations are used for this period; current ones stay open. */
export function QuotaView() {
  const page = getMembershipPage().quota;
  const current = useLoaded(screenKeys.membership, membershipService.getMembership).value?.lastConversation;
  return (
    <StatusScreen
      back={<PortalBack action={page.back} />}
      title={page.title}
      description={page.description}
      summary={page.summary}
      primary={page.primary}
      secondary={{ label: page.secondary, to: current ? toItem("CHAT-01", current) : to("INBOX") }}
      aside={<MembershipContext />}
    />
  );
}
