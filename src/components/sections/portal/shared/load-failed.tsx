import { StatusNote } from "@/components/pieces/feedback/status-note";
import { Button } from "@/components/ui/button";
import { getAccountPage } from "@/stores/portal-store";

/** A view's data couldn't be read: the reason, announced, and a retry that reads it again. */
export function LoadFailed({ onRetry }: { onRetry: () => void }) {
  const { loadFailed, retry } = getAccountPage().profile;
  return (
    <div className="flex w-full flex-col items-start gap-4">
      <StatusNote variant="alert" message={loadFailed} />
      <Button type="button" variant="roseOutline" size="portalPill" width="actionSlot" onClick={onRetry}>
        {retry}
      </Button>
    </div>
  );
}
