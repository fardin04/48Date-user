import { useQueryClient } from "@tanstack/react-query";
import type { MemberId } from "@/data/portal/types";
import { apiEnabled } from "@/lib/api/config";
import { dateService, type DatePlan } from "@/lib/portal/date-service";
import { screenKeys } from "@/lib/screen-keys";
import { useLoaded } from "./use-loaded";

/** While an invitation waits for an answer the plan is read again this often (the mock answers in ~6s). */
const POLL_MS = apiEnabled ? 10_000 : 2000;

/**
 * The member's date plan, shared by every date screen. While an invitation is pending it is read
 * again on a timer (chained by TanStack Query), so DATE-PENDING moves on to the answer by itself;
 * `setPlan` applies a service result directly.
 */
export function useDatePlan(member: MemberId) {
  const queryClient = useQueryClient();
  const key = screenKeys.datePlan(member);
  const { value } = useLoaded(key, () => dateService.getPlan(member), {
    refetchInterval: (plan) => (plan?.status === "pending" ? POLL_MS : false),
  });
  return {
    plan: value ?? null,
    setPlan: (plan: DatePlan) => queryClient.setQueryData(key, plan),
  };
}
