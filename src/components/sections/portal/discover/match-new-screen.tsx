"use client";

import { PortalBack } from "@/components/pieces/actions/portal-back";
import { StatusArtwork } from "@/components/pieces/feedback/status-artwork";
import type { MemberId } from "@/data/portal/types";
import { fill } from "@/lib/format";
import { toItem } from "@/lib/routes";
import { useMatchClock } from "@/hooks/use-match-clock";
import { useMember } from "@/hooks/use-member";
import { getDiscoverPage, getMemberName, getPortalShell } from "@/stores/portal-store";
import { StatusScreen } from "@/components/sections/portal/shared/status-screen";

/**
 * W04 / MATCH-NEW on /discover: the match the swipe made, or one made in the background. The timer
 * counts down to the match's server-owned deadline (rule 3); the drawn "48:00:00" shows only until
 * the match is read.
 */
export function MatchNewScreen({ member, onKeepDiscovering, keepLabel }: { member: MemberId; onKeepDiscovering: () => void; /** LIKES: "Keep browsing". */ keepLabel?: string }) {
  const copy = getDiscoverPage().matchNew;
  const matched = useMember(member);
  const clock = useMatchClock(member);
  const name = matched?.name ?? getMemberName(member);
  const live = clock.status === "open" ? { hours: clock.left.paddedHours, minutes: clock.left.minutes } : null;
  return (
    <StatusScreen
      back={<PortalBack action={getPortalShell().back} onClick={onKeepDiscovering} />}
      title={copy.title}
      description={fill(copy.description, { name })}
      primary={{ label: copy.primary, to: toItem("CHAT-01", member) }}
      secondary={{ label: keepLabel ?? copy.secondary, onClick: onKeepDiscovering }}
    >
      <StatusArtwork
        icon={copy.icon}
        timer={live ? fill(copy.timerLive, live) : copy.timer}
        timerLabel={live ? fill(copy.timerLiveLabel, live) : copy.timerLabel}
        photo={matched?.photo}
      />
    </StatusScreen>
  );
}
