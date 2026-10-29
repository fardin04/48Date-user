import { DetailRow } from "@/components/pieces/cards/detail-row";
import { MemberRow } from "@/components/pieces/cards/member-row";
import type { DatePlan } from "@/lib/portal/date-service";
import { fill } from "@/lib/format";
import { formatDay, formatTime } from "@/lib/portal/date-format";
import { getDatePage, getMember, getVenue } from "@/stores/portal-store";

/** "Member / Date with …" row and the Where / When / Timezone / Meeting place facts of a plan. */
export function DateSummary({ plan, status }: { plan: DatePlan; status: string }) {
  const copy = getDatePage();
  const member = getMember(plan.member);
  const venue = getVenue(plan.venue);
  const when = plan.date && plan.time !== null ? `${formatDay(plan.date)} · ${formatTime(plan.time)}` : "";
  return (
    <>
      <MemberRow photo={member.photo} title={fill(copy.member.title, { name: member.name })} description={status} />
      <dl className="flex w-full flex-col">
        <DetailRow label={copy.rows.where} value={venue.name} divided />
        <DetailRow label={copy.rows.when} value={when} divided />
        <DetailRow label={copy.rows.timezone} value={plan.timezone} divided />
        <DetailRow label={copy.rows.meeting} value={venue.meetingPlace} divided />
      </dl>
    </>
  );
}
