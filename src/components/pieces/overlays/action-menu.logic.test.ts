import { describe, expect, it } from "vitest";
import { closedMenu, menuReducer, type MenuState } from "@/components/pieces/overlays/action-menu.logic";

const key = (state: MenuState, name: string, count = 6) => menuReducer(state, { type: "key", key: name, count });
const open = (active = 0): MenuState => ({ open: true, active });

describe("ActionMenu keyboard and pointer logic", () => {
  it("opens on click, Enter, Space and ArrowDown with the first item focused; ArrowUp on the last", () => {
    expect(menuReducer(closedMenu, { type: "toggle" })).toEqual(open(0));
    expect(key(closedMenu, "Enter")).toEqual(open(0));
    expect(key(closedMenu, " ")).toEqual(open(0));
    expect(key(closedMenu, "ArrowDown")).toEqual(open(0));
    expect(key(closedMenu, "ArrowUp")).toEqual(open(5));
    expect(key(closedMenu, "a")).toEqual(closedMenu);
  });

  it("moves with the arrows (wrapping), Home and End", () => {
    expect(key(open(0), "ArrowDown")).toEqual(open(1));
    expect(key(open(5), "ArrowDown")).toEqual(open(0));
    expect(key(open(0), "ArrowUp")).toEqual(open(5));
    expect(key(open(3), "Home")).toEqual(open(0));
    expect(key(open(1), "End")).toEqual(open(5));
  });

  it("closes on Escape, Tab, a second click and an outside click", () => {
    expect(key(open(2), "Escape")).toEqual(closedMenu);
    expect(key(open(2), "Tab")).toEqual(closedMenu);
    expect(menuReducer(open(2), { type: "toggle" })).toEqual(closedMenu);
    expect(menuReducer(open(2), { type: "close" })).toEqual(closedMenu);
  });

  it("ignores keys when there are no items", () => {
    expect(key(closedMenu, "Enter", 0)).toEqual(closedMenu);
  });
});
