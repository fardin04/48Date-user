import type { ReactNode } from "react";
import { ActionButton } from "@/components/pieces/actions/action-button";
import { ActionRow } from "@/components/pieces/actions/action-row";
import { FormHeader } from "@/components/pieces/forms/form-header";
import { StatusSummary } from "@/components/pieces/feedback/status-summary";
import { Button } from "@/components/ui/button";
import type { StatusSummaryCopy } from "@/data/portal/types";
import type { Action } from "@/data/types";
import { FlowContext } from "@/components/sections/portal/shared/flow-context";
import { Workspace } from "@/components/sections/portal/shared/workspace";

/** A screen action: a link, or a button for an earlier state of the same screen (or a retry). */
export type ScreenAction = Action | { label: string; onClick: () => void; busy?: boolean };

type ActionWidth = "grow" | "actionSlot";

function ScreenButton({ action, primary, width }: { action: ScreenAction; primary: boolean; width: ActionWidth }) {
  const variant = primary ? "confirm" : "roseOutline";
  if ("to" in action) return <ActionButton action={action} variant={variant} size="portalPill" width={width} />;
  return (
    <Button type="button" variant={variant} size="portalPill" width={width} disabled={action.busy} aria-busy={action.busy || undefined} onClick={action.onClick}>
      {action.label}
    </Button>
  );
}

type StatusScreenProps = {
  back?: ReactNode;
  title: string;
  description: string;
  /** Status summary card, or artwork (MATCH-NEW, MATCH-EXPIRED). */
  summary?: StatusSummaryCopy;
  children?: ReactNode;
  primary: ScreenAction;
  secondary?: ScreenAction;
  /** Flow support column; defaults to the discovery flow context. */
  aside?: ReactNode;
  /** W04 actions share the row; W05 uses 200px slots. */
  actionWidth?: ActionWidth;
};

/** A W04 status screen: Back, heading, summary or artwork and the rose action pair. */
export function StatusScreen({ back, title, description, summary, children, primary, secondary, aside, actionWidth = "grow" }: StatusScreenProps) {
  return (
    <Workspace aside={aside ?? <FlowContext />}>
      {back}
      <FormHeader variant="portalStatus" title={title} description={description} />
      {summary && <StatusSummary summary={summary} />}
      {children}
      <ActionRow>
        <ScreenButton action={primary} primary width={actionWidth} />
        {secondary && <ScreenButton action={secondary} primary={false} width={actionWidth} />}
      </ActionRow>
    </Workspace>
  );
}
