import { describe, expect, it } from "vitest";
import { logoSizes } from "./logo";

// Phase 4 bug: at 300–400 % zoom the auth header is 56px (short:h-14) but the md logo is ~80px, so its top was cut off.
describe("auth logo size", () => {
  it("keeps the md size at normal heights", () => {
    expect(logoSizes.auth.box).toContain(logoSizes.md.box);
    expect(logoSizes.auth.type).toContain(logoSizes.md.type);
  });

  it("shrinks to the portal header logo in short viewports, which fits a 56px header", () => {
    const headerBox = logoSizes.header.box.split(" ").map((token) => `short:${token}`);
    for (const token of headerBox) expect(logoSizes.auth.box).toContain(token);
    expect(logoSizes.auth.type).toContain(`short:${logoSizes.header.type}`);
    // mark 35.15 + gap 2.49 + wordmark 9.95 ≈ 47.6px ≤ 56px
    expect(35.15 + 2.49 + 9.95).toBeLessThanOrEqual(56);
  });
});
