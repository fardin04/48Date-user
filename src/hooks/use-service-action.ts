import { useState } from "react";
import { failureReason } from "@/lib/portal/failure";

/**
 * One service write behind a button: ignores repeat clicks while busy and keeps the failure to
 * show (the API's own reason, or `fallback`), so a rejected call never leaves the button stuck.
 * `run` resolves true when the action succeeded.
 */
export function useServiceAction(fallback: string) {
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);
  const run = async (action: () => Promise<unknown>) => {
    if (busy) return false;
    setBusy(true);
    setFailure(null);
    try {
      await action();
      return true;
    } catch (error) {
      setFailure(failureReason(error) ?? fallback);
      return false;
    } finally {
      setBusy(false);
    }
  };
  return { busy, failure, run };
}
