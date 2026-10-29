import { ActionButton } from "@/components/pieces/actions/action-button";
import { ActionRow } from "@/components/pieces/actions/action-row";
import { ActionTarget } from "@/components/pieces/actions/action-target";
import { CardHeading } from "@/components/pieces/content/card-heading";
import { FormHeader } from "@/components/pieces/forms/form-header";
import { PortalBack } from "@/components/pieces/actions/portal-back";
import { getAccountPage } from "@/stores/portal-store";
import { Workspace } from "@/components/sections/portal/shared/workspace";

/** W09 / NOTIFICATIONS: recent updates (sample content), each opening the screen it is about. */
export function NotificationsView() {
  const page = getAccountPage().notifications;
  return (
    <Workspace>
      <PortalBack action={page.back} />
      <FormHeader variant="portalStatus" title={page.title} description={page.description} />
      <ul className="flex w-full flex-col gap-5">
        {page.items.map((item) => (
          <li key={item.title}>
            <ActionTarget to={item.to} className="focus-ring flex w-full rounded-16 border border-soft-line bg-white p-4 text-left transition-colors hover:bg-weak">
              <CardHeading as="h2" size={14} title={item.title} description={item.description} className="min-h-16 justify-center" />
            </ActionTarget>
          </li>
        ))}
      </ul>
      <ActionRow>
        <ActionButton action={page.primary} variant="confirm" size="portalPill" width="summaryAction" />
      </ActionRow>
    </Workspace>
  );
}
