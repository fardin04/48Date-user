"use client";

import { useInfiniteQuery, useQueryClient, type InfiniteData } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { FormHeader } from "@/components/pieces/forms/form-header";
import { LikeCard } from "@/components/pieces/cards/like-card";
import { PortalBack } from "@/components/pieces/actions/portal-back";
import { StatusNote } from "@/components/pieces/feedback/status-note";
import { Button } from "@/components/ui/button";
import type { Decision } from "@/data/portal/discover";
import type { LikesPage, MemberId } from "@/data/portal/types";
import { layout } from "@/lib/control-sizes";
import { fill } from "@/lib/format";
import { likesIntent } from "@/lib/portal/deck-intent";
import { failureReason } from "@/lib/portal/failure";
import { isGoneLike, likeDistance, nextLikesPage, withoutLike } from "@/lib/portal/likes";
import { portalService } from "@/lib/portal/portal-service";
import { toItem } from "@/lib/routes";
import { screenKeys } from "@/lib/screen-keys";
import { usePrimaryInView } from "@/hooks/use-primary-in-view";
import { getLikesPage, getPortalShell } from "@/stores/portal-store";
import { LoadFailed } from "@/components/sections/portal/shared/load-failed";
import { StatusScreen } from "@/components/sections/portal/shared/status-screen";
import { Workspace } from "@/components/sections/portal/shared/workspace";
import { MatchNewScreen } from "@/components/sections/portal/discover/match-new-screen";

/** Column width of a card, for the photo's `sizes` (16rem tracks; one column on phones). */
const CARD_SIZES = "(min-width: 640px) 320px, calc(100vw - 32px)";

/**
 * LIKES (`/likes`): who liked the member, from `GET /discovery/likes-received`, a page at a time
 * ("Show more"). Like back makes the mutual match (MATCH-NEW, "Keep browsing"); Pass removes the
 * card for good. Paywall mode shows the API's blurred, masked cards with an upgrade action.
 */
export function LikesView() {
  const copy = getLikesPage();
  const shell = getPortalShell();
  const client = useQueryClient();
  // Pages stay in the TanStack cache, so Back from a profile returns to the same loaded list (rule 53).
  const query = useInfiniteQuery({
    queryKey: screenKeys.likesReceived,
    queryFn: ({ pageParam }) => portalService.getLikesReceived(pageParam),
    initialPageParam: 1,
    getNextPageParam: nextLikesPage,
  });
  const [busy, setBusy] = useState<MemberId | null>(null);
  const [matched, setMatched] = useState<MemberId | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [announcement, setAnnouncement] = useState("");

  const remove = (member: MemberId) =>
    client.setQueryData<InfiniteData<LikesPage, number>>(screenKeys.likesReceived, (data) => withoutLike(data, member));

  const decide = async (member: MemberId, decision: Decision) => {
    setBusy(member);
    setNotice(null);
    try {
      if (decision === "pass") {
        await portalService.passLike(member);
        remove(member);
        setAnnouncement(fill(copy.passed, { name: member }));
      } else {
        const { matched: mutual } = await portalService.matchLike(member);
        remove(member);
        if (mutual) setMatched(member);
      }
    } catch (error) {
      // Already matched or no longer available: the card goes. A limit or an outage keeps it.
      if (isGoneLike(error)) remove(member);
      setNotice(failureReason(error) ?? copy.failed);
    } finally {
      setBusy(null);
    }
  };

  // A decision made on a profile opened from here is sent once the list is read.
  const ready = query.data !== undefined;
  const intentTaken = useRef(false);
  useEffect(() => {
    if (!ready || intentTaken.current) return;
    intentTaken.current = true;
    const intent = likesIntent.take();
    if (intent) void Promise.resolve().then(() => decide(intent.member, intent.decision));
    // `decide` reads only setters, the cache client and copy; the intent is taken once per visit.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  // The match screen has been shown: it isn't offered again as a background match on Discover.
  useEffect(() => {
    if (matched) void portalService.markMatchSeen(matched);
  }, [matched]);

  // At high zoom the cards lead, ahead of the heading (rule 49).
  const grid = useRef<HTMLUListElement>(null);
  const firstCard = useRef<HTMLLIElement>(null);
  const items = query.data?.pages.flatMap((page) => page.items) ?? [];
  usePrimaryInView(grid, firstCard, items.length > 0 && !matched);

  if (matched) return <MatchNewScreen member={matched} keepLabel={copy.keepBrowsing} onKeepDiscovering={() => setMatched(null)} />;
  if (!query.data) return query.error ? <LoadFailed onRetry={() => void query.refetch()} error={query.error} /> : null;

  const back = <PortalBack action={shell.back} />;
  if (items.length === 0) return <StatusScreen back={back} title={copy.title} description={copy.description} summary={copy.empty.summary} primary={copy.empty.primary} />;

  return (
    <Workspace>
      {back}
      <FormHeader variant="portalPage" title={copy.title} description={copy.description} revealDelay={0} />
      {notice && <StatusNote variant="alert" message={notice} />}
      <ul ref={grid} aria-label={copy.listLabel} className={layout.likesGrid}>
        {items.map((like, index) => (
          <li key={like.id} ref={index === 0 ? firstCard : undefined} className="flex min-w-0">
            <LikeCard
              like={like}
              title={like.locked ? copy.locked.name : like.age === null ? like.name : fill(copy.nameAge, { name: like.name, age: like.age })}
              distance={likeDistance(like.distanceKm)}
              labels={{
                verified: copy.verified,
                superLike: copy.superLike,
                pass: fill(copy.pass, { name: like.name }),
                like: fill(copy.like, { name: like.name }),
                view: fill(copy.view, { name: like.name }),
              }}
              to={toItem("DISCOVER-PROFILE", like.id)}
              onPass={() => void decide(like.id, "pass")}
              onLike={() => void decide(like.id, "like")}
              busy={busy === like.id}
              locked={like.locked ? copy.locked : undefined}
              sizes={CARD_SIZES}
              revealDelay={Math.min(index, 8) * 40}
              className="w-full"
            />
          </li>
        ))}
      </ul>
      {query.hasNextPage && (
        <Button
          type="button"
          variant="roseOutline"
          size="pillCompact"
          width="portalAction"
          disabled={query.isFetchingNextPage}
          aria-busy={query.isFetchingNextPage || undefined}
          onClick={() => void query.fetchNextPage()}
        >
          {query.isFetchingNextPage ? copy.loadingMore : copy.more}
        </Button>
      )}
      <p role="status" className="sr-only">
        {announcement}
      </p>
    </Workspace>
  );
}
