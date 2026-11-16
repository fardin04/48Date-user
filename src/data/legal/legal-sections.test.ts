import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { hrefFor, notFoundSegment, sectionFromParam, type Destination } from "@/lib/routes";
import { layout } from "@/lib/control-sizes";
import { getLegalDocument, type LegalDocumentName } from "@/stores/legal-store";
import { getFooter } from "@/stores/site-store";
import { warningCopy } from "@/data/portal/account";

const docs: [LegalDocumentName, string][] = [
  ["terms", "/terms"],
  ["privacy", "/privacy"],
];

describe.each(docs)("legal sections: %s", (name, base) => {
  const legalDoc = getLegalDocument(name);
  const ids = legalDoc.sections.map((section) => section.id);

  it("builds every contents entry as a path under the document, never a #hash", () => {
    expect(hrefFor(legalDoc.screen)).toBe(base);
    for (const id of ids) expect(hrefFor(legalDoc.screen, id)).toBe(`${base}/${id}`);
  });

  it("uses unique, URL-safe ids with a title and body each", () => {
    expect(new Set(ids).size).toBe(ids.length);
    for (const section of legalDoc.sections) {
      expect(section.id).toMatch(/^[a-z]+(-[a-z]+)*$/);
      expect(section.title.trim()).not.toBe("");
      expect(section.body.trim()).not.toBe("");
    }
  });

  it("accepts the document root and every section id, and rejects anything else", () => {
    expect(sectionFromParam(undefined, ids)).toEqual({ valid: true, section: undefined });
    expect(sectionFromParam([], ids)).toEqual({ valid: true, section: undefined });
    for (const id of ids) expect(sectionFromParam([id], ids)).toEqual({ valid: true, section: id });
    expect(sectionFromParam(["unknown-section"], ids).valid).toBe(false);
    expect(sectionFromParam([notFoundSegment], ids).valid).toBe(false);
    expect(sectionFromParam([ids[0], ids[1]], ids).valid).toBe(false);
    expect(sectionFromParam([ids[0].toUpperCase()], ids).valid).toBe(false);
  });
});

describe("legal links and reading layout", () => {
  it("keeps Terms keyed L02-TC and Privacy L03", () => {
    expect(getLegalDocument("terms").screen).toBe("L02-TC");
    expect(getLegalDocument("privacy").screen).toBe("L03");
  });

  it("points the footer and the moderation warning's guidelines link at real legal pages / sections", () => {
    const targets = getFooter()
      .columns.flatMap((column) => column.links)
      .map((link) => link.to as Destination & { screen?: string })
      .filter((target) => target.screen === "L02-TC" || target.screen === "L03");
    expect(targets.map((target) => target.screen).sort()).toEqual(["L02-TC", "L03"]);
    const guidelines = warningCopy.guidelines.to as { screen: string; section: string };
    expect(getLegalDocument("terms").sections.map((section) => section.id)).toContain(guidelines.section);
  });

  it("caps the reading text by a character measure, not a pixel width", () => {
    const css = readFileSync("src/app/globals.css", "utf8");
    expect(css).toMatch(/--container-measure:\s*\d+ch;/);
    expect(layout.readingMeasure).toBe("max-w-measure");
    expect(layout.readingColumn).toContain("break-anywhere");
  });
});
