"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type PointerEvent } from "react";
import { ActionButton } from "@/components/pieces/actions/action-button";
import { FormHeader } from "@/components/pieces/forms/form-header";
import { PortalBack } from "@/components/pieces/actions/portal-back";
import { StatusArtwork } from "@/components/pieces/feedback/status-artwork";
import { StatusNote } from "@/components/pieces/feedback/status-note";
import { SwipeCard } from "@/components/pieces/cards/swipe-card";
import { Text } from "@/components/pieces/content/text";
import { Button } from "@/components/ui/button";
import type { Decision } from "@/data/portal/discover";
import type { MemberId } from "@/data/portal/types";
import { fill } from "@/lib/format";
import { toItem } from "@/lib/routes";
import { deckIntent } from "@/lib/portal/deck-intent";
import { failureReason } from "@/lib/portal/failure";
import { portalService, type DeckStatus } from "@/lib/portal/portal-service";
import { preferenceFacts } from "@/lib/portal/preference-facts";
import { useMemberLocation } from "@/hooks/use-member-location";
import { getDiscoverPage, getMemberName, getPortalShell } from "@/stores/portal-store";
import { useLoaded } from "@/hooks/use-loaded";
import { useMember } from "@/hooks/use-member";
import { screenKeys } from "@/lib/screen-keys";
import { LoadFailed } from "@/components/sections/portal/shared/load-failed";
import { DiscoverSidebar } from "@/components/sections/portal/discover/discover-sidebar";
import { ProfileOverview } from "@/components/sections/portal/discover/profile-overview";
import { StatusScreen } from "@/components/sections/portal/shared/status-screen";

/** A drag further than this (px) decides: left passes, right likes. */
const SWIPE_PX = 96;

type Drag = { pointer: number; startX: number; offset: number };

async function loadDiscovery() {
  const [deck, preferences, activeMatches, unseen] = await Promise.all([
    portalService.getDeck(),
    portalService.getPreferences(),
    portalService.getActiveCount(),
    portalService.getUnseenMatch().catch(() => null),
  ]);
  return { deck, preferences, activeMatches, unseen };
}

const pause = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** Which screen the deck shows once loaded (rule 32: all on /discover). */
function screenFor(deck: DeckStatus, matched: MemberId | null, deciding: boolean) {
  if (matched) return "match";
  if (deck.fitting === 0) return "filtersEmpty";
  if (deck.remaining.length === 0 && !deciding) return "empty";
  return "deck";
}

/**
 * W04 / DISCOVER on one URL: the three-column deck with SWIPE-PASS / LIKE / SUPER feedback
 * (0.8 s) and DISCOVER-NEXT, then MATCH-NEW after a mutual like (or for a match made in the
 * background), DISCOVER-EMPTY once everyone was reviewed and FILTERS-EMPTY when no one fits.
 */
export function DiscoverView() {
  const copy = getDiscoverPage();
  const shell = getPortalShell();
  const router = useRouter();
  const location = useMemberLocation();
  const { value: data, error, reload } = useLoaded(screenKeys.deck, loadDiscovery);
  const [feedback, setFeedback] = useState<{ member: MemberId; decision: Decision } | null>(null);
  const [matched, setMatched] = useState<MemberId | null>(null);
  const [seenUnseen, setSeenUnseen] = useState(false);
  const [announcement, setAnnouncement] = useState("");
  /** Why the last decision wasn't recorded, as the API says it (the weekly Super Like limit); the card stays. */
  const [failure, setFailure] = useState<string | null>(null);
  const [drag, setDrag] = useState<Drag | null>(null);
  const intentTaken = useRef(false);

  const shownMatch = matched ?? (seenUnseen ? null : (data?.unseen ?? null));
  const memberId = data ? (feedback?.member ?? data.deck.remaining[0] ?? null) : null;
  const nextId = data?.deck.remaining.find((id) => id !== memberId) ?? null;
  const member = useMember(memberId);
  // Warm the next candidate's profile so DISCOVER-NEXT doesn't wait for it.
  useMember(nextId);
  const matchedMember = useMember(shownMatch);

  const decide = async (id: MemberId, decision: Decision) => {
    setFeedback({ member: id, decision });
    setFailure(null);
    setAnnouncement(copy.card.sent[decision]);
    try {
      const [result] = await Promise.all([portalService.decide(id, decision), pause(copy.feedbackMs)]);
      await reload();
      if (result.matched) setMatched(id);
    } catch (error) {
      setFailure(failureReason(error));
    } finally {
      setFeedback(null);
    }
  };

  // A decision made on the full profile plays its feedback here, once the deck is read.
  const ready = data !== undefined;
  useEffect(() => {
    if (!ready || intentTaken.current) return;
    intentTaken.current = true;
    const intent = deckIntent.take();
    if (intent) void Promise.resolve().then(() => decide(intent.member, intent.decision));
    // `decide` reads only setters and data copy; the intent is taken once per visit.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  // A candidate who became unavailable since the deck was built is passed over quietly.
  const unavailable = member === null && memberId !== null && feedback === null;
  const passedOver = useRef(new Set<MemberId>());
  useEffect(() => {
    if (!unavailable || !memberId || passedOver.current.has(memberId)) return;
    passedOver.current.add(memberId);
    void portalService
      .decide(memberId, "pass")
      .catch(() => undefined)
      .then(() => reload());
  }, [unavailable, memberId, reload]);

  // MATCH-NEW has been shown: the service stops offering it.
  useEffect(() => {
    if (shownMatch) void portalService.markMatchSeen(shownMatch);
  }, [shownMatch]);

  if (!data) return error ? <LoadFailed onRetry={() => void reload()} error={error} /> : null;

  const screen = screenFor(data.deck, shownMatch, feedback !== null);
  const runAgain = (action: () => Promise<unknown>) => () => {
    setAnnouncement("");
    void action().then(reload);
  };

  if (screen === "match" && shownMatch) {
    const keepDiscovering = () => {
      setMatched(null);
      setSeenUnseen(true);
    };
    const name = matchedMember?.name ?? getMemberName(shownMatch);
    return (
      <StatusScreen
        back={<PortalBack action={shell.back} onClick={keepDiscovering} />}
        title={copy.matchNew.title}
        description={fill(copy.matchNew.description, { name })}
        primary={{ label: copy.matchNew.primary, to: toItem("CHAT-01", shownMatch) }}
        secondary={{ label: copy.matchNew.secondary, onClick: keepDiscovering }}
      >
        <StatusArtwork icon={copy.matchNew.icon} timer={copy.matchNew.timer} timerLabel={copy.matchNew.timerLabel} photo={matchedMember?.photo} />
      </StatusScreen>
    );
  }

  if (screen === "empty" || screen === "filtersEmpty") {
    const state = screen === "empty" ? copy.empty : copy.filtersEmpty;
    const secondary = screen === "empty" ? runAgain(portalService.refreshDeck) : runAgain(portalService.resetPreferences);
    return (
      <StatusScreen
        back={<PortalBack action={shell.back} onClick={() => router.back()} />}
        title={state.title}
        description={state.description}
        summary={state.summary}
        primary={state.primary}
        secondary={{ label: state.secondary, onClick: secondary }}
      />
    );
  }

  // The candidate's profile is still loading, or they became unavailable (the deck moves on when re-read).
  if (!memberId || !member) return null;
  const entry = copy.deck.find((candidate) => candidate.member === memberId);
  const deciding = feedback !== null;

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (deciding || !event.isPrimary) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    setDrag({ pointer: event.pointerId, startX: event.clientX, offset: 0 });
  };
  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (drag?.pointer === event.pointerId) setDrag({ ...drag, offset: event.clientX - drag.startX });
  };
  const onPointerUp = (event: PointerEvent<HTMLDivElement>) => {
    if (drag?.pointer !== event.pointerId) return;
    setDrag(null);
    if (Math.abs(drag.offset) >= SWIPE_PX) void decide(memberId, drag.offset < 0 ? "pass" : "like");
  };

  const decisions: { decision: Decision; variant: "roseOutline" | "confirm"; width: "decision" | "superLike" }[] = [
    { decision: "pass", variant: "roseOutline", width: "decision" },
    { decision: "like", variant: "confirm", width: "decision" },
    { decision: "super", variant: "roseOutline", width: "superLike" },
  ];

  return (
    <>
      <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
        <FormHeader variant="portalPage" title={copy.title} description={copy.description} revealDelay={0} className="min-w-0 flex-1" />
        <ActionButton action={copy.adjustFilters} variant="roseOutline" size="pillCompact" width="portalAction" />
      </div>
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,400px)_minmax(0,1fr)] xl:grid-cols-[240px_448px_minmax(0,1fr)]">
        <DiscoverSidebar
          location={location}
          facts={preferenceFacts(data.preferences, location, ["interestedIn", "ageRange", "distance", "verification"])}
          activeMatches={data.activeMatches}
          // W11: tablets hide the preferences column ("Adjust filters" stays in the heading); phones keep it on top.
          className="md:max-xl:hidden"
        />
        <section aria-label={copy.card.deckLabel} className="flex w-full flex-col gap-3">
          <SwipeCard
            key={memberId}
            member={member}
            title={fill(copy.card.title, { name: member.name, age: member.age })}
            verifiedLine={fill(copy.card.verifiedLine, { distance: member.distance })}
            feedback={feedback ? copy.card.feedback[feedback.decision] : undefined}
            offset={drag?.offset ?? 0}
            dragging={drag !== null}
            drag={{ onPointerDown, onPointerMove, onPointerUp, onPointerCancel: () => setDrag(null) }}
            dragHintId="deck-drag-hint"
            titleId="deck-card-title"
            revealDelay={40}
          />
          <p id="deck-drag-hint" className="sr-only">
            {copy.card.dragHint}
          </p>
          <div role="group" aria-label={copy.card.decisionsLabel} className="flex w-full gap-3">
            {decisions.map((option) => (
              <Button
                key={option.decision}
                type="button"
                variant={option.variant}
                size="pillCompact"
                width={option.width}
                disabled={deciding}
                onClick={() => void decide(memberId, option.decision)}
              >
                {copy.card.decisions[option.decision]}
              </Button>
            ))}
          </div>
          {failure && <StatusNote variant="alert" message={failure} />}
          <Text variant="text12Medium" tone="sub" className="text-center">
            {copy.card.hint}
          </Text>
          <p role="status" className="sr-only">
            {announcement}
          </p>
        </section>
        <ProfileOverview member={member} overview={entry?.overview ?? "profile"} />
      </div>
    </>
  );
}
