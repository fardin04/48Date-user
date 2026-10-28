import { getAuthShared } from "@/stores/auth-store";
import { ActionLink } from "@/components/pieces/actions/action-link";
import { Text } from "@/components/pieces/content/text";

/** "By continuing, you confirm you’re 18 or older…" with links to the legal pages. */
export function ConsentNote({ revealDelay }: { revealDelay?: number }) {
  const { consent } = getAuthShared();
  return (
    <Text variant="text14Relaxed" tone="sub" revealDelay={revealDelay}>
      {consent.before}
      <ActionLink action={consent.terms} variant="consent" />
      {consent.between}
      <ActionLink action={consent.privacy} variant="consent" />
      {consent.after}
    </Text>
  );
}
