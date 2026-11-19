"use client";

import { useState } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { ActionRow } from "@/components/pieces/actions/action-row";
import { FormHeader } from "@/components/pieces/forms/form-header";
import { PortalBack } from "@/components/pieces/actions/portal-back";
import { PortalDialog } from "@/components/pieces/overlays/portal-dialog";
import { SettingsRow } from "@/components/pieces/cards/settings-row";
import { Button } from "@/components/ui/button";
import type { MemberId } from "@/data/portal/types";
import { fill } from "@/lib/format";
import { layout } from "@/lib/control-sizes";
import { chatService } from "@/lib/portal/chat-service";
import { getAccountPage, getMemberName } from "@/stores/portal-store";
import { ProfileContext } from "@/components/sections/portal/profile/profile-context";
import { StatusScreen } from "@/components/sections/portal/shared/status-screen";
import { Workspace } from "@/components/sections/portal/shared/workspace";
import { LoadFailed } from "@/components/sections/portal/shared/load-failed";
import { screenKeys } from "@/lib/screen-keys";
import { isBlockedEmpty, mergeBlockedPages } from "@/lib/portal/blocked-list";

/**
 * W09 / BLOCKED with cursor pagination, UNBLOCK dialog, or BLOCKED-EMPTY once nobody is blocked.
 */
export function BlockedView() {
  const page = getAccountPage().blocked;
  const [unblocking, setUnblocking] = useState<MemberId | null>(null);
  const [busy, setBusy] = useState(false);

  const pages = useInfiniteQuery({
    queryKey: screenKeys.blocked,
    queryFn: ({ pageParam }) => chatService.getBlockedPage(pageParam),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.next,
    refetchOnWindowFocus: true,
  });

  const back = <PortalBack action={page.back} />;

  if (pages.isLoading && !pages.data) {
    return null;
  }

  if (pages.error && !pages.data) {
    return (
      <Workspace aside={<ProfileContext />}>
        {back}
        <FormHeader variant="portal" title={page.title} description={page.description} />
        <LoadFailed onRetry={() => void pages.refetch()} error={pages.error} />
      </Workspace>
    );
  }

  const items = mergeBlockedPages(pages.data?.pages);

  if (isBlockedEmpty(items)) {
    const { empty } = page;
    return (
      <StatusScreen
        back={back}
        title={empty.title}
        description={empty.description}
        summary={empty.summary}
        primary={empty.primary}
        aside={<ProfileContext />}
        actionWidth="actionSlot"
      />
    );
  }

  const unblock = async () => {
    if (!unblocking || busy) return;
    setBusy(true);
    try {
      await chatService.unblock(unblocking);
      setUnblocking(null);
      await pages.refetch();
    } finally {
      setBusy(false);
    }
  };

  const name = unblocking ? getMemberName(unblocking) : "";

  return (
    <Workspace aside={<ProfileContext />}>
      {back}
      <FormHeader variant="portal" title={page.title} description={page.description} />
      <ul className="flex w-full flex-col">
        {items.map((member) => (
          <li key={member}>
            <SettingsRow
              label={getMemberName(member)}
              value={page.status}
              pill="blocked"
              onClick={() => setUnblocking(member)}
            />
          </li>
        ))}
      </ul>
      {pages.hasNextPage && (
        <Button
          type="button"
          variant="roseOutline"
          size="portalPill"
          width="actionSlot"
          disabled={pages.isFetchingNextPage}
          aria-busy={pages.isFetchingNextPage || undefined}
          onClick={() => void pages.fetchNextPage()}
        >
          {pages.isFetchingNextPage ? "Loading more…" : "Show more"}
        </Button>
      )}
      <ActionRow className={layout.stickyActions}>
        {items.map((member) => (
          <Button
            key={member}
            type="button"
            variant="confirm"
            size="portalPill"
            width="actionSlot"
            aria-haspopup="dialog"
            onClick={() => setUnblocking(member)}
          >
            {fill(page.unblock, { name: getMemberName(member) })}
          </Button>
        ))}
      </ActionRow>
      <PortalDialog
        open={unblocking !== null}
        onOpenChange={(open) => !open && !busy && setUnblocking(null)}
        title={fill(page.dialog.title, { name })}
        description={page.dialog.description}
        closeLabel={page.dialog.close}
        header="fit"
        actions={
          <>
            <Button
              type="button"
              variant="confirm"
              size="portalPill"
              width="full"
              disabled={busy}
              aria-busy={busy || undefined}
              onClick={() => void unblock()}
            >
              {busy ? page.dialog.busy : page.dialog.confirm}
            </Button>
            <Button
              type="button"
              variant="roseOutline"
              size="portalPill"
              width="full"
              disabled={busy}
              onClick={() => setUnblocking(null)}
            >
              {page.dialog.keep}
            </Button>
          </>
        }
      />
    </Workspace>
  );
}
