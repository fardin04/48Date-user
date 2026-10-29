"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { ActionButton } from "@/components/pieces/actions/action-button";
import { ActionRow } from "@/components/pieces/actions/action-row";
import { CardHeading } from "@/components/pieces/content/card-heading";
import { FormHeader } from "@/components/pieces/forms/form-header";
import { Icon } from "@/components/pieces/content/icon";
import { PictureChoice } from "@/components/pieces/forms/picture-choice";
import { PortalBack } from "@/components/pieces/actions/portal-back";
import { PortalCard } from "@/components/pieces/layout/portal-card";
import { PortalDialog } from "@/components/pieces/overlays/portal-dialog";
import { StatusNote } from "@/components/pieces/feedback/status-note";
import { Text } from "@/components/pieces/content/text";
import { Button } from "@/components/ui/button";
import type { ImageAsset } from "@/data/types";
import type { MemberId } from "@/data/portal/types";
import { fill } from "@/lib/format";
import { gameService } from "@/lib/portal/game-service";
import { forMember } from "@/lib/portal/member-link";
import { toItem } from "@/lib/routes";
import { getGamePage, getMember } from "@/stores/portal-store";
import { GameContext } from "@/components/sections/portal/games/game-context";
import { StatusScreen } from "@/components/sections/portal/shared/status-screen";
import { Workspace } from "@/components/sections/portal/shared/workspace";

type Phase = "intro" | "question" | "wait" | "result" | "left";

/** 856×515 "Media / game" art on GAMES and GAME-RESULT. */
function GameArt({ art }: { art: ImageAsset }) {
  return (
    <div className="relative h-129 w-full overflow-hidden rounded-16 max-md:h-70">
      <Image src={art.src} alt={art.alt} fill sizes="(min-width: 1280px) 860px, 100vw" className="object-contain" />
    </div>
  );
}

/** Card with an Align UI heading and a 16/24 line ("This or That", "7 answers in common"). */
function GameCard({ title, description, body }: { title: string; description: string; body: string }) {
  return (
    <PortalCard surface="outline" padding="sm" className="flex w-full flex-col gap-4">
      <CardHeading as="h2" size={14} title={title} description={description} />
      <Text variant="text16" tone="sub">
        {body}
      </Text>
    </PortalCard>
  );
}

/**
 * W07 on `/games/<member>` (rule 32): GAMES → GAME-QUESTION → GAME-WAIT (both choices before any
 * reveal) → GAME-RESULT, with the GAME-LEAVE dialog and GAME-LEFT when the match leaves.
 */
export function GameView({ memberId }: { memberId: MemberId }) {
  const copy = getGamePage();
  const name = getMember(memberId).name;
  const total = copy.questions.length;
  const [phase, setPhase] = useState<Phase>("intro");
  const [round, setRound] = useState(0);
  const [choice, setChoice] = useState("");
  const [answers, setAnswers] = useState<string[]>([]);
  const [partner, setPartner] = useState<string[]>([]);
  const [leaving, setLeaving] = useState(false);
  const pending = useRef<AbortController | null>(null);

  // Leaving the page stops waiting for the match.
  useEffect(() => () => pending.current?.abort(), []);

  const restart = () => {
    pending.current?.abort();
    setPhase("intro");
    setRound(0);
    setChoice("");
    setAnswers([]);
    setPartner([]);
  };

  const submit = async () => {
    if (!choice) return;
    setAnswers((current) => [...current.slice(0, round), choice]);
    setPhase("wait");
    const controller = new AbortController();
    pending.current = controller;
    try {
      const result = await gameService.answer(memberId, round, choice, controller.signal);
      if (result.status === "left") return setPhase("left");
      setPartner((current) => [...current.slice(0, round), result.choice]);
    } catch {
      // Stopped: the member left the game or the page.
    }
  };

  const advance = () => {
    if (round + 1 >= total) return setPhase("result");
    setRound(round + 1);
    setChoice("");
    setPhase("question");
  };

  const roundNumber = Math.min(round + 1, total);
  const aside = <GameContext member={memberId} round={roundNumber} />;
  const back = <PortalBack action={{ ...copy.back, to: toItem("CHAT-01", memberId) }} onClick={phase === "question" || phase === "wait" ? () => setLeaving(true) : undefined} />;
  const question = copy.questions[round];
  const prompt = fill(copy.question.prompt, { round: roundNumber, total, prompt: question.prompt });
  const answered = partner.length > round;

  const leaveDialog = (
    <PortalDialog
      open={leaving}
      onOpenChange={setLeaving}
      header="fit"
      title={copy.leave.title}
      description={copy.leave.description}
      closeLabel={copy.leave.close}
      actions={
        <>
          <ActionButton action={forMember(copy.leave.confirm, memberId)} variant="confirm" size="portalPill" width="full" />
          <Button type="button" variant="roseOutline" size="portalPill" width="full" onClick={() => setLeaving(false)}>
            {copy.leave.keep}
          </Button>
        </>
      }
    >
      <Icon name={copy.leave.icon} size={120} tone="iconDark" />
    </PortalDialog>
  );

  if (phase === "left") {
    const { left } = copy;
    return (
      <StatusScreen
        back={back}
        title={fill(left.title, { name })}
        description={left.description}
        summary={left.summary}
        primary={forMember(left.primary, memberId)}
        secondary={{ label: left.again, onClick: restart }}
        aside={aside}
        actionWidth="actionSlot"
      />
    );
  }

  if (phase === "intro") {
    const { intro } = copy;
    return (
      <Workspace aside={aside}>
        <FormHeader variant="portal" title={intro.title} description={intro.description} />
        <GameArt art={intro.art} />
        <GameCard title={intro.card.title} description={intro.card.description} body={intro.body} />
        <ActionRow>
          <Button type="button" variant="confirm" size="portalPill" width="actionSlot" onClick={() => setPhase("question")}>
            {intro.primary}
          </Button>
        </ActionRow>
      </Workspace>
    );
  }

  if (phase === "result") {
    const { result } = copy;
    const common = answers.filter((answer, index) => answer === partner[index]).length;
    const first = copy.questions[0].choices.find((option) => option.value === answers[0]);
    const description = first && answers[0] === partner[0] ? fill(result.matched, { choice: first.noun ?? first.label }) : result.general;
    return (
      <Workspace aside={aside}>
        {back}
        <FormHeader variant="portal" title={result.title} description={description} />
        <GameArt art={result.art} />
        <GameCard title={fill(result.card.title, { count: common })} description={result.card.description} body={result.body} />
        <ActionRow>
          <ActionButton action={forMember(result.primary, memberId)} variant="confirm" size="portalPill" width="actionSlot" />
          <ActionButton action={forMember(result.secondary, memberId)} variant="roseOutline" size="portalPill" width="actionSlot" />
        </ActionRow>
      </Workspace>
    );
  }

  const waiting = phase === "wait";
  return (
    <Workspace aside={aside}>
      {back}
      <FormHeader
        variant="portalStatus"
        title={waiting ? copy.wait.title : copy.name}
        description={waiting ? fill(copy.wait.description, { name }) : fill(copy.question.description, { round: roundNumber, total })}
      />
      <StatusNote variant="highlight" message={prompt} />
      <fieldset className="grid w-full gap-3 sm:grid-cols-2 lg:max-w-178">
        <legend className="sr-only">{copy.question.legend}</legend>
        {question.choices.map((option) => (
          <PictureChoice
            key={option.value}
            name={`game-round-${round}`}
            value={option.value}
            label={option.label}
            image={option.image}
            checked={(waiting ? answers[round] : choice) === option.value}
            disabled={waiting}
            onSelect={() => setChoice(option.value)}
          />
        ))}
      </fieldset>
      {waiting && <StatusNote variant="highlight" message={fill(answered ? copy.wait.answered : copy.wait.waiting, { name })} />}
      <ActionRow>
        {waiting ? (
          <>
            <Button type="button" variant="confirm" size="portalPill" width="actionSlot" disabled={!answered} aria-busy={!answered || undefined} onClick={advance}>
              {round + 1 >= total ? copy.wait.results : copy.wait.next}
            </Button>
            <ActionButton action={{ label: copy.wait.chat, to: toItem("CHAT-01", memberId) }} variant="roseOutline" size="portalPill" width="actionSlot" />
          </>
        ) : (
          <>
            <Button type="button" variant="confirm" size="portalPill" width="actionSlot" disabled={!choice} onClick={() => void submit()}>
              {copy.question.next}
            </Button>
            <Button type="button" variant="roseOutline" size="portalPill" width="actionSlot" onClick={() => setLeaving(true)}>
              {copy.question.leave}
            </Button>
          </>
        )}
      </ActionRow>
      {leaveDialog}
    </Workspace>
  );
}
