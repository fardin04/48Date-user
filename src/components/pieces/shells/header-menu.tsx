"use client";

import { liveData } from "@/lib/portal/live";
import { cn } from "@/lib/cn";
import { fill } from "@/lib/format";
import { accountService } from "@/lib/portal/account-service";
import { screenKeys } from "@/lib/screen-keys";
import { textTones } from "@/lib/tones";
import { useLoaded } from "@/hooks/use-loaded";
import { useSession } from "@/hooks/use-session";
import { getLikesPage, getMemberAvatar, getMemberCopy, getPortalShell } from "@/stores/portal-store";
import { ActionTarget } from "@/components/pieces/actions/action-target";
import { Avatar } from "@/components/pieces/media/avatar";
import { Icon } from "@/components/pieces/content/icon";

/** Header controls share a 44×44 hit area. */
const CONTROL = "focus-ring relative flex size-11 items-center justify-center rounded-full";

/**
 * The header's Likes received heart (LIKES), the notifications bell (with an unread dot, read again
 * when the tab regains focus) and the member's own photo opening PROFILE, in that order at every width.
 */
export function HeaderMenu() {
  const shell = getPortalShell();
  const likes = getLikesPage().heart;
  // The header shows before the session is confirmed; its reads wait for one.
  const enabled = useSession() === true;
  const unread = useLoaded(screenKeys.unreadCount, accountService.getUnreadCount, { refetchOnWindowFocus: true, enabled }).value ?? 0;
  const avatar = useLoaded(screenKeys.avatar, accountService.getAvatar, { enabled }).value ?? (liveData ? getMemberCopy().placeholder : getMemberAvatar());
  return (
    // Intrinsic width: a third 44px control (Likes received) fits at 360px.
    <div className="flex shrink-0 items-center justify-end gap-2">
      <ActionTarget to={likes.to} aria-label={likes.label} className={cn(CONTROL, textTones.black)}>
        {likes.icon && <Icon name={likes.icon} size={24} />}
      </ActionTarget>
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
