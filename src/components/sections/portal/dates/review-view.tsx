"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { ActionButton } from "@/components/pieces/actions/action-button";
import { ActionRow } from "@/components/pieces/actions/action-row";
import { FormHeader } from "@/components/pieces/forms/form-header";
import { PortalBack } from "@/components/pieces/actions/portal-back";
import { StatusBadge } from "@/components/pieces/feedback/status-badge";
import { Button } from "@/components/ui/button";
import { useServiceAction } from "@/hooks/use-service-action";
import { useLoaded } from "@/hooks/use-loaded";
import { screenKeys } from "@/lib/screen-keys";
import { StatusNote } from "@/components/pieces/feedback/status-note";
import type { MemberId } from "@/data/portal/types";
import { fill } from "@/lib/format";
import { dateService } from "@/lib/portal/date-service";
import { useDatePlan } from "@/hooks/use-date-plan";
import { hrefFor, toItem } from "@/lib/routes";
import { replaceRoute } from "@/lib/navigation/replace-route";
import { getDatePage, getMemberName } from "@/stores/portal-store";
import { DateContext } from "@/components/sections/portal/dates/date-context";
import { DateSummary } from "@/components/sections/portal/dates/date-summary";
import { Workspace } from "@/components/sections/portal/shared/workspace";

/** W06 / DATE-REVIEW: the plan as the match will see it; Send invitation opens DATE-PENDING. */
export function ReviewView({ memberId }: { memberId: MemberId }) {
  const copy = getDatePage();
  const router = useRouter();
  const { plan, setPlan } = useDatePlan(memberId);
  const { busy, failure, run } = useServiceAction(getDatePage().failed);
  const weather = useLoaded([...screenKeys.venues(memberId), "weather", plan?.date ?? ""], () => dateService.getWeather(memberId), { enabled: Boolean(plan?.date) }).value;
  // Nothing to review yet (direct visit): open the first missing step — the place, then the date and time.
  const missing = plan === null ? null : !plan.place.name ? "VENUES" : !plan.date || plan.time === null ? "DATE-TIME" : null;
  const incomplete = missing !== null;

  useEffect(() => {
    if (missing) replaceRoute(router, hrefFor(missing, memberId));
  }, [missing, memberId, router]);

  if (!plan || incomplete) return null;
  const name = getMemberName(memberId);
  const send = async () => {
    // Sent: replace, so Back from the plan can't reopen the sent review (rule 51); the service invalidated the date and match keys.
    if (await run(async () => setPlan(await dateService.sendInvitation(memberId)))) replaceRoute(router, hrefFor("DATE-PENDING", memberId));
  };

  return (
    <Workspace aside={<DateContext member={memberId} place={plan.place} />}>
      <PortalBack action={{ ...copy.back, to: toItem("DATE-TIME", memberId) }} />
      <FormHeader variant="portal" title={copy.review.title} description={fill(copy.review.description, { name })} badge={<StatusBadge variant="pending" label={copy.review.badge} live={false} />} />
      <DateSummary
        plan={plan}
        status={copy.review.badge}
        extra={weather ? [{ label: copy.weather.label, value: fill(copy.weather.value, { description: weather.description, min: weather.min, max: weather.max }) }] : []}
      />
      {failure && <StatusNote variant="alert" message={failure} />}
      <ActionRow>
        <Button type="button" variant="confirm" size="portalPill" width="actionSlot" disabled={busy} aria-busy={busy || undefined} onClick={() => void send()}>
          {busy ? copy.review.sending : copy.review.send}
        </Button>
        <ActionButton action={{ label: copy.review.edit, to: toItem("DATE-TIME", memberId) }} variant="roseOutline" size="portalPill" width="actionSlot" />
      </ActionRow>
    </Workspace>
  );
}
