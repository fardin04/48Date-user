import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { to } from "@/lib/routes";
import { getAuthShared } from "@/stores/auth-store";
import { ActionLink } from "@/components/pieces/actions/action-link";
import { AuthPhotoPanel } from "@/components/pieces/shells/auth-photo-panel";
import { Logo } from "@/components/pieces/brand/logo";
import { Text } from "@/components/pieces/content/text";

/** The 432px form column shared by the header, form and footer rows. */
const COLUMN = "mx-auto w-full max-w-108";

type AuthShellProps = {
  /** SIGNIN-GOOGLE draws "Back to website" under the form instead of in the header. */
  backPosition?: "top" | "bottom";
  children: ReactNode;
};

/**
 * Authentication frame. ≥1024px: photo panel + form panel (648/696 at 1440, 400/528 at 1024).
 * <1024px (AUTH-PORTRAIT): photo panel hidden, logo joins the header, form column stays 432px.
 */
export function AuthShell({ backPosition = "top", children }: AuthShellProps) {
  const shared = getAuthShared();
  const back = <ActionLink action={shared.back} variant="back" />;
  return (
    <div className="min-h-svh bg-white md:p-6 lg:grid lg:grid-cols-[clamp(400px,calc(59.62vw-210.5px),648px)_minmax(0,1fr)] lg:gap-12">
      <AuthPhotoPanel revealDelay={0} className="max-lg:hidden lg:sticky lg:top-6 lg:h-[calc(100svh-48px)] lg:min-h-160" />
      <div className="flex min-h-svh flex-col px-4 pb-4 md:min-h-[calc(100svh-48px)] md:px-0 md:pb-0">
        <header className={cn(COLUMN, "flex h-20 shrink-0 items-center justify-between gap-6", backPosition === "bottom" && "lg:hidden")}>
          <Logo size="md" to={to("L02")} className="lg:hidden" />
          {backPosition === "top" && back}
        </header>
        <main className={cn(COLUMN, "flex-1 pt-10 max-md:pb-10")}>{children}</main>
        {backPosition === "bottom" && <div className={cn(COLUMN, "flex h-20 items-center")}>{back}</div>}
        <footer className={cn(COLUMN, "h-8 shrink-0")}>
          <Text variant="text12" tone="sub">
            {shared.footer}
          </Text>
        </footer>
      </div>
    </div>
  );
}
