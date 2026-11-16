import { describe, expect, it } from "vitest";
import { shouldLead } from "./use-primary-in-view";

describe("shouldLead (primary control in view at high zoom)", () => {
  it("leads with the region when the control starts below a 400 % zoom viewport", () => {
    expect(shouldLead(773, 360, 225)).toBe(true);
    expect(shouldLead(366, 480, 300)).toBe(true);
  });

  it("does nothing when the control is already visible", () => {
    expect(shouldLead(200, 360, 225)).toBe(false);
    expect(shouldLead(226, 360, 225)).toBe(false);
  });

  it("never moves the multi-column layouts (1024px and wider), even when the control is below the fold", () => {
    expect(shouldLead(910, 1440, 900)).toBe(false);
    expect(shouldLead(852, 1152, 720)).toBe(false);
    expect(shouldLead(1200, 1024, 768)).toBe(false);
  });

  it("covers every stacked width up to 1023px", () => {
    expect(shouldLead(700, 1023, 600)).toBe(true);
    expect(shouldLead(700, 960, 600)).toBe(true);
  });
});
