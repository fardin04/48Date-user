import { legalShared } from "@/data/legal/shared";
import { privacy } from "@/data/legal/privacy";
import { terms } from "@/data/legal/terms";

const documents = { terms, privacy };

export type LegalDocumentName = keyof typeof documents;

export const getLegalDocument = (name: LegalDocumentName) => documents[name];
export const getLegalShared = () => legalShared;
