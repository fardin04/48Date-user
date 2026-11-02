"use client";

import { cn } from "@/lib/cn";
import { fill } from "@/lib/format";
import { accountService } from "@/lib/portal/account-service";
import { screenKeys } from "@/lib/screen-keys";
import { textTones } from "@/lib/tones";
import { useLoaded } from "@/hooks/use-loaded";
import { useSession } from "@/hooks/use-session";
import { getMemberAvatar, getPortalShell } from "@/stores/portal-store";
import { ActionTarget } from "@/components/pieces/actions/action-target";
import { Avatar } from "@/components/pieces/media/avatar";
import { Icon } from "@/components/pieces/content/icon";

/** Header controls share a 44×44 hit area. */
const CONTROL = "focus-ring relative flex size-11 items-center justify-center rounded-full";

/**
 * The header's notifications bell (with an unread dot, read again when the tab regains focus) and
 * the member's own photo opening PROFILE.
 */
export function HeaderMenu() {
  const shell = getPortalShell();
  // The header shows before the session is confirmed; its reads wait for one.
  const enabled = useSession() === true;
  const unread = useLoaded(screenKeys.unreadCount, accountService.getUnreadCount, { refetchOnWindowFocus: true, enabled }).value ?? 0;
  const avatar = useLoaded(screenKeys.avatar, accountService.getAvatar, { enabled }).value ?? getMemberAvatar();
  return (
    <div className="flex w-24 shrink-0 justify-end gap-2">
      <ActionTarget
        to={shell.notifications.to}
        aria-label={unread > 0 ? fill(shell.unread, { count: unread }) : shell.notifications.label}
        className={cn(CONTROL, textTones.black)}
      >
        {shell.notifications.icon && <Icon name={shell.notifications.icon} size={24} />}
        {unread > 0 && <span aria-hidden="true" className="absolute top-2 right-2 size-2.5 rounded-full bg-rose" />}
      </ActionTarget>
      <ActionTarget to={shell.profile.to} aria-label={shell.profile.label} className={CONTROL}>
        <Avatar image={avatar} size={40} decorative />
      </ActionTarget>
    </div>
  );
}
