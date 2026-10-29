import { ActionButton } from "@/components/pieces/actions/action-button";
import { ActionRow } from "@/components/pieces/actions/action-row";
import { FormHeader } from "@/components/pieces/forms/form-header";
import { PortalBack } from "@/components/pieces/actions/portal-back";
import { SettingsRow } from "@/components/pieces/cards/settings-row";
import { StatusNote } from "@/components/pieces/feedback/status-note";
import { getAccountPage } from "@/stores/portal-store";
import { ProfileContext } from "@/components/sections/portal/profile/profile-context";
import { Workspace } from "@/components/sections/portal/shared/workspace";

/** W09 / PRIVACY: what stays private, and where to block, report or check verification. */
export function PrivacyView() {
  const { privacy: page, settings } = getAccountPage();
  return (
    <Workspace aside={<ProfileContext />}>
      <PortalBack action={page.back} />
      <FormHeader variant="portalStatus" title={page.title} description={page.description} />
      <StatusNote variant="highlight" message={page.note} />
      <ul className="flex w-full flex-col">
        {page.links.map((link) => (
          <li key={link.label}>
            <SettingsRow label={link.label} value={settings.open} pill="open" to={link.to} />
          </li>
        ))}
      </ul>
      <ActionRow>
        <ActionButton action={page.primary} variant="confirm" size="portalPill" width="actionSlot" />
      </ActionRow>
    </Workspace>
  );
}
