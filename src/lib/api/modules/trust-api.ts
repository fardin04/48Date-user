import { cached, invalidate } from "../cache";
import { api } from "../client";
import { endpoints } from "../endpoints";
import type { BlockedUser, BlockSource, ReportBody, ReportData, ReportReasonGroup, Warning } from "../types/trust";
import { cacheKeys } from "./cache-keys";

/** Blocking ends the match and closes the conversation for both members. */
const afterBlockChange = () => invalidate(cacheKeys.blocks, cacheKeys.matches, cacheKeys.conversations, cacheKeys.discoveryRun, cacheKeys.discoveryProfile);

/** User / 11 - Trust & Safety: report reasons, reports, blocks and moderation warnings. */
export const trustApi = {
  /** Static catalogue; kept for an hour. */
  reportReasons: () => cached(cacheKeys.reportReasons, 60 * 60_000, () => api.get<ReportReasonGroup[]>(endpoints.trust.reportReasons)),
  async report(body: ReportBody) {
    const result = await api.post<ReportData>(endpoints.trust.reports, { body });
    if (body.alsoBlock) afterBlockChange();
    return result;
  },
  async block(nickname: string, source: BlockSource) {
    const result = await api.post<{ blockedNickname: string }>(endpoints.trust.blocks, { body: { nickname, source } });
    afterBlockChange();
    return result;
  },
  blocked: () => cached(cacheKeys.blocks, 30_000, () => api.get<BlockedUser[]>(endpoints.trust.blocks, { query: { limit: 100 } })),
  async unblock(nickname: string) {
    const result = await api.delete<{ unblockedNickname: string }>(endpoints.trust.block(nickname));
    afterBlockChange();
    return result;
  },
  pendingWarnings: () => cached(cacheKeys.warnings, 60_000, () => api.get<Warning[]>(endpoints.users.pendingWarnings)),
  async acknowledgeWarning(id: string) {
    const result = await api.post<unknown>(endpoints.users.acknowledgeWarning(id));
    invalidate(cacheKeys.warnings);
    return result;
  },
};
