import { CardHeading } from "@/components/pieces/content/card-heading";
import { DetailRow } from "@/components/pieces/cards/detail-row";
import { MemberRow } from "@/components/pieces/cards/member-row";
import { PortalCard } from "@/components/pieces/layout/portal-card";
import type { Fact } from "@/data/portal/types";
import type { DatePlan } from "@/lib/portal/date-service";
import { fill } from "@/lib/format";
import { formatDay, formatTime } from "@/lib/portal/date-format";
import { getDatePage } from "@/stores/portal-store";

/**
 * A plan's date details (requirement 7.4: the visual primary of every plan screen): the place as an
 * h2 with When / Timezone / Area / Meeting place, then the "Date with …" member row.
 */
export function DateSummary({ plan, status, extra = [] }: { plan: DatePlan; status: string; extra?: Fact[] }) {
  const copy = getDatePage();
  const member = plan.partner;
  const venue = plan.place;
  const when = plan.date && plan.time !== null ? `${formatDay(plan.date)} · ${formatTime(plan.time)}` : "";
  return (
    <>
      <PortalCard as="section" surface="outline" padding="md" radius={16} aria-label={copy.rows.where} className="flex w-full flex-col gap-2">
        <CardHeading as="h2" size={20} title={venue.name} description={venue.detailMeta || undefined} />
        <dl className="flex w-full flex-col">
          <DetailRow label={copy.rows.when} value={when} divided />
          <DetailRow label={copy.rows.timezone} value={plan.timezone} divided />
          {plan.area && <DetailRow label={copy.rows.area} value={plan.area.label} divided />}
          <DetailRow label={copy.rows.meeting} value={venue.meetingPlace} divided={extra.length > 0} />
          {extra.map((fact, index) => (
            <DetailRow key={fact.label} label={fact.label} value={fact.value} divided={index < extra.length - 1} />
          ))}
        </dl>
      </PortalCard>
      <MemberRow photo={member.photo} title={fill(copy.member.title, { name: member.name })} description={status} />
    </>
  );
}
