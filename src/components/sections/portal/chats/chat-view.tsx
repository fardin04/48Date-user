"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState, type ChangeEvent, type FormEvent, type ReactNode } from "react";
import { ActionButton } from "@/components/pieces/actions/action-button";
import { ActionRow } from "@/components/pieces/actions/action-row";
import { Avatar } from "@/components/pieces/media/avatar";
import { CardHeading } from "@/components/pieces/content/card-heading";
import { ChatBubble } from "@/components/pieces/cards/chat-bubble";
import { DetailRow } from "@/components/pieces/cards/detail-row";
import { FormField } from "@/components/pieces/forms/form-field";
import { Icon } from "@/components/pieces/content/icon";
import { OptionRow } from "@/components/pieces/forms/option-row";
import { PortalBack } from "@/components/pieces/actions/portal-back";
import { PortalCard } from "@/components/pieces/layout/portal-card";
import { PortalDialog } from "@/components/pieces/overlays/portal-dialog";
import { StatusNote } from "@/components/pieces/feedback/status-note";
import { Text } from "@/components/pieces/content/text";
import { TypingDots } from "@/components/pieces/content/typing-dots";
import { Button } from "@/components/ui/button";
import type { Fact, MemberId } from "@/data/portal/types";
import { cn } from "@/lib/cn";
import { fieldControl, fieldInput } from "@/lib/control-sizes";
import { fill } from "@/lib/format";
import { chatService, type ChatMessage, type OutgoingMessage } from "@/lib/portal/chat-service";
import { dateService } from "@/lib/portal/date-service";
import { formatShortDay, formatStamp, formatTime } from "@/lib/portal/date-format";
import { forMember } from "@/lib/portal/member-link";
import { membershipService } from "@/lib/portal/membership-service";
import { screenKeys } from "@/lib/screen-keys";
import { useDatePlan } from "@/hooks/use-date-plan";
import { useLoaded } from "@/hooks/use-loaded";
import { useMatchClock } from "@/hooks/use-match-clock";
import { hrefFor, toItem } from "@/lib/routes";
import { getChatPage, getInboxPage } from "@/stores/portal-store";
import { ChatPhoto } from "@/components/sections/portal/chats/chat-photo";
import { ChatVoice } from "@/components/sections/portal/chats/chat-voice";
import { ConversationContext } from "@/components/sections/portal/chats/conversation-context";
import { ConversationList, chatPaneHeight } from "@/components/sections/portal/chats/conversation-list";
import { ExpiredMatchScreen } from "@/components/sections/portal/matches/match-detail-view";
import { LoadFailed } from "@/components/sections/portal/shared/load-failed";
import { StatusScreen } from "@/components/sections/portal/shared/status-screen";

type Suggest = { mode: "ai" | "starters"; status: "generating" | "ready" | "error"; items: string[] };
type AttachChoice = "game" | "photo" | "voice" | "plan";
type Panel = "chat" | "attach" | "photo" | "voice";

/** Card inside the messages ("Your first hello", "Date invitation", "A little help with your hello"). */
function MessageCard({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return (
    <li className="flex w-full">
      <PortalCard surface="outline" padding="sm" className="flex w-full flex-col gap-3">
        <CardHeading as="h3" size={14} title={title} description={description} />
        {children}
      </PortalCard>
    </li>
  );
}

/** One rose pill of the action row or the conversation tools. */
function ChatAction({ label, onClick, primary, size = "portalPill", width = "grow" }: { label: string; onClick: () => void; primary?: boolean; size?: "portalPill" | "pillCompact"; width?: "grow" | "full" }) {
  return (
    <Button type="button" variant={primary ? "confirm" : "roseOutline"} size={size} width={width} onClick={onClick}>
      {label}
    </Button>
  );
}

function FactRows({ facts }: { facts: Fact[] }) {
  return (
    <dl className="flex flex-col">
      {facts.map((fact) => (
        <DetailRow key={fact.label} label={fact.label} value={fact.value} divided />
      ))}
    </dl>
  );
}

/**
 * W05 on `/chats/<member>` (rule 32): CHAT-01 → CHAT-TYPED → CHAT-SENT / CHAT-FAILED, AI help
 * (AI-GENERATING → CHAT-AI / AI-STARTERS or AI-ERROR), CHAT-ATTACH → CHAT-PHOTO, CHAT-VOICE,
 * the MSG-01 and BLOCK dialogs, BLOCK-DONE, CHAT-INVITE and CHAT-DATE. With the API the
 * conversation is live: both sides' messages, receipts and typing arrive through the service.
 */
export function ChatView({ memberId }: { memberId: MemberId }) {
  const copy = getChatPage();
  const clock = useMatchClock(memberId);
  const router = useRouter();
  const queryClient = useQueryClient();
  const { plan: invite } = useDatePlan(memberId);
  const conversationKey = screenKeys.conversation(memberId);
  const { value: conversation, error, reload } = useLoaded(conversationKey, () => chatService.getConversation(memberId));
  const [panel, setPanel] = useState<Panel>("chat");
  const [dialog, setDialog] = useState<"block" | null>(null);
  const [introDismissed, setIntroDismissed] = useState(false);
  const [suggest, setSuggest] = useState<Suggest | null>(null);
  const [choice, setChoice] = useState<AttachChoice>("photo");
  const [draft, setDraft] = useState("");
  const [pending, setPending] = useState<string | null>(null);
  const [photo, setPhoto] = useState<string | null>(null);
  const [photoError, setPhotoError] = useState("");
  const [busy, setBusy] = useState(false);
  const [typing, setTyping] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const messages = useRef<HTMLOListElement>(null);
  const generation = useRef<AbortController | null>(null);
  const photoUrl = useRef<string | null>(null);
  const photoFile = useRef<File | null>(null);

  const refresh = () => reload();

  // Live messages, receipts and typing while the conversation is open (the service's socket).
  useEffect(
    () =>
      chatService.watch(memberId, {
        onChange: (next) => queryClient.setQueryData(screenKeys.conversation(memberId), next),
        onTyping: setTyping,
      }),
    [memberId, queryClient],
  );

  // Leaving stops AI and frees the photo.
  useEffect(
    () => () => {
      generation.current?.abort();
      if (photoUrl.current) URL.revokeObjectURL(photoUrl.current);
    },
    [],
  );

  const opening = conversation?.opening ?? "firstHello";
  const live = opening === "live";
  const firstHello = opening === "firstHello" || (live && conversation?.messages.length === 0);

  // A new match's conversation opens with MSG-01 once.
  const introOpen = Boolean(conversation && firstHello && !introDismissed && !conversation.introSeen && conversation.messages.length === 0 && !conversation.readOnly);

  // Everything on screen has been read.
  const newest = conversation?.messages.at(-1)?.id;
  useEffect(() => {
    if (newest && document.visibilityState === "visible") void chatService.markSeen(memberId);
  }, [memberId, newest]);

  // Keep the newest message in view.
  const count = (conversation?.messages.length ?? 0) + (pending ? 1 : 0) + (suggest ? 1 : 0) + (typing ? 1 : 0);
  useEffect(() => {
    const list = messages.current;
    if (list) list.scrollTop = list.scrollHeight;
  }, [count, panel]);

  if (!conversation) return error ? <LoadFailed onRetry={() => void reload()} error={error} /> : null;
  if (clock.status === "loading") return null;

  const member = conversation.partner;
  const aside = <ConversationContext partner={member} withAction />;
  if (conversation.blocked) {
    const { blocked } = copy;
    return (
      <StatusScreen
        back={<PortalBack action={getInboxPage().back} />}
        title={blocked.title}
        description={fill(blocked.description, { name: member.name })}
        summary={blocked.summary}
        primary={blocked.primary}
        secondary={forMember(blocked.secondary, memberId)}
        aside={aside}
        actionWidth="actionSlot"
      />
    );
  }
  if (clock.status === "expired" || conversation.readOnly) return <ExpiredMatchScreen aside={aside} />;

  const closePhoto = () => {
    if (photoUrl.current) URL.revokeObjectURL(photoUrl.current);
    photoUrl.current = null;
    photoFile.current = null;
    setPhoto(null);
    setPanel("chat");
  };

  const sendMedia = async (message: OutgoingMessage) => {
    await chatService.send(memberId, message);
    await refresh();
  };

  if (panel === "photo" && photo) {
    return (
      <ChatPhoto
        member={member}
        url={photo}
        onCancel={closePhoto}
        onSend={async (caption) => {
          if (photoFile.current) await sendMedia({ kind: "photo", text: caption, file: photoFile.current });
          closePhoto();
        }}
      />
    );
  }
  if (panel === "voice") {
    return (
      <ChatVoice
        member={member}
        onDiscard={() => setPanel("chat")}
        onSend={async (duration, recording, seconds) => {
          await sendMedia({ kind: "voice", text: duration, file: recording, seconds });
          setPanel("chat");
        }}
      />
    );
  }

  const own = conversation.messages.filter((message) => message.mine);
  const last = own.at(-1);
  const failed = last?.status === "failed" ? last : null;
  // A live conversation opens by its date plan: an invitation to answer, or an agreed date.
  const stage = live ? (invite?.status === "invited" ? "invite" : invite?.status === "confirmed" ? "agreed" : firstHello ? "firstHello" : "live") : opening;

  const generate = async (mode: Suggest["mode"], again = false) => {
    generation.current?.abort();
    const controller = new AbortController();
    generation.current = controller;
    setPanel("chat");
    setSuggest({ mode, status: "generating", items: [] });
    try {
      const result = await chatService.getSuggestions(memberId, controller.signal, again);
      setSuggest(result.status === "ready" ? { mode, status: "ready", items: result.suggestions } : { mode, status: "error", items: [] });
    } catch {
      // Stopped: the conversation is already back to normal.
    }
  };

  const stopSuggest = () => {
    generation.current?.abort();
    setSuggest(null);
  };

  const applyText = (text: string) => {
    stopSuggest();
    setDraft(text);
    input.current?.focus();
  };

  const send = async (event?: FormEvent) => {
    event?.preventDefault();
    const text = draft.trim();
    if (!text || pending) return;
    setPending(text);
    // A first hello starts a new conversation: the free plan's weekly allowance may be used up (QUOTA).
    if (firstHello && own.length === 0 && (await membershipService.startConversation(memberId)) === "limit") {
      setPending(null);
      router.push(hrefFor("QUOTA"));
      return;
    }
    setDraft("");
    chatService.setTyping(memberId, false);
    await chatService.send(memberId, { kind: "text", text });
    await refresh();
    setPending(null);
  };

  const retry = async (message: ChatMessage) => {
    if (busy) return;
    setBusy(true);
    await chatService.retry(memberId, message.id);
    await refresh();
    setBusy(false);
  };

  const edit = async (message: ChatMessage) => {
    await chatService.discard(memberId, message.id);
    await refresh();
    setDraft(message.text);
    input.current?.focus();
  };

  const loadOlder = async () => {
    if (busy) return;
    setBusy(true);
    try {
      queryClient.setQueryData(conversationKey, await chatService.loadOlder(memberId));
    } finally {
      setBusy(false);
    }
  };

  const choosePhoto = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!copy.photo.accept.includes(file.type) || file.size > copy.photo.maxBytes) {
      setPhotoError(copy.photo.invalid);
      return;
    }
    setPhotoError("");
    const url = URL.createObjectURL(file);
    photoUrl.current = url;
    photoFile.current = file;
    setPhoto(url);
    setPanel("photo");
  };

  const accept = async () => {
    if (busy) return;
    setBusy(true);
    await dateService.acceptInvitation(memberId);
    router.push(hrefFor("DATE-PENDING", memberId));
  };

  const block = async () => {
    await chatService.block(memberId);
    setDialog(null);
    await refresh();
  };

  const closeIntro = (open: boolean) => {
    if (open) return;
    setIntroDismissed(true);
    void chatService.markIntroSeen(memberId);
  };

  const caption =
    clock.status === "open"
      ? fill(copy.caption.open, { hours: clock.left.hours, minutes: clock.left.minutes })
      : clock.status === "agreed"
        ? copy.caption.agreed
        : copy.caption.plain;

  const messageLine = (message: ChatMessage) => {
    // Lines the service posts (date confirmed or cancelled, game results, milestones) read as notes.
    if (message.kind === "system" || message.kind === "date" || message.kind === "game" || message.kind === "invite") {
      return (
        <li key={message.id} className="flex w-full">
          <StatusNote variant="highlight" message={message.text} />
        </li>
      );
    }
    const text = message.deleted
      ? copy.deleted
      : message.kind === "photo"
        ? message.text || copy.photoMessage
        : message.kind === "voice"
          ? fill(copy.voiceMessage, { duration: message.text })
          : message.text;
    const time = formatStamp(message.sentAt);
    const status = !message.mine ? fill(copy.received, { time }) : message.status === "failed" ? copy.failed : fill(message.status === "seen" ? copy.seen : copy.sent, { time });
    const meta = message.edited ? fill(copy.edited, { meta: status }) : status;
    const media = message.mediaUrl;
    return (
      <ChatBubble
        key={message.id}
        variant={message.mine ? "own" : "incoming"}
        text={message.kind === "photo" && message.text && !message.deleted ? `${copy.photoMessage} · ${text}` : text}
        meta={meta}
        metaTone={message.status === "failed" ? "alert" : "sub"}
        image={message.kind === "photo" && media ? { src: media, alt: copy.photoMessage, width: 720, height: 960 } : undefined}
        audio={message.kind === "voice" && media ? { src: media, label: message.mine ? copy.ownVoiceLabel : fill(copy.voiceLabel, { name: member.name }) } : undefined}
      />
    );
  };

  /** Screen actions for the current state. */
  const actions = (() => {
    if (panel === "attach") {
      const destination = choice === "game" ? toItem(copy.attach.game.step, memberId) : choice === "plan" ? toItem("VENUES", memberId) : null;
      return destination ? (
        <ActionButton action={{ label: copy.attach.primary[choice], to: destination }} variant="confirm" size="portalPill" width="full" />
      ) : (
        <Button type="button" variant="confirm" size="portalPill" width="full" onClick={() => (choice === "photo" ? fileInput.current?.click() : setPanel("voice"))}>
          {copy.attach.primary[choice]}
        </Button>
      );
    }
    if (suggest?.status === "generating") {
      const labels = copy.actions.generating;
      return (
        <>
          <ChatAction label={labels.primary} onClick={stopSuggest} primary />
          <ChatAction label={labels.secondary} onClick={stopSuggest} />
        </>
      );
    }
    if (suggest?.status === "error") {
      const labels = copy.actions.aiError;
      return (
        <>
          <ChatAction label={labels.primary} onClick={() => void generate(suggest.mode)} primary />
          <ChatAction label={labels.secondary} onClick={() => applyText("")} />
        </>
      );
    }
    if (suggest?.status === "ready") {
      const labels = copy.actions[suggest.mode];
      return (
        <>
          <ChatAction label={labels.primary} onClick={() => applyText(suggest.items[0] ?? "")} primary />
          <ChatAction label={labels.secondary} onClick={() => void generate(suggest.mode, true)} />
        </>
      );
    }
    if (draft.trim())
      return (
        <Button type="submit" form="chat-composer" variant="confirm" size="portalPill" width="full" disabled={Boolean(pending)}>
          {copy.actions.typed}
        </Button>
      );
    if (failed) {
      const labels = copy.actions.failed;
      return (
        <>
          <Button type="button" variant="confirm" size="portalPill" width="grow" disabled={busy} aria-busy={busy || undefined} onClick={() => void retry(failed)}>
            {labels.primary}
          </Button>
          <ChatAction label={labels.secondary} onClick={() => void edit(failed)} />
        </>
      );
    }
    if (stage === "invite" && (live || own.length === 0))
      return (
        <>
          <Button type="button" variant="confirm" size="portalPill" width="grow" disabled={busy} aria-busy={busy || undefined} onClick={() => void accept()}>
            {copy.actions.invite.primary.label}
          </Button>
          <ActionButton action={forMember(copy.actions.invite.secondary, memberId)} variant="roseOutline" size="portalPill" width="grow" />
        </>
      );
    const pair = stage === "agreed" ? copy.actions.agreed : own.length > 0 || stage === "live" ? copy.actions.sent : null;
    if (pair)
      return (
        <>
          <ActionButton action={forMember(pair.primary, memberId)} variant="confirm" size="portalPill" width="grow" />
          <ActionButton action={forMember(pair.secondary, memberId)} variant="roseOutline" size="portalPill" width="grow" />
        </>
      );
    return (
      <>
        <ChatAction label={copy.actions.start.primary} onClick={() => void generate("starters")} primary />
        <ActionButton action={forMember(copy.actions.start.secondary, memberId)} variant="roseOutline" size="portalPill" width="grow" />
      </>
    );
  })();

  const askAi = () => void generate("ai");
  const toggleAttach = () => {
    stopSuggest();
    setChoice("photo");
    setPanel(panel === "attach" ? "chat" : "attach");
  };
  const openVoice = () => setPanel("voice");
  const openBlock = () => setDialog("block");

  // The invitation and agreed-date cards show the plan the date screens use (the samples' copy until it loads).
  const planFacts = (facts: Fact[]) =>
    facts.map((fact, index) => (index === 0 && invite?.date && invite.time !== null ? { ...fact, value: `${formatShortDay(invite.date)} · ${formatTime(invite.time)}` } : fact));

  const sampleIncoming = <ChatBubble variant="incoming" text={copy.sample.incoming} />;
  const sampleReply = <ChatBubble variant="own" text={copy.sample.reply} meta={copy.sample.replyMeta} />;

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[280px_minmax(0,1fr)] xl:grid-cols-[280px_minmax(0,1fr)_312px]">
      <ConversationList current={memberId} className="max-lg:hidden" />
      <PortalCard as="section" surface="outline" padding="lg" revealDelay={0} aria-labelledby="chat-title" className={cn("flex w-full flex-col gap-4", chatPaneHeight)}>
        <header className="flex items-center gap-3">
          <Avatar image={member.photo} size={48} decorative />
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <Text as="h1" id="chat-title" variant="text20SemiboldSnug" tone="strong">
              {member.name}
            </Text>
            <Text variant="text12Medium" tone="sub">
              {caption}
            </Text>
          </div>
        </header>
        <ol
          ref={messages}
          aria-label={copy.messagesLabel}
          aria-live="polite"
          className="flex min-h-80 flex-1 flex-col gap-4 overflow-x-clip overflow-y-auto rounded-16 bg-canvas-cool p-4 max-lg:max-h-112"
        >
          {live && conversation.hasOlder && (
            <li className="flex w-full justify-center">
              <Button type="button" variant="roseOutline" size="pillCompact" width="auto" disabled={busy} onClick={() => void loadOlder()}>
                {copy.older}
              </Button>
            </li>
          )}
          {suggest?.status === "generating" && (
            <li className="flex w-full">
              <StatusNote variant="highlight" message={copy.generating} />
            </li>
          )}
          {suggest?.status === "error" && (
            <li className="flex w-full">
              <StatusNote variant="alert" message={copy.aiError} />
            </li>
          )}
          {firstHello && own.length === 0 && !pending && (
            <MessageCard title={copy.firstHello.title} description={live ? copy.firstHello.liveDescription : copy.firstHello.description}>
              <Icon name={copy.firstHello.icon} size={40} tone="rose" />
              <Text variant="text16" tone="sub">
                {copy.firstHello.body}
              </Text>
            </MessageCard>
          )}
          {stage === "agreed" && !live && (
            <MessageCard title={copy.agreed.title} description={copy.agreed.description}>
              <FactRows facts={copy.agreed.facts} />
            </MessageCard>
          )}
          {!live && opening !== "firstHello" && sampleIncoming}
          {!live && (opening === "invite" || opening === "agreed") && sampleReply}
          {stage === "invite" && !live && (
            <MessageCard title={copy.invite.title} description={copy.invite.description}>
              <FactRows facts={planFacts(copy.invite.facts)} />
            </MessageCard>
          )}
          {(live ? conversation.messages : own).map(messageLine)}
          {pending && <ChatBubble variant="own" text={pending} meta={copy.sending} />}
          {typing && (
            <li className="flex w-full">
              <TypingDots variant="bubble" label={fill(copy.typing, { name: member.name })} />
            </li>
          )}
          {suggest?.status === "ready" && (
            <MessageCard title={copy.suggestions.title} description={copy.suggestions.description}>
              <ul className="flex flex-col">
                {suggest.items.map((item) => (
                  <li key={item} className="flex items-center justify-between gap-3 border-b border-divider bg-white p-3">
                    <Text as="span" variant="text14Semibold" tone="strong" className="min-w-0 flex-1">
                      {item}
                    </Text>
                    <button
                      type="button"
                      onClick={() => applyText(item)}
                      aria-label={fill(copy.suggestions.useLabel, { text: item })}
                      className="focus-ring shrink-0 cursor-pointer rounded-full bg-divider px-3 py-1 transition-opacity hover:opacity-75"
                    >
                      <Text as="span" variant="text14Relaxed" tone="sub">
                        {copy.suggestions.use}
                      </Text>
                    </button>
                  </li>
                ))}
              </ul>
            </MessageCard>
          )}
          {panel === "attach" && (
            <li className="flex w-full">
              <fieldset className="flex w-full flex-col gap-4">
                <legend className="sr-only">{copy.attach.legend}</legend>
                {copy.attach.options.map((option) => (
                  <OptionRow
                    key={option.value}
                    variant="choice"
                    name="chat-attach"
                    value={option.value}
                    label={option.label}
                    checked={choice === option.value}
                    onSelect={() => setChoice(option.value as AttachChoice)}
                  />
                ))}
                {photoError && <StatusNote variant="alert" message={photoError} />}
              </fieldset>
            </li>
          )}
        </ol>
        <div role="group" aria-label={copy.tools.label} className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <ChatAction label={copy.tools.ai} onClick={askAi} size="pillCompact" width="full" />
          <ChatAction label={copy.tools.photo} onClick={toggleAttach} size="pillCompact" width="full" />
          <ChatAction label={copy.tools.voice} onClick={openVoice} size="pillCompact" width="full" />
          <ChatAction label={copy.tools.safety} onClick={openBlock} size="pillCompact" width="full" />
        </div>
        <form id="chat-composer" onSubmit={send}>
          <FormField htmlFor="chat-message" label={copy.composer.label}>
            <div className="flex items-center gap-2">
              <div className={cn(fieldControl.base, fieldControl.default, "min-w-0 flex-1")}>
                <input
                  ref={input}
                  id="chat-message"
                  value={draft}
                  onChange={(event) => {
                    setDraft(event.target.value);
                    chatService.setTyping(memberId, event.target.value.trim().length > 0);
                  }}
                  placeholder={copy.composer.placeholder}
                  maxLength={copy.composer.maxLength}
                  autoComplete="off"
                  className={fieldInput}
                />
              </div>
              <Button type="submit" variant="confirm" size="pillCompact" width="send" disabled={!draft.trim() || Boolean(pending)}>
                {copy.composer.send}
              </Button>
            </div>
          </FormField>
        </form>
        <ActionRow>{actions}</ActionRow>
        <input ref={fileInput} type="file" accept={copy.photo.accept.join(",")} onChange={choosePhoto} className="sr-only" tabIndex={-1} aria-hidden="true" />
      </PortalCard>
      <ConversationContext partner={member} className="md:max-xl:hidden" />
      <PortalDialog
        open={introOpen && dialog === null}
        onOpenChange={closeIntro}
        title={copy.intro.title}
        description={fill(copy.intro.description, { name: member.name })}
        closeLabel={copy.intro.close}
        actions={
          <>
            <ActionButton action={forMember(copy.intro.play, memberId)} variant="confirm" size="portalPill" width="full" />
            <Button type="button" variant="roseOutline" size="portalPill" width="full" onClick={() => closeIntro(false)}>
              {copy.intro.skip}
            </Button>
          </>
        }
      >
        <div className="relative h-37.5 w-65 overflow-hidden rounded-16">
          <Image src={copy.intro.image.src} alt={copy.intro.image.alt} fill sizes="260px" className="object-cover" />
        </div>
        <StatusNote variant="highlight" message={copy.intro.note} />
      </PortalDialog>
      <PortalDialog
        open={dialog === "block"}
        onOpenChange={(open) => setDialog(open ? "block" : null)}
        title={fill(copy.block.title, { name: member.name })}
        description={copy.block.description}
        closeLabel={copy.block.close}
        actions={
          <>
            <Button type="button" variant="confirm" size="portalPill" width="full" onClick={() => void block()}>
              {copy.block.confirm}
            </Button>
            <Button type="button" variant="roseOutline" size="portalPill" width="full" onClick={() => setDialog(null)}>
              {copy.block.keep}
            </Button>
          </>
        }
      >
        <Icon name={copy.block.icon} size={120} tone="rose" />
      </PortalDialog>
    </div>
  );
}
