import type { ScreenCode } from "@/lib/routes";

export type LegalSection = { id: string; title: string; body: string };

export type LegalDocument = {
  screen: ScreenCode;
  metaDescription: string;
  title: string;
  subtitle: string;
  sections: LegalSection[];
};
