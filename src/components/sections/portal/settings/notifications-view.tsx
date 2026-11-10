"use client";

import { useEffect } from "react";
import { ActionButton } from "@/components/pieces/actions/action-button";
import { ActionRow } from "@/components/pieces/actions/action-row";
import { ActionTarget } from "@/components/pieces/actions/action-target";
import { CardHeading } from "@/components/pieces/content/card-heading";
import { FormHeader } from "@/components/pieces/forms/form-header";
import { PortalBack } from "@/components/pieces/actions/portal-back";
import { Text } from "@/components/pieces/content/text";
import { cn } from "@/lib/cn";
import { accountService } from "@/lib/portal/account-service";
import { formatStamp } from "@/lib/portal/date-format";
import { screenKeys } from "@/lib/screen-keys";
import { useLoaded } from "@/hooks/use-loaded";
import { getAccountPage } from "@/stores/portal-store";
import { LoadFailed } from "@/components/sections/portal/shared/load-failed";
import { Workspace } from "@/components/sections/portal/shared/workspace";

/** W09 / NOTIFICATIONS: recent updates, each opening the screen it is about; opening the inbox marks them seen. */
export function NotificationsView() {
  const page = getAccountPage().notifications;
  const { value: items, error, reload } = useLoaded(screenKeys.notifications, accountService.getNotifications, { refetchOnWindowFocus: true });
  const unread = items?.some((item) => item.unread) ?? false;

  // Seen once shown: one request for the whole inbox.
  useEffect(() => {
    if (unread) void accountService.markNotificationsRead().catch(() => undefined);
  }, [unread]);

  return (
    <Workspace>
      <PortalBack action={page.back} />
      <FormHeader variant="portalStatus" title={page.title} description={page.description} />
      {error && !items && <LoadFailed onRetry={() => void reload()} error={error} />}
      {items?.length === 0 && (
        <Text variant="text16" tone="sub">
          {page.empty}
        </Text>
      )}
      <ul className="flex w-full flex-col gap-5">
        {items?.map((item) => (
          <li key={item.id}>
            <ActionTarget
              to={item.to}
              className={cn("focus-ring flex w-full items-start gap-3 rounded-16 border p-4 text-left transition-colors hover:bg-weak", item.unread ? "border-rose bg-rose-light" : "border-soft-line bg-white")}
            >
              {item.unread && <span className="sr-only">{page.unread}</span>}
              <CardHeading as="h2" size={14} title={item.title} description={item.description} className="min-h-16 min-w-0 flex-1 justify-center" />
              {item.at !== null && (
                <Text as="span" variant="text12Medium" tone="sub" className="shrink-0">
                  {formatStamp(item.at)}
                </Text>
              )}
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
