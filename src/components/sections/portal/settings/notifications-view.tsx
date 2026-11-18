"use client";

import { useEffect } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { ActionButton } from "@/components/pieces/actions/action-button";
import { ActionRow } from "@/components/pieces/actions/action-row";
import { ActionTarget } from "@/components/pieces/actions/action-target";
import { Button } from "@/components/ui/button";
import { CardHeading } from "@/components/pieces/content/card-heading";
import { FormHeader } from "@/components/pieces/forms/form-header";
import { Icon } from "@/components/pieces/content/icon";
import { PortalBack } from "@/components/pieces/actions/portal-back";
import { Text } from "@/components/pieces/content/text";
import { Avatar } from "@/components/pieces/media/avatar";
import { cn } from "@/lib/cn";
import { accountService, type NotificationItem } from "@/lib/portal/account-service";
import { formatStamp } from "@/lib/portal/date-format";
import { screenKeys } from "@/lib/screen-keys";
import { getAccountPage } from "@/stores/portal-store";
import { LoadFailed } from "@/components/sections/portal/shared/load-failed";
import { Workspace } from "@/components/sections/portal/shared/workspace";

/** W09 / NOTIFICATIONS: recent updates, each opening the screen it is about; opening the inbox marks them seen. */
export function NotificationsView() {
  const page = getAccountPage().notifications;
  const pages = useInfiniteQuery({
    queryKey: screenKeys.notifications,
    queryFn: ({ pageParam }) => accountService.getNotificationsPage(pageParam),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.next,
    refetchOnWindowFocus: true,
  });

  const items = pages.data?.pages.flatMap((p) => p.items);
  const unread = items?.some((item) => item.unread) ?? false;

  // Seen once shown: one request for the whole inbox.
  useEffect(() => {
    if (unread) void accountService.markNotificationsRead().catch(() => undefined);
  }, [unread]);

  const renderRow = (item: NotificationItem) => {
    const rowClass = cn(
      "focus-ring flex w-full items-start gap-3 rounded-16 border p-4 text-left transition-colors",
      item.to ? "hover:bg-weak cursor-pointer" : "",
      item.unread ? "border-rose bg-rose-light" : "border-soft-line bg-white"
    );

    const content = (
      <>
        {item.unread && <span className="sr-only">{page.unread}</span>}
        {item.avatar ? (
          <Avatar image={item.avatar} size={48} decorative />
        ) : (
          <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-rose-light">
            <Icon name="notification-02" size={24} tone="rose" />
          </span>
        )}
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <div className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-0.5">
            <CardHeading as="h2" size={14} title={item.title} className="min-w-0 flex-1" />
            {item.at !== null && (
              <Text as="span" variant="text12Medium" tone="sub" className="shrink-0">
                {formatStamp(item.at)}
              </Text>
            )}
          </div>
          <Text variant="text14Relaxed" tone="sub" className="break-anywhere">
            {item.description}
          </Text>
        </div>
      </>
    );

    if (item.to) {
      return (
        <ActionTarget to={item.to} className={rowClass}>
          {content}
        </ActionTarget>
      );
    }

    return <div className={rowClass}>{content}</div>;
  };

  return (
    <Workspace>
      <PortalBack action={page.back} />
      <FormHeader variant="portalStatus" title={page.title} description={page.description} />
      {pages.error && !items && <LoadFailed onRetry={() => void pages.refetch()} error={pages.error} />}
      {items?.length === 0 && (
        <Text variant="text16" tone="sub">
          {page.empty}
        </Text>
      )}
      <ul className="flex w-full flex-col gap-4">
        {items?.map((item) => (
          <li key={item.id} className="w-full">
            {renderRow(item)}
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
          {pages.isFetchingNextPage ? page.loadingMore : page.more}
        </Button>
      )}
      <ActionRow>
        <ActionButton action={page.primary} variant="confirm" size="portalPill" width="summaryAction" />
      </ActionRow>
    </Workspace>
  );
}
