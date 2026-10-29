"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { PortalBack } from "@/components/pieces/actions/portal-back";
import { membershipService } from "@/lib/portal/membership-service";
import { hrefFor } from "@/lib/routes";
import { getMembershipPage } from "@/stores/portal-store";
import { MembershipContext } from "@/components/sections/portal/membership/membership-context";
import { StatusScreen } from "@/components/sections/portal/shared/status-screen";

/** W10 / PAY-RESTORE, then MEMBERSHIP when a purchase is found or PAY-RESTORE-NONE on the same URL. */
export function RestoreView() {
  const page = getMembershipPage().restore;
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [none, setNone] = useState(false);

  const check = async () => {
    if (busy) return;
    setBusy(true);
    const found = await membershipService.restore();
    setBusy(false);
    if (found) router.push(hrefFor("MEMBERSHIP"));
    else setNone(true);
  };

  const back = <PortalBack action={page.back} />;
  if (none) {
    const { none: copy } = page;
    return (
      <StatusScreen
        back={back}
        title={copy.title}
        description={copy.description}
        summary={copy.summary}
        primary={copy.primary}
        secondary={{ label: copy.secondary, onClick: () => setNone(false) }}
        aside={<MembershipContext />}
      />
    );
  }
  return (
    <StatusScreen
      back={back}
      title={page.title}
      description={page.description}
      summary={page.summary}
      primary={{ label: busy ? page.busy : page.primary, onClick: () => void check(), busy }}
      secondary={page.secondary}
      aside={<MembershipContext />}
    />
  );
}
