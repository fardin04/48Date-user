import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const css = readFileSync(join(process.cwd(), "src/app/globals.css"), "utf8");

/** [min-width, page class, --fit] for every zoom-out step in globals.css. */
const steps = [...css.matchAll(/@media \(min-width: (\d+)px\) \{([^\n]*)\}/g)].flatMap(([, width, body]) =>
  [...body.matchAll(/body:has\(\.(fit-\w+)\) \{ --fit: ([\d.]+); \}/g)].map(([, page, fit]) => [Number(width), page, Number(fit)] as const),
);

const frames = { "fit-portal": 1440, "fit-landing": 1920 } as const;

describe("zoom-out fit (rules 46 / 47)", () => {
  it("defines steps for the portal and the landing page", () => {
    expect(steps.filter(([, page]) => page === "fit-portal").map(([width]) => width)).toEqual([1600, 1920, 2400, 2880, 3840]);
    expect(steps.filter(([, page]) => page === "fit-landing").map(([width]) => width)).toEqual([2400, 2880, 3840]);
  });

  it.each(steps)("at %ipx %s scales by viewport ÷ its design frame", (width, page, fit) => {
    expect(fit).toBeCloseTo(width / frames[page as keyof typeof frames], 3);
  });

  it("lays the page out at its design frame at 50 % and 75 % zoom of a 1440 window", () => {
    const fitAt = (width: number, page: string) => steps.filter(([w, p]) => p === page && w <= width).at(-1)?.[2] ?? 1;
    expect(2880 / fitAt(2880, "fit-portal")).toBe(1440);
    expect(Math.round(1920 / fitAt(1920, "fit-portal"))).toBe(1440);
    expect(2880 / fitAt(2880, "fit-landing")).toBe(1920);
    expect(3840 / fitAt(3840, "fit-landing")).toBe(1920);
  });

  it("undoes the zoom for viewport heights inside the page", () => {
    expect(css).toContain("--svh: calc(100svh / var(--fit))");
    expect(css).toContain("zoom: var(--fit)");
  });
});
