import { to } from "@/lib/routes";
import type { Action } from "../types";

export const legalShared = {
  eyebrow: "48DATE / LEGAL",
  contentsLabel: "ON THIS PAGE",
  back: { label: "Back to 48Date", to: to("L02") } satisfies Action,
};
