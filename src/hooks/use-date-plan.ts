import { useEffect, useState } from "react";
import type { MemberId } from "@/data/portal/types";
import { dateService, type DatePlan } from "@/lib/portal/date-service";

const POLL_MS = 2000;

/**
 * The member's date plan. While an invitation is pending it checks the service every two seconds,
 * so DATE-PENDING moves on to the answer by itself; `setPlan` applies a service result directly.
 */
export function useDatePlan(member: MemberId) {
  const [plan, setPlan] = useState<DatePlan | null>(null);

  useEffect(() => {
    let active = true;
    void dateService.getPlan(member).then((loaded) => {
      if (active) setPlan(loaded);
    });
    return () => {
      active = false;
    };
  }, [member]);

  const pending = plan?.status === "pending";
  useEffect(() => {
    if (!pending) return;
    const timer = setInterval(() => {
      void dateService.getPlan(member).then((loaded) => {
        if (loaded.status !== "pending") setPlan(loaded);
      });
    }, POLL_MS);
    return () => clearInterval(timer);
  }, [member, pending]);

  return { plan, setPlan };
}
