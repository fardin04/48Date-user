/** Open state and the focused item of an `ActionMenu` (`active` is -1 while closed). */
export type MenuState = { open: boolean; active: number };

export type MenuEvent =
  | { type: "toggle" }
  | { type: "close" }
  /** A key pressed on the trigger or inside the menu; `count` is the number of items. */
  | { type: "key"; key: string; count: number };

export const closedMenu: MenuState = { open: false, active: -1 };

/**
 * WAI-ARIA menu button keys: Enter / Space / ArrowDown open on the first item, ArrowUp on the last;
 * inside, the arrows wrap, Home / End jump, Escape and Tab close. Outside clicks send `close`.
 */
export function menuReducer(state: MenuState, event: MenuEvent): MenuState {
  if (event.type === "close") return closedMenu;
  if (event.type === "toggle") return state.open ? closedMenu : { open: true, active: 0 };
  const { key, count } = event;
  if (count === 0) return state;
  if (!state.open) {
    if (key === "Enter" || key === " " || key === "ArrowDown") return { open: true, active: 0 };
    if (key === "ArrowUp") return { open: true, active: count - 1 };
    return state;
  }
  switch (key) {
    case "ArrowDown":
      return { open: true, active: (state.active + 1) % count };
    case "ArrowUp":
      return { open: true, active: (state.active - 1 + count) % count };
    case "Home":
      return { open: true, active: 0 };
    case "End":
      return { open: true, active: count - 1 };
    case "Escape":
    case "Tab":
      return closedMenu;
    default:
      return state;
  }
}
