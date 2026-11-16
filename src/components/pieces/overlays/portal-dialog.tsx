"use client";

import type { ReactNode } from "react";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/cn";
import { Icon } from "@/components/pieces/content/icon";
import { Text } from "@/components/pieces/content/text";

type PortalDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  closeLabel: string;
  /** Artwork and notes between the header and the actions. */
  children?: ReactNode;
  /** Stacked full-width actions. */
  actions: ReactNode;
  /** W05 dialogs keep the 128px Modal Header; W06 headers fit their text. */
  header?: "tall" | "fit";
};

/**
 * W05 centred modal (MSG-01, BLOCK): Align UI Modal Header with a close button, content and
 * stacked actions on a 520px panel. Escape, the close button and the backdrop all close it.
 */
export function PortalDialog({ open, onOpenChange, title, description, closeLabel, children, actions, header = "tall" }: PortalDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* Short viewports (300–400 % zoom): tighter padding, no tall header, actions pinned to the bottom of the scrolling panel (rule 49). */}
      <DialogContent className="flex max-w-130 flex-col items-center gap-6 rounded-24 p-8 max-sm:p-6 short:gap-4 short:p-4">
        <div className={cn("relative flex w-full items-center", header === "tall" && "min-h-32 short:min-h-0", "border-b border-soft-line py-4 pr-10 pl-5 max-sm:pl-0 short:py-2")}>
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <DialogTitle asChild>
              <Text as="h2" variant="dialogTitle24" tone="strong">
                {title}
              </Text>
            </DialogTitle>
            <DialogDescription asChild>
              <Text variant="text14" tone="sub">
                {description}
              </Text>
            </DialogDescription>
          </div>
          <DialogClose aria-label={closeLabel} className="focus-ring absolute top-4 right-4 flex cursor-pointer rounded-6 p-0.5 text-sub hover:text-strong">
            <Icon name="close-line" size={20} />
          </DialogClose>
        </div>
        {children}
        <div className="flex w-full flex-col gap-3 short:sticky short:-bottom-4 short:bg-white short:py-2">{actions}</div>
      </DialogContent>
    </Dialog>
  );
}
