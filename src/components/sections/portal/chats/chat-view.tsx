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
import { ActionMenu, type MenuItem } from "@/components/pieces/overlays/action-menu";
import { PortalBack } from "@/components/pieces/actions/portal-back";
import { PortalCard } from "@/components/pieces/layout/portal-card";
import { PortalDialog } from "@/components/pieces/overlays/portal-dialog";
import { StatusNote } from "@/components/pieces/feedback/status-note";
import { Text } from "@/components/pieces/content/text";
import { TypingDots } from "@/components/pieces/content/typing-dots";
import { Button } from "@/components/ui/button";
import type { Fact, MemberId } from "@/data/portal/types";
import { cn } from "@/lib/cn";
import { chatComposer, fieldControl, fieldInput, layout } from "@/lib/control-sizes";
import { usePrimaryInView } from "@/hooks/use-primary-in-view";
import { fill } from "@/lib/format";
import { groupsWithPrevious, persistentStatus } from "@/lib/portal/chat-bubble-layout";
import { chatService, type ChatMessage, type OutgoingMessage } from "@/lib/portal/chat-service";
import { conversationOptions } from "@/lib/portal/conversation-menu";
import { dateService } from "@/lib/portal/date-service";
import { formatShortDay, formatStamp, formatTime } from "@/lib/portal/date-format";
import { forMember } from "@/lib/portal/member-link";
import { membershipService } from "@/lib/portal/membership-service";
import { screenKeys } from "@/lib/screen-keys";
import { useDatePlan } from "@/hooks/use-date-plan";
import { useLoaded } from "@/hooks/use-loaded";
import { useMatchClock } from "@/hooks/use-match-clock";
import { hrefFor } from "@/lib/routes";
import { invalidate } from "@/lib/api/cache";
import { cacheKeys } from "@/lib/api/modules/cache-keys";
import { getAccountPage, getChatPage } from "@/stores/portal-store";
import { ChatPhoto } from "@/components/sections/portal/chats/chat-photo";
import { ChatVoice } from "@/components/sections/portal/chats/chat-voice";
import { ConversationContext } from "@/components/sections/portal/chats/conversation-context";
import { ConversationList, chatPaneHeight } from "@/components/sections/portal/chats/conversation-list";
import { ExpiredMatchScreen } from "@/components/sections/portal/matches/match-detail-view";
import { LoadFailed } from "@/components/sections/portal/shared/load-failed";
import { StatusScreen } from "@/components/sections/portal/shared/status-screen";

type Suggest = { mode: "ai" | "starters"; status: "generating" | "ready" | "error"; items: string[] };
type Panel = "chat" | "photo" | "voice";

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

/** One rose pill of the action row. */
function ChatAction({ label, onClick, primary }: { label: string; onClick: () => void; primary?: boolean }) {
  return (
    <Button type="button" variant={primary ? "confirm" : "roseOutline"} size="portalPill" width="grow" onClick={onClick}>
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
  const [dialog, setDialog] = useState<"block" | "unblock" | "context" | null>(null);
  const [introDismissed, setIntroDismissed] = useState(false);
  const [suggest, setSuggest] = useState<Suggest | null>(null);
  const [draft, setDraft] = useState("");
  // A send in progress (its bubble comes from the service, "Sending…" → "Sent": one bubble per message).
  const [sending, setSending] = useState(false);
  const [photo, setPhoto] = useState<string | null>(null);
  const [photoError, setPhotoError] = useState("");
  const [busy, setBusy] = useState(false);
  const [typing, setTyping] = useState(false);
  const input = useRef<HTMLTextAreaElement>(null);
  // Distance from the bottom to keep while earlier messages are added above.
  const keepFromBottom = useRef<number | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const messages = useRef<HTMLOListElement>(null);
  const generation = useRef<AbortController | null>(null);
  const photoUrl = useRef<string | null>(null);
  const photoFile = useRef<File | null>(null);
  const paneTop = useRef<HTMLElement>(null);
  const composer = useRef<HTMLFormElement>(null);
  usePrimaryInView(paneTop, composer, Boolean(conversation) && clock.status !== "loading");

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

  // Keep the newest message in view; earlier messages loaded above keep the reading position.
  const count = (conversation?.messages.length ?? 0) + (suggest ? 1 : 0) + (typing ? 1 : 0);
  useEffect(() => {
    const list = messages.current;
    if (!list) return;
    list.scrollTop = keepFromBottom.current === null ? list.scrollHeight : list.scrollHeight - keepFromBottom.current;
    keepFromBottom.current = null;
  }, [count, panel]);

  // The composer grows with the message, up to about five lines (then it scrolls).
  useEffect(() => {
    const box = input.current;
    if (!box) return;
    box.style.height = "auto";
    box.style.height = `${box.scrollHeight}px`;
  }, [draft]);

  if (!conversation) return error ? <LoadFailed onRetry={() => void reload()} error={error} /> : null;
  if (clock.status === "loading") return null;

  const member = conversation.partner;
  const aside = <ConversationContext partner={member} withAction />;
  if (conversation.blocked) {
    const { blocked } = copy;
    const unblockCopy = getAccountPage().blocked;
    const unblock = async () => {
      if (busy) return;
      setBusy(true);
      try {
        await chatService.unblock(memberId);
        setDialog(null);
        invalidate(cacheKeys.conversations, cacheKeys.matches);
        await refresh();
      } finally {
        setBusy(false);
      }
    };
    return (
      <StatusScreen
        back={<PortalBack action={blocked.back} />}
        title={blocked.title}
        description={fill(blocked.description, { name: member.name })}
        summary={blocked.summary}
        primary={blocked.primary}
        secondary={forMember(blocked.secondary, memberId)}
        aside={aside}
        actionWidth="actionSlot"
      >
        <Button type="button" variant="roseOutline" size="back" width="auto" className="self-start" aria-haspopup="dialog" onClick={() => setDialog("unblock")}>
          {fill(unblockCopy.unblock, { name: member.name })}
        </Button>
        <PortalDialog
          open={dialog === "unblock"}
          onOpenChange={(open) => setDialog(open ? "unblock" : null)}
          title={fill(unblockCopy.dialog.title, { name: member.name })}
          description={unblockCopy.dialog.description}
          closeLabel={unblockCopy.dialog.close}
          actions={
            <>
              <Button type="button" variant="confirm" size="portalPill" width="full" disabled={busy} aria-busy={busy || undefined} onClick={() => void unblock()}>
                {busy ? unblockCopy.dialog.busy : unblockCopy.dialog.confirm}
              </Button>
              <Button type="button" variant="roseOutline" size="portalPill" width="full" onClick={() => setDialog(null)}>
                {unblockCopy.dialog.keep}
              </Button>
            </>
          }
        >
          <Icon name={blocked.summary.icon} size={120} tone="rose" />
        </PortalDialog>
      </StatusScreen>
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
    if (!text || sending) return;
    setSending(true);
    try {
      // A first hello starts a new conversation: the free plan's weekly allowance may be used up (QUOTA).
      if (firstHello && own.length === 0 && (await membershipService.startConversation(memberId)) === "limit") {
        router.push(hrefFor("QUOTA"));
        return;
      }
      setDraft("");
      chatService.setTyping(memberId, false);
      // The service shows the message as "Sending…" at once and replaces it in place when it is stored.
      await chatService.send(memberId, { kind: "text", text });
    } finally {
      setSending(false);
    }
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
      const list = messages.current;
      keepFromBottom.current = list ? list.scrollHeight - list.scrollTop : null;
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

  const shownMessages = live ? conversation.messages : own;
  const keepStatus = persistentStatus(shownMessages);
  const messageLine = (message: ChatMessage, index: number) => {
    // Lines the service posts (date confirmed or cancelled, game results, milestones) read as notes.
    if (message.kind === "system" || message.kind === "date" || message.kind === "game" || message.kind === "invite") {
      return (
        <li key={message.key ?? message.id} className="flex w-full">
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
    const status = !message.mine
      ? fill(copy.received, { time })
      : message.status === "failed"
        ? copy.failed
        : message.status === "sending"
          ? copy.sending
          : fill(message.status === "seen" ? copy.seen : copy.sent, { time });
    const meta = message.edited ? fill(copy.edited, { meta: status }) : status;
    const media = message.mediaUrl;
    return (
      <ChatBubble
        key={message.key ?? message.id}
        variant={message.mine ? "own" : "incoming"}
        metaVisible={keepStatus.has(message.id)}
        className={groupsWithPrevious(shownMessages, index) ? "-mt-2" : undefined}
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
        <Button type="submit" form="chat-composer" variant="confirm" size="portalPill" width="full" disabled={sending}>
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

  const openBlock = () => setDialog("block");
  // The "+" menu: the six conversation actions, each calling its existing handler or page.
  const menuActions: Record<(typeof copy.menu.items)[number]["id"], Pick<MenuItem, "onSelect" | "to">> = {
    ai: { onSelect: () => void generate("ai") },
    safety: { onSelect: openBlock },
    voice: {
      onSelect: () => {
        stopSuggest();
        setPanel("voice");
      },
    },
    photo: {
      onSelect: () => {
        stopSuggest();
        fileInput.current?.click();
      },
    },
    plan: { to: forMember(copy.menu.plan, memberId).to },
    game: { to: forMember(copy.menu.game, memberId).to },
  };
  const menuItems: MenuItem[] = copy.menu.items.map((item) => ({ ...item, ...menuActions[item.id] }));
  const optionItems: MenuItem[] = conversationOptions(memberId, member.name, false).map((option) => ({
    ...option,
    onSelect: option.id === "block" ? openBlock : undefined,
  }));

  // The invitation and agreed-date cards show the plan the date screens use (the samples' copy until it loads).
  const planFacts = (facts: Fact[]) =>
    facts.map((fact, index) => (index === 0 && invite?.date && invite.time !== null ? { ...fact, value: `${formatShortDay(invite.date)} · ${formatTime(invite.time)}` } : fact));

  const sampleIncoming = <ChatBubble variant="incoming" text={copy.sample.incoming} />;
  const sampleReply = <ChatBubble variant="own" text={copy.sample.reply} meta={copy.sample.replyMeta} />;

  return (
    // Side columns flex with the viewport (Figma 280 / 312 at 1440); the conversation takes the rest.
    <div className="grid items-start gap-6 lg:grid-cols-[clamp(240px,24%,320px)_minmax(0,1fr)] xl:grid-cols-[clamp(240px,20%,320px)_minmax(0,1fr)_clamp(260px,22%,360px)]">
      <ConversationList current={memberId} className="max-lg:hidden" />
      <PortalCard as="section" surface="outline" padding="md" revealDelay={0} aria-labelledby="chat-title" className={cn("flex w-full min-w-0 flex-col gap-3 max-lg:overflow-visible", chatPaneHeight)}>
        <PortalBack action={copy.back} className="lg:hidden" />
        {/* The tools sit in the header (below the name when narrow), so the messages get the height (owner report). */}
        <header ref={paneTop} className="flex scroll-mt-4 items-center gap-3">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <Avatar image={member.photo} size={48} decorative />
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <Text as="h1" id="chat-title" variant="text20SemiboldSnug" tone="strong" className="break-anywhere">
                {member.name}
              </Text>
              <Text variant="text12Medium" tone="sub">
                {caption}
              </Text>
            </div>
          </div>
          <div className="flex shrink-0 gap-2">
            <Button
              type="button"
              variant="roseOutline"
              size="icon"
              className="xl:hidden"
              aria-haspopup="dialog"
              aria-label={fill(copy.contextButton.label, { name: member.name })}
              onClick={() => setDialog("context")}
            >
              <Icon name={copy.contextButton.icon} size={20} tone="rose" />
            </Button>
            <ActionMenu label={copy.options.label} icon={copy.options.icon} items={optionItems} placement="below" align="end" />
          </div>
        </header>
        <ol
          ref={messages}
          aria-label={copy.messagesLabel}
          aria-live="polite"
          className="flex min-h-80 flex-1 flex-col gap-3 overflow-x-clip overflow-y-auto lg:min-h-0 rounded-16 bg-canvas-cool p-3 max-lg:max-h-112"
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
          {firstHello && own.length === 0 && (
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
          {shownMessages.map(messageLine)}
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
          {photoError && (
            <li className="flex w-full">
              <StatusNote variant="alert" message={photoError} />
            </li>
          )}
        </ol>
        <form ref={composer} id="chat-composer" onSubmit={send} className={layout.stickyActions}>
          <FormField htmlFor="chat-message" label={copy.composer.label} hideLabel>
            <div className="flex items-end gap-2">
              <ActionMenu label={copy.menu.label} icon={copy.menu.icon} items={menuItems} className="mb-1.5" />
              <div className={cn(fieldControl.base, fieldControl.default, chatComposer.control, "min-w-0 flex-1")}>
                <textarea
                  ref={input}
                  id="chat-message"
                  rows={1}
                  value={draft}
                  onChange={(event) => {
                    setDraft(event.target.value);
                    chatService.setTyping(memberId, event.target.value.trim().length > 0);
                  }}
                  onKeyDown={(event) => {
                    // Enter sends, Shift+Enter adds a line (as the single-line field sent on Enter).
                    if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
                      event.preventDefault();
                      composer.current?.requestSubmit();
                    }
                  }}
                  placeholder={copy.composer.placeholder}
                  maxLength={copy.composer.maxLength}
                  autoComplete="off"
                  className={cn(fieldInput, chatComposer.input)}
                />
              </div>
              <Button type="submit" variant="confirm" size="pillCompact" width="send" aria-label={copy.composer.send} disabled={!draft.trim() || sending}>
                {copy.composer.send}
              </Button>
            </div>
          </FormField>
        </form>
        <ActionRow>{actions}</ActionRow>
        <input ref={fileInput} type="file" accept={copy.photo.accept.join(",")} onChange={choosePhoto} className="sr-only" tabIndex={-1} aria-hidden="true" />
      </PortalCard>
      <ConversationContext partner={member} className="max-xl:hidden" />
      <PortalDialog
        open={dialog === "context"}
        onOpenChange={(open) => setDialog(open ? "context" : null)}
        title={fill(copy.contextButton.label, { name: member.name })}
        description={copy.context.description}
        closeLabel={copy.contextButton.close}
        header="fit"
        actions={null}
      >
        <ConversationContext partner={member} withAction />
      </PortalDialog>
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
