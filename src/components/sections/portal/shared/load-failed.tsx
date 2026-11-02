import { failureReason } from "@/lib/portal/failure";
import { StatusNote } from "@/components/pieces/feedback/status-note";
import { Button } from "@/components/ui/button";
import { getAccountPage } from "@/stores/portal-store";

/**
 * A view's data couldn't be read: the reason, announced, and a retry that reads it again. An API
 * failure shows the service's own message ("Location is required to access discovery.").
 */
export function LoadFailed({ onRetry, error }: { onRetry: () => void; error?: unknown }) {
  const { loadFailed, retry } = getAccountPage().profile;
  return (
    <div className="flex w-full flex-col items-start gap-4">
      <StatusNote variant="alert" message={failureReason(error) ?? loadFailed} />
      <Button type="button" variant="roseOutline" size="portalPill" width="actionSlot" onClick={onRetry}>
        {retry}
      </Button>
    </div>
  );
}
