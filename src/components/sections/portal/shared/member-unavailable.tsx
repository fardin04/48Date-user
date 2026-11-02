import { PortalBack } from "@/components/pieces/actions/portal-back";
import { getMemberCopy, getPortalShell } from "@/stores/portal-store";
import { StatusScreen } from "@/components/sections/portal/shared/status-screen";

/** A member page whose member is blocked, banned or deleted (the API's `UNAVAILABLE`). */
export function MemberUnavailable() {
  const { unavailable } = getMemberCopy();
  return (
    <StatusScreen
      back={<PortalBack action={getPortalShell().back} />}
      title={unavailable.title}
      description={unavailable.description}
      primary={unavailable.primary}
    />
  );
}
