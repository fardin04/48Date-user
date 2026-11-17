import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { nicknameStep } from "@/data/onboarding/about";

/** Phase 5 layout fixes, read from the source (Vitest runs in node; the zoom matrix is in the QA report). */
const source = (path: string) => readFileSync(join(process.cwd(), "src/components", path), "utf8");
const shell = source("pieces/shells/setup-shell.tsx");
const step = source("pieces/shells/setup-step.tsx");
const dialog = source("pieces/forms/option-dialog-field.tsx");
const nickname = source("sections/onboarding/nickname-step.tsx");
const choiceGroup = source("pieces/forms/choice-group.tsx");
const optionRow = source("pieces/forms/option-row.tsx");

describe("guided setup at every zoom (rules 46–49, 59)", () => {
  it("scales as one piece past the 1440 frame and sizes heights with --svh", () => {
    expect(shell).toContain("fit-portal");
    // Raw svh would be zoomed twice inside the fitted body.
    expect(shell.replaceAll("var(--svh)", "")).not.toMatch(/svh/);
  });

  it("keeps the Back / Continue row in view while the step overflows the screen", () => {
    expect(step).toMatch(/className="sticky bottom-0 [^"]*bg-white/);
    // The row lays its padding over the panel's own, so the frame doesn't change when it fits.
    expect(step).toMatch(/-mb-6 [^"]*pb-6 md:-mb-8 md:pb-8/);
  });

  it("tightens the frame in short viewports (300–400 % zoom)", () => {
    expect(shell).toMatch(/short:py-3/);
    expect(step).toMatch(/top: "[^"]*short:pt-4"/);
  });

  it("pins the occupation dialog's confirm while its list scrolls", () => {
    expect(dialog).toMatch(/className="sticky -bottom-8 [^"]*bg-white/);
    expect(dialog).toMatch(/short:p-4/);
  });

  it("lets choice and area rows shrink to the column (no sideways scroll at 400 %)", () => {
    // An implicit grid track is sized to its content; grid-cols-1 is minmax(0, 1fr).
    expect(choiceGroup).toContain('"grid grid-cols-1 gap-4"');
  });

  it("wraps long area names instead of truncating them (LOC-MANUAL at 360 px)", () => {
    expect(optionRow).toMatch(/area: \{ box: "min-h-16[^}]*label: "break-anywhere" \}/);
  });

  it("reads the D-117 lock notice from data", () => {
    expect(nicknameStep.locked).toBe("Your nickname is permanent once chosen (D-117).");
    expect(nickname).toContain("copy.locked");
    expect(nickname).not.toContain("permanent once chosen");
  });
});
