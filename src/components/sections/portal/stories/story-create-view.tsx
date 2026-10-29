"use client";

import Image from "next/image";
import { useEffect, useState, type FormEvent } from "react";
import { ActionRow } from "@/components/pieces/actions/action-row";
import { CheckboxField } from "@/components/pieces/forms/checkbox-field";
import { FormHeader } from "@/components/pieces/forms/form-header";
import { PortalBack } from "@/components/pieces/actions/portal-back";
import { SelectField } from "@/components/pieces/forms/select-field";
import { StatusBadge } from "@/components/pieces/feedback/status-badge";
import { StatusNote } from "@/components/pieces/feedback/status-note";
import { StatusSummary } from "@/components/pieces/feedback/status-summary";
import { TextAreaField } from "@/components/pieces/forms/text-area-field";
import { TextField } from "@/components/pieces/forms/text-field";
import { ActionButton } from "@/components/pieces/actions/action-button";
import { Button } from "@/components/ui/button";
import { formatMonth, todayIso } from "@/lib/portal/date-format";
import { storyService, type StoryDraft } from "@/lib/portal/story-service";
import { getStoriesPage } from "@/stores/portal-store";
import { StoryContext } from "@/components/sections/portal/stories/story-context";
import { Workspace } from "@/components/sections/portal/shared/workspace";

type Errors = Partial<Record<keyof StoryDraft, string>>;
const EMPTY: StoryDraft = { title: "", met: "", body: "", consent: false };

/** The last `count` months, newest first, as `YYYY-MM` options ("June 2026"). */
function recentMonths(count: number) {
  const [year, month] = todayIso().split("-").map(Number);
  return Array.from({ length: count }, (_, index) => {
    const date = new Date(Date.UTC(year, month - 1 - index, 1));
    const value = date.toISOString().slice(0, 7);
    return { value, label: formatMonth(`${value}-01`) };
  });
}

/** W08 / STORY-CREATE with STORY-ERROR and STORY-PENDING on the same URL (rule 32). */
export function StoryCreateView() {
  const [initial, setInitial] = useState<StoryDraft | null>(null);

  // Start from the kept draft, else the submission being edited, else empty.
  useEffect(() => {
    let active = true;
    void Promise.all([storyService.getDraft(), storyService.getSubmission()]).then(([draft, submission]) => {
      if (!active) return;
      setInitial(draft ?? (submission ? { title: submission.title, met: submission.met, body: submission.body, consent: submission.consent } : EMPTY));
    });
    return () => {
      active = false;
    };
  }, []);

  if (!initial) return null;
  return <StoryForm initial={initial} />;
}

function StoryForm({ initial }: { initial: StoryDraft }) {
  const copy = getStoriesPage();
  const form = copy.create;
  const [draft, setDraft] = useState(initial);
  const [errors, setErrors] = useState<Errors>({});
  const [phase, setPhase] = useState<"form" | "error" | "pending">("form");
  const [busy, setBusy] = useState(false);
  const months = recentMonths(form.limits.months);

  const change = (patch: Partial<StoryDraft>) => {
    const next = { ...draft, ...patch };
    setDraft(next);
    setErrors({});
    void storyService.saveDraft(next);
  };

  const validate = (): Errors => {
    const found: Errors = {};
    if (!draft.title.trim()) found.title = form.errors.title;
    if (!draft.met) found.met = form.errors.met;
    if (draft.body.trim().length < form.limits.bodyMin) found.body = form.errors.body;
    if (!draft.consent) found.consent = form.errors.consent;
    return found;
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (busy) return;
    const found = validate();
    setErrors(found);
    if (Object.keys(found).length > 0) return;
    setBusy(true);
    try {
      await storyService.submit({ ...draft, title: draft.title.trim(), body: draft.body.trim() });
      setPhase("pending");
    } catch {
      setPhase("error");
    }
    setBusy(false);
  };

  if (phase === "pending") {
    const { pending } = copy;
    return (
      <Workspace aside={<StoryContext />}>
        <PortalBack action={copy.back} />
        <FormHeader variant="portalStatus" title={pending.title} description={pending.description} />
        <StatusBadge variant="urgent" label={pending.badge} />
        <StatusSummary summary={pending.summary} />
        <ActionRow>
          <ActionButton action={pending.primary} variant="confirm" size="portalPill" width="actionSlot" />
          <ActionButton action={pending.secondary} variant="roseOutline" size="portalPill" width="actionSlot" />
        </ActionRow>
      </Workspace>
    );
  }

  const failed = phase === "error";
  return (
    <Workspace aside={<StoryContext />}>
      <PortalBack action={copy.back} />
      <form onSubmit={submit} noValidate aria-busy={busy || undefined} className="flex w-full flex-col gap-5">
        <FormHeader variant={failed ? "portal" : "portalStatus"} title={failed ? form.error.title : form.title} description={failed ? form.error.description : form.description} />
        {failed ? (
          <StatusNote variant="alert" message={form.error.note} />
        ) : (
          <div className="relative h-45 w-full overflow-hidden rounded-16">
            <Image src={form.photo.src} alt={form.photo.alt} fill sizes="(min-width: 1280px) 860px, 100vw" className="object-cover" />
          </div>
        )}
        <TextField
          label={form.fields.title}
          value={draft.title}
          onChange={(title) => change({ title })}
          placeholder={form.placeholders.title}
          maxLength={form.limits.title}
          state={errors.title ? "error" : "default"}
          message={errors.title}
        />
        {!failed && (
          <SelectField
            label={form.fields.met}
            value={draft.met}
            onChange={(met) => change({ met })}
            options={months}
            placeholder={form.placeholders.met}
            state={errors.met ? "error" : "default"}
            message={errors.met}
          />
        )}
        <TextAreaField label={form.fields.body} value={draft.body} onChange={(body) => change({ body })} placeholder={form.placeholders.body} maxLength={form.limits.body} message={errors.body} />
        {!failed && (
          <div className="flex flex-col gap-2">
            <CheckboxField label={form.consent} checked={draft.consent} onChange={(consent) => change({ consent })} />
            {errors.consent && <StatusNote variant="alert" message={errors.consent} />}
          </div>
        )}
        <ActionRow>
          <Button type="submit" variant="confirm" size="portalPill" width="actionSlot" disabled={busy} aria-busy={busy || undefined}>
            {busy ? form.submitting : failed ? form.error.retry : form.submit}
          </Button>
        </ActionRow>
      </form>
    </Workspace>
  );
}
