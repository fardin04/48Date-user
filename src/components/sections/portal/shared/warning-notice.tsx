"use client";

import { ActionLink } from "@/components/pieces/actions/action-link";
import { PortalDialog } from "@/components/pieces/overlays/portal-dialog";
import { StatusNote } from "@/components/pieces/feedback/status-note";
import { Button } from "@/components/ui/button";
import { accountService } from "@/lib/portal/account-service";
import { screenKeys } from "@/lib/screen-keys";
import { useLoaded } from "@/hooks/use-loaded";
import { useServiceAction } from "@/hooks/use-service-action";
import { getAccountPage, getWarningCopy } from "@/stores/portal-store";

/**
 * A moderation warning the member must acknowledge before continuing (D-153): shown over any
 * portal page until "I understand" is confirmed, one warning at a time.
 */
export function WarningNotice() {
  const copy = getWarningCopy();
  const { value: warnings, reload } = useLoaded(screenKeys.warnings, accountService.getWarnings);
  const { busy, failure, run } = useServiceAction(getAccountPage().profile.loadFailed);
  const current = warnings?.[0];
  if (!current) return null;

  const acknowledge = () =>
    run(async () => {
      await accountService.acknowledgeWarning(current.id);
      await reload();
    });

  return (
    <PortalDialog
      open
      // Closing isn't enough: the warning stays until it is acknowledged.
      onOpenChange={() => undefined}
      header="fit"
      title={copy.title}
      description={current.category}
      closeLabel={copy.close}
      actions={
        <Button type="button" variant="confirm" size="portalPill" width="full" disabled={busy} aria-busy={busy || undefined} onClick={() => void acknowledge()}>
          {busy ? copy.acknowledging : copy.acknowledge}
        </Button>
      }
    >
      <StatusNote variant="alert" message={current.message} />
      {failure && <StatusNote variant="alert" message={failure} />}
      <ActionLink action={copy.guidelines} variant="rose" />
    </PortalDialog>
  );
}
