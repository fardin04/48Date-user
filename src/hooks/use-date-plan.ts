import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import type { MemberId } from "@/data/portal/types";
import { apiEnabled } from "@/lib/api/config";
import { dateService, type DatePlan } from "@/lib/portal/date-service";
import { screenKeys } from "@/lib/screen-keys";
import { useLoaded } from "./use-loaded";

/** The mock has no live events: while its invitation waits for an answer (~6s) the plan is read again this often. */
const MOCK_POLL_MS = 2000;

/**
 * The member's date plan, shared by every date screen. With the API it stays live through the
 * socket's `date:*` events (rule 43), so DATE-PENDING and ATTENDANCE-WAIT move on by themselves;
 * `setPlan` applies a service result directly.
 */
export function useDatePlan(member: MemberId) {
  const queryClient = useQueryClient();
  const key = screenKeys.datePlan(member);
  useEffect(() => dateService.watch(member), [member]);
  const { value } = useLoaded(key, () => dateService.getPlan(member), {
    refetchInterval: (plan) => (!apiEnabled && plan?.status === "pending" ? MOCK_POLL_MS : false),
  });
  return {
    plan: value ?? null,
    setPlan: (plan: DatePlan) => queryClient.setQueryData(key, plan),
  };
}
