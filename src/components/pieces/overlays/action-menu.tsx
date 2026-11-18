"use client";

import { useEffect, useId, useReducer, useRef, type KeyboardEvent } from "react";
import { ActionTarget } from "@/components/pieces/actions/action-target";
import { Icon } from "@/components/pieces/content/icon";
import { Text } from "@/components/pieces/content/text";
import { Button } from "@/components/ui/button";
import type { IconName } from "@/data/types";
import { cn } from "@/lib/cn";
import type { Destination } from "@/lib/routes";
import { closedMenu, menuReducer } from "@/components/pieces/overlays/action-menu.logic";

/** One entry: a handler, or a destination (a link, or `notFunctional` → aria-disabled with its reason). */
export type MenuItem = { id: string; label: string; icon?: IconName; onSelect?: () => void; to?: Destination };

const placements = {
  /** Above the trigger (the composer's "+"). */
  above: "bottom-full mb-2",
  /** Below the trigger (the conversation header's options). */
  below: "top-full mt-2",
} as const;

const aligns = { start: "left-0", end: "right-0" } as const;

const itemClass =
  "focus-ring flex min-h-11 w-full cursor-pointer items-center gap-3 rounded-12 px-3 py-2 text-left transition-colors hover:bg-rose-light focus-visible:bg-rose-light aria-disabled:cursor-not-allowed aria-disabled:opacity-60";

type ActionMenuProps = {
  /** The trigger's accessible name ("Conversation actions"); also names the menu. */
  label: string;
  icon: IconName;
  items: MenuItem[];
  placement?: keyof typeof placements;
  align?: keyof typeof aligns;
  /** Placement only (rule 17). */
  className?: string;
};

/**
 * A 44px round menu button with a popover menu (WAI-ARIA menu button): click, Enter, Space or
 * ArrowDown open it on the first item; the arrows, Home and End move; Escape returns focus to the
 * trigger; Tab or a click outside closes it. Phones and short viewports get a bottom sheet, so it
 * never clips. Exempt from `revealDelay`: it renders inside a piece that reveals.
 */
export function ActionMenu({ label, icon, items, placement = "above", align = "start", className }: ActionMenuProps) {
  const [state, dispatch] = useReducer(menuReducer, closedMenu);
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const menu = useRef<HTMLDivElement>(null);
  const id = useId();

  // Focus follows the active item.
  useEffect(() => {
    if (state.open) menu.current?.querySelectorAll<HTMLElement>('[role="menuitem"]')[state.active]?.focus();
  }, [state]);

  // A click or tap outside closes it.
  useEffect(() => {
    if (!state.open) return;
    const outside = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) dispatch({ type: "close" });
    };
    document.addEventListener("pointerdown", outside);
    return () => document.removeEventListener("pointerdown", outside);
  }, [state.open]);

  const onKeyDown = (event: KeyboardEvent) => {
    // Enter / Space on an item activate it natively.
    if (state.open && (event.key === "Enter" || event.key === " ")) return;
    const next = menuReducer(state, { type: "key", key: event.key, count: items.length });
    if (next === state) return;
    if (event.key !== "Tab") event.preventDefault();
    dispatch({ type: "key", key: event.key, count: items.length });
    if (event.key === "Escape") trigger.current?.focus();
  };

  const choose = (item: MenuItem) => {
    dispatch({ type: "close" });
    trigger.current?.focus();
    item.onSelect?.();
  };

  return (
    <div ref={root} className={cn("relative shrink-0", className)} onKeyDown={onKeyDown}>
      <Button
        ref={trigger}
        type="button"
        variant="roseOutline"
        size="icon"
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={state.open}
        aria-controls={state.open ? id : undefined}
        onClick={() => dispatch({ type: "toggle" })}
      >
        <Icon name={icon} size={20} tone="rose" />
      </Button>
      {state.open && (
        <div
          ref={menu}
          id={id}
          role="menu"
          aria-label={label}
          className={cn(
            "absolute z-50 flex w-60 flex-col gap-1 overflow-y-auto rounded-16 border border-divider bg-white p-2 shadow-picker",
            placements[placement],
            aligns[align],
            // Bottom sheet on phones and in short viewports (300–400 % zoom).
            "max-sm:fixed max-sm:inset-x-0 max-sm:top-auto max-sm:bottom-0 max-sm:m-0 max-sm:max-h-[calc(var(--svh)-16px)] max-sm:w-auto max-sm:rounded-b-none",
            "short:fixed short:inset-x-0 short:top-auto short:bottom-0 short:m-0 short:max-h-[calc(var(--svh)-16px)] short:w-auto short:rounded-b-none",
          )}
        >
          {items.map((item) => {
            const content = (
              <>
                {item.icon && <Icon name={item.icon} size={20} tone="rose" />}
                <Text as="span" variant="text14Semibold" tone="strong" className="min-w-0 flex-1">
                  {item.label}
                  {item.to && "notFunctional" in item.to && <span className="sr-only"> ({item.to.notFunctional})</span>}
                </Text>
              </>
            );
            return item.to ? (
              <ActionTarget key={item.id} to={item.to} role="menuitem" tabIndex={-1} onClick={() => dispatch({ type: "close" })} className={itemClass}>
                {content}
              </ActionTarget>
            ) : (
              <button key={item.id} type="button" role="menuitem" tabIndex={-1} onClick={() => choose(item)} className={itemClass}>
                {content}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
